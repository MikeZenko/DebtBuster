import { ApiClient, AuthServiceReal } from './authServiceReal';

// Interfaces matching backend
export interface PlaidAccount {
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

export interface PlaidTransaction {
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

export interface PlaidDebt {
  accountId: string;
  name: string;
  balance: number;
  type: string;
  minimumPayment?: number;
  apr?: number;
  accountMask?: string;
}

export interface DebtSummary {
  totalBalance: number;
  monthlyPayments: number;
  debts: PlaidDebt[];
}

export interface SpendingAnalysis {
  totalSpending: number;
  categorizedSpending: Record<string, number>;
  averageMonthlySpending: number;
  debtPayments: number;
  insights: {
    topCategories: Array<{ category: string; amount: number }>;
    debtPaymentRatio: number;
    averageDailySpending: number;
  };
  period: {
    months: number;
    startDate: string;
    endDate: string;
  };
}

export interface ConnectionStatus {
  isConnected: boolean;
  accountCount: number;
  institutions: string[];
  lastSyncDate: string;
}

export class PlaidServiceReal {
  /**
   * Create link token for Plaid Link initialization
   */
  static async createLinkToken(clientName?: string): Promise<{
    linkToken: string;
    expiration: string;
  }> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{
      success: boolean;
      data: {
        linkToken: string;
        expiration: string;
      };
    }>('/plaid/create-link-token', 
      { clientName }, 
      headers.Authorization.split(' ')[1]
    );

    if (response.success) {
      return response.data;
    }

    throw new Error('Failed to create link token');
  }

  /**
   * Exchange public token for access token and store connection
   */
  static async exchangePublicToken(publicToken: string): Promise<{
    itemId: string;
    accounts: PlaidAccount[];
    accountCount: number;
  }> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{
      success: boolean;
      message: string;
      data: {
        itemId: string;
        accounts: PlaidAccount[];
        accountCount: number;
      };
    }>('/plaid/exchange-token', 
      { publicToken }, 
      headers.Authorization.split(' ')[1]
    );

    if (response.success) {
      return response.data;
    }

    throw new Error('Failed to connect bank account');
  }

  /**
   * Get user's connected accounts
   */
  static async getAccounts(): Promise<PlaidAccount[]> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{
      success: boolean;
      data: {
        accounts: PlaidAccount[];
        count: number;
      };
    }>('/plaid/accounts', headers.Authorization.split(' ')[1]);

    if (response.success) {
      return response.data.accounts;
    }

