import { 
  PlaidApi, 
  Configuration, 
  PlaidEnvironments,
  AccountsGetRequest,
  TransactionsGetRequest,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
  TransactionsSyncRequest,
  PlaidError,
  CountryCode,
  Products
} from 'plaid';
import { PlaidItem, PlaidAccount, Transaction } from '@prisma/client';
import prisma from '../config/database';
import env, { getPlaidProducts, getPlaidCountryCodes } from '../config/env';
import { z } from 'zod';

// Plaid client configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments[env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID,
      'PLAID-SECRET': env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Validation schemas
export const linkTokenSchema = z.object({
  userId: z.string().uuid(),
  clientName: z.string().optional(),
});

export const exchangeTokenSchema = z.object({
  publicToken: z.string(),
  userId: z.string().uuid(),
});

export interface PlaidLinkToken {
  linkToken: string;
  expiration: string;
}

export interface PlaidAccountData {
  id: string;
  name: string;
  officialName?: string;
  type: string;
  subtype?: string;
  mask?: string;
  currentBalance?: number;
  availableBalance?: number;
  creditLimit?: number;
  isoCurrencyCode?: string;
}

export interface PlaidTransactionData {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category: string[];
  subcategory?: string;
  pending: boolean;
}

export interface DebtSummary {
  totalBalance: number;
  monthlyPayments: number;
  debts: Array<{
    accountId: string;
    name: string;
    balance: number;
    type: string;
    minimumPayment?: number;
    apr?: number;
  }>;
}

export class PlaidService {
  /**
   * Create link token for Plaid Link initialization
   */
  static async createLinkToken(data: z.infer<typeof linkTokenSchema>): Promise<PlaidLinkToken> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const request: LinkTokenCreateRequest = {
        user: {
          client_user_id: user.id,
        },
        client_name: data.clientName || 'DebtTruth Coach',
        products: getPlaidProducts() as Products[],
        country_codes: getPlaidCountryCodes() as CountryCode[],
        language: 'en',
        webhook: env.NODE_ENV === 'production' ? 'https://your-domain.com/webhooks/plaid' : undefined,
      };

