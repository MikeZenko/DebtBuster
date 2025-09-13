import { ApiClient, AuthServiceReal } from './authServiceReal';

// Interfaces matching backend
export interface Loan {
  id: string;
  name: string;
  principal: number;
  apr: number;
  termMonths: number;
  fees: number;
  loanType: string;
  lender?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  calculations: {
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
    redFlags: string[];
  };
}

export interface CreateLoanData {
  name: string;
  principal: number;
  apr: number;
  termMonths: number;
  fees?: number;
  loanType?: 'PERSONAL' | 'AUTO' | 'MORTGAGE' | 'STUDENT' | 'BUSINESS' | 'OTHER';
  lender?: string;
  notes?: string;
}

export interface UpdateLoanData extends Partial<CreateLoanData> {}

export interface LoanCalculationInput {
  principal: number;
  apr: number;
  termMonths: number;
  fees?: number;
}

export interface LoanCalculations {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  amortizationSchedule: AmortizationEntry[];
  redFlags: string[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface LoanComparison {
  loans: Array<{
    id: string;
    name: string;
    principal: number;
    apr: number;
    termMonths: number;
    fees: number;
    calculations: LoanCalculations;
  }>;
  bestOption: {
    lowestPayment: string;
    lowestTotal: string;
    lowestInterest: string;
  };
  savings: {
    monthlyPaymentRange: { min: number; max: number };
    totalCostRange: { min: number; max: number };
    potentialSavings: number;
  };
}

export interface LoanAnalytics {
  totalLoanValue: number;
  averageAPR: number;
  totalMonthlyPayments: number;
  loansByType: Record<string, { count: number; totalValue: number }>;
  potentialRedFlags: number;
  recommendations: string[];
}

export interface LoanSummary {
  loanCount: number;
  totalLoanValue: number;
  totalMonthlyPayments: number;
  totalInterest: number;
  averageAPR: number;
  highestAPR: number;
  lowestAPR: number;
  redFlagCount: number;
  loanTypes: Record<string, number>;
}

export class LoanServiceReal {
  /**
   * Get all loans for the authenticated user
   */
  static async getLoans(): Promise<Loan[]> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { loans: Loan[] } }>('/loans', headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.loans;
    }
    
    throw new Error('Failed to fetch loans');
  }

