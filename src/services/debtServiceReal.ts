import { ApiClient, AuthServiceReal } from './authServiceReal';

// Interfaces matching backend
export interface Debt {
  id: string;
  name: string;
  originalBalance: number;
  currentBalance: number;
  remainingBalance: number;
  apr: number;
  minimumPayment: number;
  debtType: string;
  isFromPlaid?: boolean;
  plaidAccountId?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalPaid: number;
  nextPaymentDate?: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  type: string;
  notes?: string;
  createdAt: string;
}

export interface CreateDebtData {
  name: string;
  originalBalance: number;
  currentBalance: number;
  apr: number;
  minimumPayment: number;
  debtType: 'CREDIT_CARD' | 'STUDENT_LOAN' | 'AUTO_LOAN' | 'MORTGAGE' | 'PERSONAL_LOAN' | 'LINE_OF_CREDIT' | 'OTHER';
  dueDate?: string;
  notes?: string;
}

export interface UpdateDebtData extends Partial<CreateDebtData> {}

export interface CreatePaymentData {
  debtId: string;
  amount: number;
  date: string;
  type?: 'REGULAR' | 'EXTRA' | 'MINIMUM' | 'LUMP_SUM';
  notes?: string;
}

export interface PayoffStrategy {
  type: 'snowball' | 'avalanche';
  extraPayment: number;
  targetMonths?: number;
}

export interface PayoffTimeline {
  month: number;
  debts: Array<{
    id: string;
    name: string;
    balance: number;
    payment: number;
    remainingMonths: number;
  }>;
  totalBalance: number;
  totalPayment: number;
  interestPaid: number;
  principalPaid: number;
}

export interface DebtAnalytics {
  totalDebt: number;
  monthlyMinimumPayments: number;
  weightedAverageAPR: number;
  payoffTimelineMonths: number;
  totalInterestWithMinimums: number;
  debtsByType: Record<string, { count: number; totalBalance: number }>;
  upcomingPayments: Array<{
    debtId: string;
    name: string;
    amount: number;
    dueDate: string;
  }>;
}

export interface DebtSummary {
  totalDebt: number;
  totalMonthlyPayments: number;
  debtCount: number;
  averageAPR: number;
  highestAPR: number;
  largestBalance: number;
  upcomingPayments: Array<{
    debtId: string;
    name: string;
    amount: number;
    dueDate: string;
  }>;
}

