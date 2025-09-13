import { PlaidApi, Configuration, AccountsGetRequest, TransactionsGetRequest, ItemPublicTokenExchangeRequest, PlaidError } from 'plaid';
import { secureStorage, StorageKeys } from './secureStorage';

// Environment configuration with validation
const getPlaidConfig = () => {
  const clientId = process.env.REACT_APP_PLAID_CLIENT_ID;
  const sandbox = process.env.REACT_APP_PLAID_ENV !== 'production';
  
  if (!clientId) {
    throw new Error('Plaid configuration missing - CLIENT_ID required');
  }
  
  return {
    basePath: sandbox ? 'https://sandbox.plaid.com' : 'https://production.plaid.com',
    headers: {
      'PLAID-CLIENT-ID': clientId,
      // Note: PLAID-SECRET should NEVER be in frontend code
      // This should be handled by your backend API
    },
    sandbox
  };
};

// Enhanced error types
export class PlaidServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PlaidServiceError';
  }
}

// Improved interfaces with validation
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
  mask?: string; // Account number mask for security
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category: string[];
  merchant_name?: string;
  pending?: boolean;
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
  account_mask?: string;
}

class PlaidServiceSecure {
  private config: ReturnType<typeof getPlaidConfig> | null = null;
  private isInitialized = false;
  