      const response = await plaidClient.linkTokenCreate(request);
      
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
      };
    } catch (error) {
      console.error('Error creating link token:', error);
      throw new Error('Failed to create link token');
    }
  }

  /**
   * Exchange public token for access token and store item
   */
  static async exchangePublicToken(data: z.infer<typeof exchangeTokenSchema>): Promise<{ itemId: string; accounts: PlaidAccountData[] }> {
    try {
      // Exchange public token for access token
      const exchangeRequest: ItemPublicTokenExchangeRequest = {
        public_token: data.publicToken,
      };

      const exchangeResponse = await plaidClient.itemPublicTokenExchange(exchangeRequest);
      const { access_token, item_id } = exchangeResponse.data;

      // Get item and institution info
      const itemResponse = await plaidClient.itemGet({ access_token });
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: itemResponse.data.item.institution_id!,
        country_codes: getPlaidCountryCodes() as CountryCode[],
      });

      // Store Plaid item
      const plaidItem = await prisma.plaidItem.create({
        data: {
          userId: data.userId,
          itemId: item_id,
          accessToken: access_token, // In production, encrypt this!
          institutionId: itemResponse.data.item.institution_id!,
          institutionName: institutionResponse.data.institution.name,
        }
      });

      // Get and store accounts
      const accounts = await this.syncAccounts(plaidItem.id, access_token);

      return {
        itemId: item_id,
        accounts: accounts.map(account => ({
          id: account.accountId,
          name: account.name,
          officialName: account.officialName || undefined,
          type: account.type,
          subtype: account.subtype || undefined,
          mask: account.mask || undefined,
          currentBalance: account.currentBalance?.toNumber(),
          availableBalance: account.availableBalance?.toNumber(),
          creditLimit: account.creditLimit?.toNumber(),
          isoCurrencyCode: account.isoCurrencyCode || undefined,
        }))
      };
    } catch (error) {
      console.error('Error exchanging public token:', error);
      if (error instanceof Error && 'response' in error) {
        const plaidError = error as any;
        throw new Error(`Plaid error: ${plaidError.response?.data?.error_message || 'Unknown error'}`);
      }
      throw new Error('Failed to connect bank account');
    }
  }

  /**
   * Get accounts for a user
   */
  static async getUserAccounts(userId: string): Promise<PlaidAccountData[]> {
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId },
      include: { accounts: true }
    });

    const allAccounts: PlaidAccountData[] = [];

    for (const item of plaidItems) {
      for (const account of item.accounts) {
        allAccounts.push({
          id: account.accountId,
          name: account.name,
          officialName: account.officialName || undefined,
          type: account.type,
          subtype: account.subtype || undefined,
          mask: account.mask || undefined,
          currentBalance: account.currentBalance?.toNumber(),
          availableBalance: account.availableBalance?.toNumber(),
          creditLimit: account.creditLimit?.toNumber(),
          isoCurrencyCode: account.isoCurrencyCode || undefined,
        });
      }
    }

    return allAccounts;
  }

  /**
   * Sync accounts from Plaid
   */
  static async syncAccounts(plaidItemId: string, accessToken: string): Promise<PlaidAccount[]> {
    try {
      const request: AccountsGetRequest = { access_token: accessToken };
      const response = await plaidClient.accountsGet(request);

      const accounts: PlaidAccount[] = [];

      for (const account of response.data.accounts) {
        const existingAccount = await prisma.plaidAccount.findUnique({
          where: { accountId: account.account_id }
        });

        const accountData = {
          plaidItemId,
          accountId: account.account_id,
          name: account.name,
          officialName: account.official_name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          currentBalance: account.balances.current,
          availableBalance: account.balances.available,
          creditLimit: account.balances.limit,
          isoCurrencyCode: account.balances.iso_currency_code,
        };

        let savedAccount: PlaidAccount;

        if (existingAccount) {
          savedAccount = await prisma.plaidAccount.update({
            where: { id: existingAccount.id },
            data: accountData
          });
        } else {
          savedAccount = await prisma.plaidAccount.create({
            data: accountData
          });
        }

        accounts.push(savedAccount);
      }

      return accounts;
    } catch (error) {
      console.error('Error syncing accounts:', error);
      throw new Error('Failed to sync accounts');
    }
  }

  /**
   * Get debt summary from connected accounts
   */
  static async getDebtSummary(userId: string): Promise<DebtSummary> {
    const accounts = await prisma.plaidAccount.findMany({
      where: {
        plaidItem: { userId }
      },
      include: { plaidItem: true }
    });

    const debts = accounts.filter(account => 
      account.type === 'credit' || 
      account.type === 'loan' ||
      (account.type === 'depository' && account.subtype === 'line of credit')
    );

    let totalBalance = 0;
    let monthlyPayments = 0;

    const debtSummary = debts.map(account => {
      const balance = Math.abs(account.currentBalance?.toNumber() || 0);
      const minimumPayment = this.estimateMinimumPayment(balance, account.subtype || '');
      
      totalBalance += balance;
      monthlyPayments += minimumPayment;

      return {
        accountId: account.accountId,
        name: account.name,
        balance,
        type: account.subtype || account.type,
        minimumPayment,
        apr: this.estimateAPR(account.subtype || ''), // This is an estimate - real APR not available from Plaid
      };
    });

    return {
      totalBalance,
      monthlyPayments,
      debts: debtSummary
    };
  }

  /**
   * Sync transactions for a user
   */
  static async syncTransactions(userId: string, startDate?: Date, endDate?: Date): Promise<PlaidTransactionData[]> {
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId },
      include: { accounts: true }
    });

    const allTransactions: PlaidTransactionData[] = [];

    for (const item of plaidItems) {
      try {
        // Use transactions/sync for most up-to-date data
        const syncRequest: TransactionsSyncRequest = {
          access_token: item.accessToken,
          cursor: item.cursor || undefined,
        };

        const syncResponse = await plaidClient.transactionsSync(syncRequest);
        
        // Update cursor
        await prisma.plaidItem.update({
          where: { id: item.id },
          data: { cursor: syncResponse.data.next_cursor }
        });

        // Process transactions
        for (const transaction of syncResponse.data.added) {
          const existingTransaction = await prisma.transaction.findUnique({
            where: { transactionId: transaction.transaction_id }
          });

          if (!existingTransaction) {
            const savedTransaction = await prisma.transaction.create({
              data: {
                userId,
                plaidAccountId: item.accounts.find(acc => acc.accountId === transaction.account_id)?.id,
                transactionId: transaction.transaction_id,
                amount: transaction.amount,
                date: new Date(transaction.date),
                name: transaction.name,
                merchantName: transaction.merchant_name,
                category: transaction.category || [],
                subcategory: transaction.personal_finance_category?.primary,
                pending: transaction.pending || false,
                accountOwner: transaction.account_owner,
              }
            });

            allTransactions.push({
              id: savedTransaction.transactionId!,
              accountId: transaction.account_id,
              amount: transaction.amount,
              date: transaction.date,
              name: transaction.name,
              merchantName: transaction.merchant_name || undefined,
              category: transaction.category || [],
              subcategory: transaction.personal_finance_category?.primary,
              pending: transaction.pending || false,
            });
          }
        }
      } catch (error) {
        console.error(`Error syncing transactions for item ${item.itemId}:`, error);
        // Continue with other items
      }
    }

    return allTransactions;
  }

  /**
   * Remove Plaid item and associated data
   */
  static async removeItem(userId: string, itemId: string): Promise<void> {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { userId, itemId }
    });

    if (!plaidItem) {
      throw new Error('Plaid item not found');
    }

    try {
      // Remove item from Plaid
      await plaidClient.itemRemove({ access_token: plaidItem.accessToken });
    } catch (error) {
      console.error('Error removing item from Plaid:', error);
      // Continue with local cleanup even if Plaid removal fails
    }

    // Remove from database (cascades to accounts and transactions)
    await prisma.plaidItem.delete({
      where: { id: plaidItem.id }
    });
  }

  /**
   * Estimate minimum payment based on account type and balance
   */
  private static estimateMinimumPayment(balance: number, subtype: string): number {
    if (subtype.includes('credit')) {
      return Math.max(25, balance * 0.02); // 2% of balance, minimum $25
    }
    if (subtype.includes('loan')) {
      return balance * 0.01; // Rough estimate for loans
    }
    return 0;
  }

  /**
   * Estimate APR based on account type (rough estimates)
   */
  private static estimateAPR(subtype: string): number {
    if (subtype.includes('credit')) {
      return 18.0; // Average credit card APR
    }
    if (subtype.includes('auto')) {
      return 7.0; // Average auto loan APR
    }
    if (subtype.includes('student')) {
      return 5.5; // Average student loan APR
    }
    if (subtype.includes('mortgage')) {
      return 6.5; // Average mortgage APR
    }
    return 12.0; // Default estimate
  }

  /**
   * Get spending analysis
   */
  static async getSpendingAnalysis(userId: string, months: number = 3): Promise<{
    totalSpending: number;
    categorizedSpending: Record<string, number>;
    averageMonthlySpending: number;
    debtPayments: number;
  }> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate },
        amount: { gt: 0 } // Positive amounts are expenses in Plaid
      }
    });

    const categorizedSpending: Record<string, number> = {};
    let totalSpending = 0;
    let debtPayments = 0;

    transactions.forEach(transaction => {
      const amount = transaction.amount.toNumber();
      totalSpending += amount;

      const category = transaction.category[0] || 'Other';
      categorizedSpending[category] = (categorizedSpending[category] || 0) + amount;

      // Detect debt payments
      if (this.isDebtPayment(transaction.name, transaction.category)) {
        debtPayments += amount;
      }
    });

    return {
      totalSpending,
      categorizedSpending,
      averageMonthlySpending: totalSpending / months,
      debtPayments,
    };
  }

  /**
   * Check if transaction is a debt payment
   */
  private static isDebtPayment(name: string, categories: string[]): boolean {
    const lowerName = name.toLowerCase();
    const paymentKeywords = ['payment', 'autopay', 'card payment', 'loan payment'];
    const debtCategories = ['Credit Card Payment', 'Loan Payment'];
    
    return paymentKeywords.some(keyword => lowerName.includes(keyword)) ||
           categories.some(category => debtCategories.includes(category));
  }
}