export class DebtServiceReal {
  /**
   * Get all debts for the authenticated user
   */
  static async getDebts(): Promise<Debt[]> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { debts: Debt[] } }>('/debts', headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.debts;
    }
    
    throw new Error('Failed to fetch debts');
  }

  /**
   * Get a specific debt
   */
  static async getDebt(debtId: string): Promise<Debt> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { debt: Debt } }>(`/debts/${debtId}`, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.debt;
    }
    
    throw new Error('Failed to fetch debt');
  }

  /**
   * Create a new debt
   */
  static async createDebt(data: CreateDebtData): Promise<Debt> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{ success: boolean; data: { debt: Debt } }>('/debts', data, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.debt;
    }
    
    throw new Error('Failed to create debt');
  }

  /**
   * Update a debt
   */
  static async updateDebt(debtId: string, data: UpdateDebtData): Promise<Debt> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.patch<{ success: boolean; data: { debt: Debt } }>(`/debts/${debtId}`, data, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.debt;
    }
    
    throw new Error('Failed to update debt');
  }

  /**
   * Delete a debt
   */
  static async deleteDebt(debtId: string): Promise<void> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.request<{ success: boolean }>(`/debts/${debtId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.success) {
      throw new Error('Failed to delete debt');
    }
  }

  /**
   * Add a payment to a debt
   */
  static async addPayment(data: CreatePaymentData): Promise<Payment> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{ success: boolean; data: { payment: Payment } }>('/debts/payments', data, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.payment;
    }
    
    throw new Error('Failed to add payment');
  }

  /**
   * Calculate payoff timeline with strategy
   */
  static async getPayoffTimeline(strategy: PayoffStrategy): Promise<{
    timeline: PayoffTimeline[];
    summary: {
      totalMonths: number;
      totalInterest: number;
      totalPayments: number;
      finalBalance: number;
      strategy: string;
      extraPayment: number;
    };
  }> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{ 
      success: boolean; 
      data: { 
        timeline: PayoffTimeline[];
        summary: {
          totalMonths: number;
          totalInterest: number;
          totalPayments: number;
          finalBalance: number;
          strategy: string;
          extraPayment: number;
        };
      } 
    }>('/debts/payoff-timeline', strategy, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error('Failed to calculate payoff timeline');
  }

  /**
   * Get comprehensive debt analytics
   */
  static async getAnalytics(): Promise<DebtAnalytics> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { analytics: DebtAnalytics } }>('/debts/analytics', headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.analytics;
    }
    
    throw new Error('Failed to fetch debt analytics');
  }

  /**
   * Get debt summary statistics
   */
  static async getSummary(): Promise<DebtSummary> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { summary: DebtSummary } }>('/debts/summary', headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.summary;
    }
    
    throw new Error('Failed to fetch debt summary');
  }

  /**
   * Compare different payoff strategies
   */
  static async compareStrategies(extraPayment: number = 0): Promise<{
    strategies: Array<{
      type: string;
      totalMonths: number;
      totalInterest: number;
      totalPayments: number;
    }>;
    savings: {
      monthsDifference: number;
      interestSavings: number;
      recommendedStrategy: string;
    };
    extraPayment: number;
  }> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const url = `/debts/compare-strategies${extraPayment > 0 ? `?extraPayment=${extraPayment}` : ''}`;
    const response = await ApiClient.get<{ 
      success: boolean; 
      data: {
        strategies: Array<{
          type: string;
          totalMonths: number;
          totalInterest: number;
          totalPayments: number;
        }>;
        savings: {
          monthsDifference: number;
          interestSavings: number;
          recommendedStrategy: string;
        };
        extraPayment: number;
      }
    }>(url, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error('Failed to compare strategies');
  }

  /**
   * Import debts from Plaid
   */
  static async importFromPlaid(debts: Array<{
    accountId: string;
    name: string;
    balance: number;
    type: string;
    minimumPayment?: number;
    apr?: number;
  }>): Promise<Debt[]> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{ 
      success: boolean; 
      data: { debts: Debt[]; count: number } 
    }>('/debts/import-plaid', { debts }, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.debts;
    }
    
    throw new Error('Failed to import debts from Plaid');
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  static formatPercent(percent: number): string {
    return `${percent.toFixed(1)}%`;
  }

  /**
   * Calculate total debt balance from debt array
   */
  static calculateTotalBalance(debts: Debt[]): number {
    return debts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
  }

  /**
   * Calculate total monthly payments from debt array
   */
  static calculateTotalMonthlyPayments(debts: Debt[]): number {
    return debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  }

  /**
   * Get debt by type statistics
   */
  static getDebtsByType(debts: Debt[]): Record<string, { count: number; totalBalance: number }> {
    return debts.reduce((acc, debt) => {
      const type = debt.debtType;
      if (!acc[type]) {
        acc[type] = { count: 0, totalBalance: 0 };
      }
      acc[type].count++;
      acc[type].totalBalance += debt.remainingBalance;
      return acc;
    }, {} as Record<string, { count: number; totalBalance: number }>);
  }

  /**
   * Sort debts by balance (for snowball method)
   */
  static sortByBalance(debts: Debt[]): Debt[] {
    return [...debts].sort((a, b) => a.remainingBalance - b.remainingBalance);
  }

  /**
   * Sort debts by APR (for avalanche method)
   */
  static sortByAPR(debts: Debt[]): Debt[] {
    return [...debts].sort((a, b) => b.apr - a.apr);
  }

  /**
   * Check if debt has upcoming payment
   */
  static hasUpcomingPayment(debt: Debt, daysAhead: number = 7): boolean {
    if (!debt.nextPaymentDate) return false;
    
    const paymentDate = new Date(debt.nextPaymentDate);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return paymentDate <= futureDate;
  }

  /**
   * Get debt priority recommendation
   */
  static getDebtPriority(debt: Debt): 'high' | 'medium' | 'low' {
    if (debt.apr > 20) return 'high';
    if (debt.apr > 10) return 'medium';
    return 'low';
  }
}
