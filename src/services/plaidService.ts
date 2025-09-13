import { PlaidApi, Configuration, AccountsGetRequest, TransactionsGetRequest, ItemPublicTokenExchangeRequest } from 'plaid';

// Plaid configuration - in production, use environment variables
const configuration = new Configuration({
  basePath: process.env.REACT_APP_PLAID_ENV === 'production' 
    ? 'https://production.plaid.com' 
    : 'https://sandbox.plaid.com',
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.REACT_APP_PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.REACT_APP_PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: 'depository' | 'credit' | 'loan' | 'investment';
  subtype: string;
  balance: {
    available: number | null;
    current: number | null;
    limit: number | null;
  };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category: string[];
  merchant_name?: string;
}

export interface PlaidDebt {
  account_id: string;
  name: string;
  balance: number;
  apr?: number;
  minimum_payment?: number;
  type: 'credit_card' | 'loan' | 'line_of_credit';
  last_payment_amount?: number;
  last_payment_date?: string;
}

class PlaidService {
  private accessToken: string | null = null;

  // Exchange public token for access token
  async exchangePublicToken(publicToken: string): Promise<string> {
    try {
      const request: ItemPublicTokenExchangeRequest = {
        public_token: publicToken,
      };
      
      const response = await plaidClient.itemPublicTokenExchange(request);
      this.accessToken = response.data.access_token;
      
      // Store in localStorage for demo purposes (use secure storage in production)
      localStorage.setItem('plaid_access_token', this.accessToken);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to connect bank account');
    }
  }

  // Get stored access token
  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('plaid_access_token');
    }
    return this.accessToken;
  }

  // Fetch accounts from Plaid
  async getAccounts(): Promise<PlaidAccount[]> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const request: AccountsGetRequest = {
        access_token: accessToken,
      };
      
      const response = await plaidClient.accountsGet(request);
      
      return response.data.accounts.map(account => ({
        account_id: account.account_id,
        name: account.name,
        type: account.type as any,
        subtype: account.subtype || '',
        balance: {
          available: account.balances.available,
          current: account.balances.current,
          limit: account.balances.limit,
        }
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch account data');
    }
  }

  // Extract debt accounts (credit cards, loans, etc.)
  async getDebtAccounts(): Promise<PlaidDebt[]> {
    const accounts = await this.getAccounts();
    
    return accounts
      .filter(account => 
        account.type === 'credit' || 
        account.type === 'loan' ||
        (account.type === 'depository' && account.subtype === 'line of credit')
      )
      .map(account => ({
        account_id: account.account_id,
        name: account.name,
        balance: Math.abs(account.balance.current || 0),
        type: this.mapAccountSubtype(account.subtype),
        minimum_payment: this.estimateMinimumPayment(account.balance.current || 0, account.subtype),
      }));
  }

  // Get recent transactions for spending analysis
  async getTransactions(startDate: string, endDate: string): Promise<PlaidTransaction[]> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const request: TransactionsGetRequest = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };
      
      const response = await plaidClient.transactionsGet(request);
      
      return response.data.transactions.map(transaction => ({
        transaction_id: transaction.transaction_id,
        account_id: transaction.account_id,
        amount: transaction.amount,
        date: transaction.date,
        name: transaction.name,
        category: transaction.category || [],
        merchant_name: transaction.merchant_name || undefined,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transaction data');
    }
  }

  // Analyze spending patterns
  async getSpendingAnalysis(months: number = 3): Promise<{
    totalSpending: number;
    categorizedSpending: Record<string, number>;
    averageMonthlySpending: number;
    debtPayments: number;
  }> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (months * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    const transactions = await this.getTransactions(startDate, endDate);
    
    const categorizedSpending: Record<string, number> = {};
    let totalSpending = 0;
    let debtPayments = 0;
    
    transactions.forEach(transaction => {
      if (transaction.amount > 0) { // Positive amounts are outgoing in Plaid
        totalSpending += transaction.amount;
        
        const category = transaction.category[0] || 'Other';
        categorizedSpending[category] = (categorizedSpending[category] || 0) + transaction.amount;
        
        // Detect debt payments
        if (this.isDebtPayment(transaction)) {
          debtPayments += transaction.amount;
        }
      }
    });
    
    return {
      totalSpending,
      categorizedSpending,
      averageMonthlySpending: totalSpending / months,
      debtPayments,
    };
  }

  // Helper methods
  private mapAccountSubtype(subtype: string): 'credit_card' | 'loan' | 'line_of_credit' {
    if (subtype.includes('credit')) return 'credit_card';
    if (subtype.includes('loan') || subtype.includes('mortgage')) return 'loan';
    return 'line_of_credit';
  }

  private estimateMinimumPayment(balance: number, subtype: string): number {
    // Rough estimates for minimum payments
    if (subtype.includes('credit')) {
      return Math.max(25, Math.abs(balance) * 0.02); // 2% of balance, minimum $25
    }
    if (subtype.includes('loan')) {
      return Math.abs(balance) * 0.01; // Rough estimate
    }
    return 0;
  }

  private isDebtPayment(transaction: PlaidTransaction): boolean {
    const paymentKeywords = ['payment', 'autopay', 'card payment', 'loan payment'];
    const name = transaction.name.toLowerCase();
    return paymentKeywords.some(keyword => name.includes(keyword));
  }

  // Check if user has connected accounts
  isConnected(): boolean {
    return !!this.getAccessToken();
  }

  // Disconnect and clear tokens
  disconnect(): void {
    this.accessToken = null;
    localStorage.removeItem('plaid_access_token');
  }
}

export const plaidService = new PlaidService();