  /**
   * Get a specific loan with full calculations
   */
  static async getLoan(loanId: string): Promise<Loan> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { loan: Loan } }>(`/loans/${loanId}`, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.loan;
    }
    
    throw new Error('Failed to fetch loan');
  }

  /**
   * Create a new loan
   */
  static async createLoan(data: CreateLoanData): Promise<Loan> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{ success: boolean; data: { loan: Loan } }>('/loans', data, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.loan;
    }
    
    throw new Error('Failed to create loan');
  }

  /**
   * Update a loan
   */
  static async updateLoan(loanId: string, data: UpdateLoanData): Promise<Loan> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.patch<{ success: boolean; data: { loan: Loan } }>(`/loans/${loanId}`, data, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.loan;
    }
    
    throw new Error('Failed to update loan');
  }

  /**
   * Delete a loan
   */
  static async deleteLoan(loanId: string): Promise<void> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.request<{ success: boolean }>(`/loans/${loanId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.success) {
      throw new Error('Failed to delete loan');
    }
  }

  /**
   * Calculate loan details for given parameters (without saving)
   */
  static async calculateLoan(data: LoanCalculationInput): Promise<{
    input: LoanCalculationInput;
    calculations: LoanCalculations;
  }> {
    const response = await ApiClient.post<{ 
      success: boolean; 
      data: { 
        input: LoanCalculationInput; 
        calculations: LoanCalculations 
      } 
    }>('/loans/calculate', data);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error('Failed to calculate loan details');
  }

  /**
   * Compare multiple loans
   */
  static async compareLoans(loanIds?: string[]): Promise<LoanComparison> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.post<{ success: boolean; data: LoanComparison }>('/loans/compare', 
      { loanIds }, 
      headers.Authorization.split(' ')[1]
    );
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error('Failed to compare loans');
  }

  /**
   * Get loan analytics for the user
   */
  static async getAnalytics(): Promise<LoanAnalytics> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { analytics: LoanAnalytics } }>('/loans/analytics', headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.analytics;
    }
    
    throw new Error('Failed to fetch loan analytics');
  }

  /**
   * Get amortization schedule for a specific loan
   */
  static async getAmortizationSchedule(loanId: string): Promise<{
    loanId: string;
    loanName: string;
    schedule: AmortizationEntry[];
    summary: {
      monthlyPayment: number;
      totalInterest: number;
      totalCost: number;
      termMonths: number;
    };
  }> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ 
      success: boolean; 
      data: {
        loanId: string;
        loanName: string;
        schedule: AmortizationEntry[];
        summary: {
          monthlyPayment: number;
          totalInterest: number;
          totalCost: number;
          termMonths: number;
        };
      }
    }>(`/loans/${loanId}/amortization`, headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error('Failed to fetch amortization schedule');
  }

  /**
   * Get loan summary statistics
   */
  static async getSummary(): Promise<LoanSummary> {
    const headers = await AuthServiceReal.getAuthHeaders();
    const response = await ApiClient.get<{ success: boolean; data: { summary: LoanSummary } }>('/loans/summary', headers.Authorization.split(' ')[1]);
    
    if (response.success) {
      return response.data.summary;
    }
    
    throw new Error('Failed to fetch loan summary');
  }

  // Client-side utility methods

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
   * Validate loan input parameters
   */
  static validateLoanInputs(principal: number, apr: number, termMonths: number, fees: number = 0): string[] {
    const errors: string[] = [];

    if (principal <= 0) {
      errors.push('Principal must be greater than 0');
    }
    if (principal > 10000000) {
      errors.push('Principal cannot exceed $10,000,000');
    }
    if (apr < 0 || apr > 100) {
      errors.push('APR must be between 0 and 100');
    }
    if (termMonths <= 0 || termMonths > 600) {
      errors.push('Term must be between 1 and 600 months');
    }
    if (fees < 0) {
      errors.push('Fees cannot be negative');
    }
    if (fees > principal) {
      errors.push('Fees cannot exceed principal amount');
    }

    return errors;
  }

  /**
   * Client-side quick calculation for immediate feedback
   */
  static quickCalculateMonthlyPayment(principal: number, apr: number, termMonths: number): number {
    if (apr === 0) {
      return principal / termMonths;
    }

    const monthlyRate = apr / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
    
    if (denominator === 0) {
      return principal / termMonths;
    }

    return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / denominator;
  }

  /**
   * Get loan recommendation based on comparison
   */
  static getBestLoanRecommendation(comparison: LoanComparison): {
    recommended: string;
    reason: string;
    savings: number;
  } {
    const { bestOption, savings } = comparison;
    
    // Prioritize lowest total cost over monthly payment
    if (bestOption.lowestTotal === bestOption.lowestInterest) {
      return {
        recommended: bestOption.lowestTotal,
        reason: 'Lowest total cost and least interest paid',
        savings: savings.potentialSavings,
      };
    }
    
    return {
      recommended: bestOption.lowestTotal,
      reason: 'Lowest total cost over the life of the loan',
      savings: savings.potentialSavings,
    };
  }

  /**
   * Categorize APR as good, fair, or poor
   */
  static categorizeAPR(apr: number, loanType: string = 'PERSONAL'): 'excellent' | 'good' | 'fair' | 'poor' {
    const thresholds = {
      MORTGAGE: { excellent: 4, good: 6, fair: 8 },
      AUTO: { excellent: 4, good: 7, fair: 12 },
      STUDENT: { excellent: 4, good: 6, fair: 10 },
      PERSONAL: { excellent: 6, good: 12, fair: 20 },
      BUSINESS: { excellent: 6, good: 10, fair: 15 },
      OTHER: { excellent: 6, good: 12, fair: 20 },
    };

    const threshold = thresholds[loanType as keyof typeof thresholds] || thresholds.OTHER;
    
    if (apr <= threshold.excellent) return 'excellent';
    if (apr <= threshold.good) return 'good';
    if (apr <= threshold.fair) return 'fair';
    return 'poor';
  }

  /**
   * Get red flag warnings for a loan
   */
  static getRedFlags(apr: number, fees: number, principal: number): string[] {
    const flags: string[] = [];

    if (apr > 25) {
      flags.push('Extremely high APR (>25%) - possible predatory lending');
    }
    if (apr > 36) {
      flags.push('APR exceeds 36% - likely predatory lending');
    }
    if (fees > principal * 0.05) {
      flags.push('High upfront fees (>5% of principal)');
    }
    if (fees > principal * 0.10) {
      flags.push('Excessive fees (>10% of principal) - major red flag');
    }

    return flags;
  }

  /**
   * Calculate potential savings from a better loan
   */
  static calculateSavings(currentLoan: Loan, betterLoan: Loan): {
    monthlySavings: number;
    totalSavings: number;
    interestSavings: number;
  } {
    const monthlySavings = currentLoan.calculations.monthlyPayment - betterLoan.calculations.monthlyPayment;
    const totalSavings = currentLoan.calculations.totalCost - betterLoan.calculations.totalCost;
    const interestSavings = currentLoan.calculations.totalInterest - betterLoan.calculations.totalInterest;

    return {
      monthlySavings,
      totalSavings,
      interestSavings,
    };
  }

  /**
   * Generate loan recommendations
   */
  static generateRecommendations(loans: Loan[]): string[] {
    const recommendations: string[] = [];

    if (loans.length === 0) {
      recommendations.push('Add loan options to compare and find the best deal');
      return recommendations;
    }

    // Check for high APRs
    const highAPRLoans = loans.filter(loan => loan.apr > 15);
    if (highAPRLoans.length > 0) {
      recommendations.push('Consider shopping around for better rates - some of your loans have high APRs');
    }

    // Check for high fees
    const highFeeLoans = loans.filter(loan => loan.fees > loan.principal * 0.03);
    if (highFeeLoans.length > 0) {
      recommendations.push('Look for lenders with lower fees to reduce your total borrowing cost');
    }

    // Check for very long terms
    const longTermLoans = loans.filter(loan => loan.termMonths > 60);
    if (longTermLoans.length > 0) {
      recommendations.push('Consider shorter loan terms to pay less interest over time');
    }

    // General advice
    if (loans.length >= 2) {
      recommendations.push('Compare the total cost, not just monthly payments');
      recommendations.push('Check if lenders offer rate discounts for autopay or existing customers');
    }

    return recommendations;
  }
}