  constructor() {
    try {
      this.config = getPlaidConfig();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Plaid service not properly configured:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return this.isInitialized;
  }

  /**
   * Exchange public token for access token
   * WARNING: This should be done through your backend API, not frontend!
   */
  async exchangePublicToken(publicToken: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new PlaidServiceError('Plaid service not configured');
    }

    if (!publicToken || typeof publicToken !== 'string') {
      throw new PlaidServiceError('Invalid public token provided');
    }

    try {
      // In production, this should call your backend API endpoint
      // Your backend should handle the token exchange securely
      const response = await this.callBackendAPI('/api/plaid/exchange-token', {
        method: 'POST',
        body: JSON.stringify({ public_token: publicToken }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.access_token) {
        throw new PlaidServiceError('Failed to receive access token');
      }

      // Store with short expiration and encryption
      secureStorage.setItem(StorageKeys.PLAID_ACCESS_TOKEN, response.access_token, {
        encrypt: true,
        expiration: 24 * 60 * 60 * 1000 // 24 hours
      });

      return response.access_token;
    } catch (error) {
      if (error instanceof PlaidServiceError) {
        throw error;
      }
      
      const plaidError = error as PlaidError;
      throw new PlaidServiceError(
        'Failed to connect bank account',
        plaidError.error_code,
        plaidError.error_type,
        error as Error
      );
    }
  }

  /**
   * Get securely stored access token
   */
  private getAccessToken(): string | null {
    return secureStorage.getItem(StorageKeys.PLAID_ACCESS_TOKEN);
  }

  /**
   * Validate access token exists and is valid
   */
  private validateAccessToken(): string {
    const token = this.getAccessToken();
    if (!token) {
      throw new PlaidServiceError('No valid access token available - please reconnect your bank account');
    }
    return token;
  }

  /**
   * Fetch accounts with enhanced error handling
   */
  async getAccounts(): Promise<PlaidAccount[]> {
    const accessToken = this.validateAccessToken();

    try {
      // Call backend API instead of direct Plaid API
      const response = await this.callBackendAPI('/api/plaid/accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return this.validateAccountsResponse(response.accounts);
    } catch (error) {
      this.handlePlaidError(error, 'fetch account data');
      throw error; // Re-throw after handling
    }
  }

  /**
   * Extract debt accounts with validation
   */
  async getDebtAccounts(): Promise<PlaidDebt[]> {
    const accounts = await this.getAccounts();
    
    const debtAccounts = accounts
      .filter(account => this.isDebtAccount(account))
      .map(account => this.mapToDebtAccount(account));

    return debtAccounts;
  }

  /**
   * Get transactions with date validation
   */
  async getTransactions(startDate: string, endDate: string): Promise<PlaidTransaction[]> {
    this.validateDateRange(startDate, endDate);
    const accessToken = this.validateAccessToken();

    try {
      const response = await this.callBackendAPI('/api/plaid/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ start_date: startDate, end_date: endDate })
      });

      return this.validateTransactionsResponse(response.transactions);
    } catch (error) {
      this.handlePlaidError(error, 'fetch transaction data');
      throw error;
    }
  }

  /**
   * Enhanced spending analysis with validation
   */
  async getSpendingAnalysis(months: number = 3): Promise<{
    totalSpending: number;
    categorizedSpending: Record<string, number>;
    averageMonthlySpending: number;
    debtPayments: number;
  }> {
    if (months < 1 || months > 24) {
      throw new PlaidServiceError('Invalid months parameter - must be between 1 and 24');
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (months * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    const transactions = await this.getTransactions(startDate, endDate);
    
    return this.analyzeSpending(transactions, months);
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Secure disconnect - clear all sensitive data
   */
  disconnect(): void {
    secureStorage.removeItem(StorageKeys.PLAID_ACCESS_TOKEN);
    secureStorage.removeItem(StorageKeys.FINANCIAL_DATA);
  }

  // Private helper methods
  
  /**
   * Mock backend API call (replace with actual backend endpoint)
   */
  private async callBackendAPI(endpoint: string, options: RequestInit): Promise<any> {
    // In production, replace with your actual backend API
    // For now, this is a mock that simulates backend behavior
    
    if (this.config?.sandbox) {
      // Mock successful responses for development
      if (endpoint.includes('exchange-token')) {
        return { access_token: 'mock_access_token_' + Date.now() };
      }
      if (endpoint.includes('accounts')) {
        return { accounts: this.getMockAccounts() };
      }
      if (endpoint.includes('transactions')) {
        return { transactions: this.getMockTransactions() };
      }
    }
    
    throw new PlaidServiceError('Backend API not implemented - this should call your server');
  }

  private validateAccountsResponse(accounts: any[]): PlaidAccount[] {
    if (!Array.isArray(accounts)) {
      throw new PlaidServiceError('Invalid accounts response format');
    }
    
    return accounts.map(account => ({
      account_id: this.validateString(account.account_id, 'account_id'),
      name: this.validateString(account.name, 'account name'),
      type: account.type,
      subtype: account.subtype || '',
      balance: {
        available: account.balances?.available || null,
        current: account.balances?.current || null,
        limit: account.balances?.limit || null,
      },
      mask: account.mask
    }));
  }

  private validateTransactionsResponse(transactions: any[]): PlaidTransaction[] {
    if (!Array.isArray(transactions)) {
      throw new PlaidServiceError('Invalid transactions response format');
    }

    return transactions.map(transaction => ({
      transaction_id: this.validateString(transaction.transaction_id, 'transaction_id'),
      account_id: this.validateString(transaction.account_id, 'account_id'),
      amount: this.validateNumber(transaction.amount, 'amount'),
      date: this.validateString(transaction.date, 'date'),
      name: this.validateString(transaction.name, 'transaction name'),
      category: Array.isArray(transaction.category) ? transaction.category : [],
      merchant_name: transaction.merchant_name,
      pending: transaction.pending || false
    }));
  }

  private validateString(value: any, fieldName: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new PlaidServiceError(`Invalid ${fieldName}: must be a non-empty string`);
    }
    return value.trim();
  }

  private validateNumber(value: any, fieldName: string): number {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      throw new PlaidServiceError(`Invalid ${fieldName}: must be a valid number`);
    }
    return num;
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new PlaidServiceError('Invalid date format');
    }

    if (start >= end) {
      throw new PlaidServiceError('Start date must be before end date');
    }

    if (end > now) {
      throw new PlaidServiceError('End date cannot be in the future');
    }
  }

  private isDebtAccount(account: PlaidAccount): boolean {
    return account.type === 'credit' || 
           account.type === 'loan' ||
           (account.type === 'depository' && account.subtype === 'line of credit');
  }

  private mapToDebtAccount(account: PlaidAccount): PlaidDebt {
    return {
      account_id: account.account_id,
      name: account.name,
      balance: Math.abs(account.balance.current || 0),
      type: this.mapAccountSubtype(account.subtype),
      minimum_payment: this.estimateMinimumPayment(account.balance.current || 0, account.subtype),
      account_mask: account.mask
    };
  }

  private mapAccountSubtype(subtype: string): 'credit_card' | 'loan' | 'line_of_credit' {
    const lowerSubtype = subtype.toLowerCase();
    if (lowerSubtype.includes('credit')) return 'credit_card';
    if (lowerSubtype.includes('loan') || lowerSubtype.includes('mortgage')) return 'loan';
    return 'line_of_credit';
  }

  private estimateMinimumPayment(balance: number, subtype: string): number {
    const absBalance = Math.abs(balance);
    const lowerSubtype = subtype.toLowerCase();
    
    if (lowerSubtype.includes('credit')) {
      return Math.max(25, absBalance * 0.02); // 2% minimum, $25 floor
    }
    if (lowerSubtype.includes('loan')) {
      return absBalance * 0.01; // Rough estimate for loans
    }
    return 0;
  }

  private analyzeSpending(transactions: PlaidTransaction[], months: number) {
    const categorizedSpending: Record<string, number> = {};
    let totalSpending = 0;
    let debtPayments = 0;
    
    transactions.forEach(transaction => {
      if (transaction.amount > 0) { // Positive amounts are outgoing
        totalSpending += transaction.amount;
        
        const category = transaction.category[0] || 'Other';
        categorizedSpending[category] = (categorizedSpending[category] || 0) + transaction.amount;
        
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

  private isDebtPayment(transaction: PlaidTransaction): boolean {
    const paymentKeywords = ['payment', 'autopay', 'card payment', 'loan payment', 'credit card'];
    const name = transaction.name.toLowerCase();
    return paymentKeywords.some(keyword => name.includes(keyword));
  }

  private handlePlaidError(error: any, operation: string): void {
    console.error(`Plaid error during ${operation}:`, error);
    
    // Log error details for monitoring (in production, send to error tracking service)
    if (error.error_code) {
      console.error(`Plaid Error Code: ${error.error_code}, Type: ${error.error_type}`);
    }
  }

  // Mock data for development
  private getMockAccounts(): PlaidAccount[] {
    return [
      {
        account_id: 'mock_credit_1',
        name: 'Chase Freedom Card',
        type: 'credit',
        subtype: 'credit card',
        balance: { available: 2500, current: -1200, limit: 5000 },
        mask: '1234'
      },
      {
        account_id: 'mock_loan_1', 
        name: 'Auto Loan',
        type: 'loan',
        subtype: 'auto',
        balance: { available: null, current: -15000, limit: null },
        mask: '5678'
      }
    ];
  }

  private getMockTransactions(): PlaidTransaction[] {
    return [
      {
        transaction_id: 'mock_tx_1',
        account_id: 'mock_credit_1',
        amount: 85.50,
        date: '2024-01-15',
        name: 'Grocery Store',
        category: ['Food and Drink', 'Groceries'],
        pending: false
      }
    ];
  }
}

export const plaidServiceSecure = new PlaidServiceSecure();
