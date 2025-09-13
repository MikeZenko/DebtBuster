import { Loan, LoanType } from '@prisma/client';
import prisma from '../config/database';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

// Validation schemas
export const createLoanSchema = z.object({
  name: z.string().min(1).max(255),
  principal: z.number().positive().max(10000000), // Max $10M
  apr: z.number().min(0).max(100),
  termMonths: z.number().int().min(1).max(600), // Max 50 years
  fees: z.number().min(0).default(0),
  loanType: z.nativeEnum(LoanType).default(LoanType.PERSONAL),
  lender: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateLoanSchema = createLoanSchema.partial();

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

export class LoanService {
  /**
   * Create a new loan for comparison
   */
  static async createLoan(userId: string, data: z.infer<typeof createLoanSchema>): Promise<Loan> {
    // Validate loan inputs
    const validationErrors = this.validateLoanInputs(data.principal, data.apr, data.termMonths, data.fees);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid loan data: ${validationErrors.join(', ')}`);
    }

    return await prisma.loan.create({
      data: {
        userId,
        name: data.name,
        principal: new Decimal(data.principal),
        apr: new Decimal(data.apr),
        termMonths: data.termMonths,
        fees: new Decimal(data.fees),
        loanType: data.loanType,
        lender: data.lender,
        notes: data.notes,
      }
    });
  }

  /**
   * Get all loans for a user
   */
  static async getUserLoans(userId: string): Promise<Loan[]> {
    return await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Get a specific loan
   */
  static async getLoan(userId: string, loanId: string): Promise<Loan | null> {
    return await prisma.loan.findFirst({
      where: { id: loanId, userId }
    });
  }

  /**
   * Update a loan
   */
  static async updateLoan(userId: string, loanId: string, data: z.infer<typeof updateLoanSchema>): Promise<Loan> {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.principal !== undefined) {
      updateData.principal = new Decimal(data.principal);
    }
    if (data.apr !== undefined) updateData.apr = new Decimal(data.apr);
    if (data.termMonths !== undefined) updateData.termMonths = data.termMonths;
    if (data.fees !== undefined) updateData.fees = new Decimal(data.fees);
    if (data.loanType !== undefined) updateData.loanType = data.loanType;
    if (data.lender !== undefined) updateData.lender = data.lender;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Validate if any financial data is being updated
    if (data.principal !== undefined || data.apr !== undefined || data.termMonths !== undefined || data.fees !== undefined) {
      const loan = await this.getLoan(userId, loanId);
      if (!loan) throw new Error('Loan not found');

      const principal = data.principal ?? loan.principal.toNumber();
      const apr = data.apr ?? loan.apr.toNumber();
      const termMonths = data.termMonths ?? loan.termMonths;
      const fees = data.fees ?? loan.fees.toNumber();

      const validationErrors = this.validateLoanInputs(principal, apr, termMonths, fees);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid loan data: ${validationErrors.join(', ')}`);
      }
    }

    return await prisma.loan.update({
      where: { id: loanId, userId },
      data: updateData
    });
  }

  /**
   * Delete a loan
   */
  static async deleteLoan(userId: string, loanId: string): Promise<void> {
    await prisma.loan.delete({
      where: { id: loanId, userId }
    });
  }

  /**
   * Calculate loan details with amortization schedule
   */
  static calculateLoanDetails(
    principal: number,
    apr: number,
    termMonths: number,
    fees: number = 0
  ): LoanCalculations {
    const totalPrincipal = principal + fees;
    const monthlyPayment = this.calculateMonthlyPayment(totalPrincipal, apr, termMonths);
    const amortizationSchedule = this.generateAmortizationSchedule(totalPrincipal, apr, termMonths);
    const totalInterest = amortizationSchedule[amortizationSchedule.length - 1]?.cumulativeInterest || 0;
    const totalCost = totalPrincipal + totalInterest;
    const redFlags = this.detectRedFlags(apr, fees, principal);

    return {
      monthlyPayment,
      totalInterest,
      totalCost,
      amortizationSchedule,
      redFlags,
    };
  }

  /**
   * Compare multiple loans
   */
  static async compareLoans(userId: string, loanIds?: string[]): Promise<LoanComparison> {
    let loans: Loan[];
    
    if (loanIds && loanIds.length > 0) {
      loans = await prisma.loan.findMany({
        where: { id: { in: loanIds }, userId }
      });
    } else {
      loans = await this.getUserLoans(userId);
    }

    if (loans.length === 0) {
      throw new Error('No loans found for comparison');
    }

    const loansWithCalculations = loans.map(loan => {
      const calculations = this.calculateLoanDetails(
        loan.principal.toNumber(),
        loan.apr.toNumber(),
        loan.termMonths,
        loan.fees.toNumber()
      );

      return {
        id: loan.id,
        name: loan.name,
        principal: loan.principal.toNumber(),
        apr: loan.apr.toNumber(),
        termMonths: loan.termMonths,
        fees: loan.fees.toNumber(),
        calculations,
      };
    });

    // Find best options
    const bestLowestPayment = loansWithCalculations.reduce((best, current) =>
      current.calculations.monthlyPayment < best.calculations.monthlyPayment ? current : best
    );

    const bestLowestTotal = loansWithCalculations.reduce((best, current) =>
      current.calculations.totalCost < best.calculations.totalCost ? current : best
    );

    const bestLowestInterest = loansWithCalculations.reduce((best, current) =>
      current.calculations.totalInterest < best.calculations.totalInterest ? current : best
    );

    // Calculate savings potential
    const monthlyPayments = loansWithCalculations.map(l => l.calculations.monthlyPayment);
    const totalCosts = loansWithCalculations.map(l => l.calculations.totalCost);

    const monthlyPaymentRange = {
      min: Math.min(...monthlyPayments),
      max: Math.max(...monthlyPayments),
    };

    const totalCostRange = {
      min: Math.min(...totalCosts),
      max: Math.max(...totalCosts),
    };

    const potentialSavings = totalCostRange.max - totalCostRange.min;

    return {
      loans: loansWithCalculations,
      bestOption: {
        lowestPayment: bestLowestPayment.id,
        lowestTotal: bestLowestTotal.id,
        lowestInterest: bestLowestInterest.id,
      },
      savings: {
        monthlyPaymentRange,
        totalCostRange,
        potentialSavings,
      },
    };
  }

  /**
   * Get loan analytics for a user
   */
  static async getLoanAnalytics(userId: string): Promise<LoanAnalytics> {
    const loans = await this.getUserLoans(userId);
    
    const totalLoanValue = loans.reduce((sum, loan) => sum + loan.principal.toNumber(), 0);
    const averageAPR = loans.length > 0 
      ? loans.reduce((sum, loan) => sum + loan.apr.toNumber(), 0) / loans.length 
      : 0;

    let totalMonthlyPayments = 0;
    let potentialRedFlags = 0;

    // Calculate monthly payments and red flags
    loans.forEach(loan => {
      const calculations = this.calculateLoanDetails(
        loan.principal.toNumber(),
        loan.apr.toNumber(),
        loan.termMonths,
        loan.fees.toNumber()
      );
      totalMonthlyPayments += calculations.monthlyPayment;
      potentialRedFlags += calculations.redFlags.length;
    });

    // Group loans by type
    const loansByType: Record<string, { count: number; totalValue: number }> = {};
    loans.forEach(loan => {
      const type = loan.loanType;
      if (!loansByType[type]) {
        loansByType[type] = { count: 0, totalValue: 0 };
      }
      loansByType[type].count++;
      loansByType[type].totalValue += loan.principal.toNumber();
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(loans);

    return {
      totalLoanValue,
      averageAPR,
      totalMonthlyPayments,
      loansByType,
      potentialRedFlags,
      recommendations,
    };
  }

  // Private calculation methods

  /**
   * Calculate monthly payment using standard amortization formula
   */
  private static calculateMonthlyPayment(principal: number, apr: number, termMonths: number): number {
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
   * Generate complete amortization schedule
   */
  private static generateAmortizationSchedule(
    principal: number,
    apr: number,
    termMonths: number
  ): AmortizationEntry[] {
    const monthlyPayment = this.calculateMonthlyPayment(principal, apr, termMonths);
    const monthlyRate = apr / 100 / 12;
    
    let balance = principal;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    const schedule: AmortizationEntry[] = [];

    for (let month = 1; month <= termMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
      
      balance -= principalPayment;
      cumulativeInterest += interestPayment;
      cumulativePrincipal += principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        interest: interestPayment,
        principal: principalPayment,
        balance: Math.max(0, balance),
        cumulativeInterest,
        cumulativePrincipal,
      });

      if (balance <= 0) break;
    }

    return schedule;
  }

  /**
   * Validate loan input parameters
   */
  private static validateLoanInputs(
    principal: number,
    apr: number,
    termMonths: number,
    fees: number = 0
  ): string[] {
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
   * Detect predatory lending red flags
   */
  private static detectRedFlags(apr: number, fees: number, principal: number): string[] {
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
    if (apr > 50) {
      flags.push('Payday loan APR levels - extremely dangerous');
    }

    return flags;
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(loans: Loan[]): string[] {
    const recommendations: string[] = [];

    if (loans.length === 0) {
      recommendations.push('Add loan options to compare and find the best deal');
      return recommendations;
    }

    // Check for high APRs
    const highAPRLoans = loans.filter(loan => loan.apr.toNumber() > 15);
    if (highAPRLoans.length > 0) {
      recommendations.push('Consider shopping around for better rates - some of your loans have high APRs');
    }

    // Check for high fees
    const highFeeLoans = loans.filter(loan => 
      loan.fees.toNumber() > loan.principal.toNumber() * 0.03
    );
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

    // APR comparison advice
    const aprRange = {
      min: Math.min(...loans.map(l => l.apr.toNumber())),
      max: Math.max(...loans.map(l => l.apr.toNumber()))
    };

    if (aprRange.max - aprRange.min > 5) {
      recommendations.push('There\'s a significant difference in APRs - choose the lowest rate to save money');
    }

    return recommendations;
  }
}