    throw new Error('Failed to retrieve accounts');
  }

  /**
   * Get debt summary from connected accounts
   */
  static async getDebtSummary(): Promise<DebtSummary> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{
      success: boolean;
      data: DebtSummary;
    }>('/plaid/debt-summary', headers.Authorization.split(' ')[1]);

    if (response.success) {
      return response.data;
    }

    throw new Error('Failed to retrieve debt summary');
  }

  /**
   * Sync transactions from connected accounts
   */
  static async syncTransactions(startDate?: string, endDate?: string): Promise<{
    transactions: PlaidTransaction[];
    count: number;
    syncedAt: string;
  }> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const body: any = {};
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;

    const response = await ApiClient.post<{
      success: boolean;
      message: string;
      data: {
        transactions: PlaidTransaction[];
        count: number;
        syncedAt: string;
      };
    }>('/plaid/sync-transactions', body, headers.Authorization.split(' ')[1]);

    if (response.success) {
      return response.data;
    }

    throw new Error('Failed to sync transactions');
  }

  /**
   * Get spending analysis
   */
  static async getSpendingAnalysis(months: number = 3): Promise<SpendingAnalysis> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{
      success: boolean;
      data: SpendingAnalysis;
    }>(`/plaid/spending-analysis?months=${months}`, headers.Authorization.split(' ')[1]);

    if (response.success) {
      return response.data;
    }

    throw new Error('Failed to generate spending analysis');
  }

  /**
   * Remove connected bank account
   */
  static async removeItem(itemId: string): Promise<void> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.request<{
      success: boolean;
      message: string;
    }>(`/plaid/items/${itemId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.success) {
      throw new Error('Failed to disconnect bank account');
    }
  }

  /**
   * Get connection status and last sync information
   */
  static async getConnectionStatus(): Promise<ConnectionStatus> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{
      success: boolean;
      data: ConnectionStatus;
    }>('/plaid/connection-status', headers.Authorization.split(' ')[1]);

    if (response.success) {
      return response.data;
    }

    throw new Error('Failed to get connection status');
  }

  /**
   * Get transaction categories for filtering/analysis
   */
  static async getTransactionCategories(): Promise<string[]> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{
      success: boolean;
      data: {
        categories: string[];
        count: number;
      };
    }>('/plaid/transaction-categories', headers.Authorization.split(' ')[1]);

    if (response.success) {
      return response.data.categories;
    }

    throw new Error('Failed to get transaction categories');
  }

  /**
   * Check if user has connected accounts
   */
  static async isConnected(): Promise<boolean> {
    try {
      const status = await this.getConnectionStatus();
      return status.isConnected;
    } catch (error) {
      console.warn('Failed to check connection status:', error);
      return false;
    }
  }

  /**
   * Health check for Plaid integration
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await ApiClient.get<{
        success: boolean;
        message: string;
        timestamp: string;
        environment: string;
      }>('/plaid/health');

      return response.success;
    } catch (error) {
      console.warn('Plaid health check failed:', error);
      return false;
    }
  }

  // Client-side utility methods

  /**
   * Format account balance for display
   */
  static formatBalance(balance: number | undefined): string {
    if (balance === undefined || balance === null) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(balance));
  }

  /**
   * Get account type display name
   */
  static getAccountTypeDisplay(type: string, subtype?: string): string {
    const typeMap: Record<string, string> = {
      'depository': 'Bank Account',
      'credit': 'Credit Card',
      'loan': 'Loan',
      'investment': 'Investment',
    };

    const subtypeMap: Record<string, string> = {
      'checking': 'Checking Account',
      'savings': 'Savings Account',
      'credit card': 'Credit Card',
      'auto': 'Auto Loan',
      'student': 'Student Loan',
      'mortgage': 'Mortgage',
      'line of credit': 'Line of Credit',
    };

    if (subtype && subtypeMap[subtype.toLowerCase()]) {
      return subtypeMap[subtype.toLowerCase()];
    }

    return typeMap[type.toLowerCase()] || 'Account';
  }

  /**
   * Determine if account is a debt account
   */
  static isDebtAccount(account: PlaidAccount): boolean {
    return account.type === 'credit' || 
           account.type === 'loan' ||
           (account.type === 'depository' && account.subtype === 'line of credit');
  }

  /**
   * Get account color for UI display
   */
  static getAccountColor(type: string): string {
    const colorMap: Record<string, string> = {
      'depository': '#10B981', // green
      'credit': '#EF4444',     // red
      'loan': '#F59E0B',       // yellow
      'investment': '#8B5CF6', // purple
    };

    return colorMap[type.toLowerCase()] || '#6B7280'; // gray
  }

  /**
   * Format transaction amount with direction
   */
  static formatTransactionAmount(amount: number): {
    formatted: string;
    direction: 'in' | 'out';
    color: string;
  } {
    const direction = amount > 0 ? 'out' : 'in';
    const color = direction === 'out' ? '#EF4444' : '#10B981';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));

    return { formatted, direction, color };
  }

  /**
   * Group transactions by date
   */
  static groupTransactionsByDate(transactions: PlaidTransaction[]): Record<string, PlaidTransaction[]> {
    return transactions.reduce((groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, PlaidTransaction[]>);
  }

  /**
   * Get top spending categories
   */
  static getTopSpendingCategories(
    categorizedSpending: Record<string, number>, 
    limit: number = 5
  ): Array<{ category: string; amount: number; percentage: number }> {
    const total = Object.values(categorizedSpending).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categorizedSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }));
  }

  /**
   * Calculate spending trend
   */
  static calculateSpendingTrend(
    currentSpending: number, 
    previousSpending: number
  ): {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    message: string;
  } {
    if (previousSpending === 0) {
      return {
        trend: 'stable',
        percentage: 0,
        message: 'No previous data for comparison',
      };
    }

    const percentageChange = ((currentSpending - previousSpending) / previousSpending) * 100;
    const absChange = Math.abs(percentageChange);

    if (absChange < 5) {
      return {
        trend: 'stable',
        percentage: absChange,
        message: 'Spending remained relatively stable',
      };
    }

    if (percentageChange > 0) {
      return {
        trend: 'up',
        percentage: absChange,
        message: `Spending increased by ${absChange.toFixed(1)}%`,
      };
    }

    return {
      trend: 'down',
      percentage: absChange,
      message: `Spending decreased by ${absChange.toFixed(1)}%`,
    };
  }

  /**
   * Get debt recommendation based on analysis
   */
  static getDebtRecommendation(debtSummary: DebtSummary): string[] {
    const recommendations: string[] = [];

    if (debtSummary.totalBalance === 0) {
      recommendations.push('Congratulations! You have no debt from connected accounts.');
      return recommendations;
    }

    // High debt recommendations
    if (debtSummary.totalBalance > 50000) {
      recommendations.push('Consider debt consolidation to simplify payments and potentially reduce interest rates');
    }

    // Multiple debts
    if (debtSummary.debts.length > 3) {
      recommendations.push('You have multiple debts - consider using the debt avalanche or snowball method');
    }

    // High minimum payments
    if (debtSummary.monthlyPayments > 1000) {
      recommendations.push('Your monthly debt payments are significant - look for ways to increase payments to reduce interest');
    }

    // Credit card debt
    const creditCardDebt = debtSummary.debts.filter(debt => 
      debt.type.toLowerCase().includes('credit')
    );
    
    if (creditCardDebt.length > 0) {
      const totalCCDebt = creditCardDebt.reduce((sum, debt) => sum + debt.balance, 0);
      if (totalCCDebt > 10000) {
        recommendations.push('Consider a balance transfer to a lower APR card for your credit card debt');
      }
    }

    return recommendations;
  }
}
