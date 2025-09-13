import { Debt, Payment, DebtType, PaymentType } from '@prisma/client';
import prisma from '../config/database';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

// Validation schemas
export const createDebtSchema = z.object({
  name: z.string().min(1).max(255),
  originalBalance: z.number().positive(),
  currentBalance: z.number().min(0),
  apr: z.number().min(0).max(100),
  minimumPayment: z.number().positive(),
  debtType: z.nativeEnum(DebtType),
  dueDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  notes: z.string().max(1000).optional(),
});

export const updateDebtSchema = createDebtSchema.partial();

export const createPaymentSchema = z.object({
  debtId: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string().transform(str => new Date(str)),
  type: z.nativeEnum(PaymentType).default(PaymentType.REGULAR),
  notes: z.string().max(500).optional(),
});

export interface DebtWithPayments extends Debt {
  payments: Payment[];
  totalPaid: number;
  remainingBalance: number;
  nextPaymentDate?: Date;
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
  debtToIncomeRatio?: number;
  payoffTimelineMonths: number;
  totalInterestWithMinimums: number;
  debtsByType: Record<string, { count: number; totalBalance: number }>;
  upcomingPayments: Array<{
    debtId: string;
    name: string;
    amount: number;
    dueDate: Date;
  }>;
}

export class DebtService {
  /**
   * Create a new debt
   */
  static async createDebt(userId: string, data: z.infer<typeof createDebtSchema>): Promise<Debt> {
    return await prisma.debt.create({
      data: {
        userId,
        name: data.name,
        originalBalance: new Decimal(data.originalBalance),
        currentBalance: new Decimal(data.currentBalance),
        apr: new Decimal(data.apr),
        minimumPayment: new Decimal(data.minimumPayment),
        debtType: data.debtType,
        dueDate: data.dueDate,
        notes: data.notes,
      }
    });
  }

  /**
   * Get all debts for a user
   */
  static async getUserDebts(userId: string): Promise<DebtWithPayments[]> {
    const debts = await prisma.debt.findMany({
      where: { userId },
      include: { 
        payments: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return debts.map(debt => {
      const totalPaid = debt.payments.reduce((sum, payment) => 
        sum + payment.amount.toNumber(), 0
      );
      
      const remainingBalance = Math.max(0, debt.currentBalance.toNumber() - totalPaid);

      return {
        ...debt,
        totalPaid,
        remainingBalance,
        nextPaymentDate: this.calculateNextPaymentDate(debt),
      };
    });
  }

  /**
   * Get a specific debt
   */
  static async getDebt(userId: string, debtId: string): Promise<DebtWithPayments | null> {
    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId },
      include: { 
        payments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!debt) return null;

    const totalPaid = debt.payments.reduce((sum, payment) => 
      sum + payment.amount.toNumber(), 0
    );
    
    const remainingBalance = Math.max(0, debt.currentBalance.toNumber() - totalPaid);

    return {
      ...debt,
      totalPaid,
      remainingBalance,
      nextPaymentDate: this.calculateNextPaymentDate(debt),
    };
  }

  /**
   * Update a debt
   */
  static async updateDebt(userId: string, debtId: string, data: z.infer<typeof updateDebtSchema>): Promise<Debt> {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.originalBalance !== undefined) updateData.originalBalance = new Decimal(data.originalBalance);
    if (data.currentBalance !== undefined) updateData.currentBalance = new Decimal(data.currentBalance);
    if (data.apr !== undefined) updateData.apr = new Decimal(data.apr);
    if (data.minimumPayment !== undefined) updateData.minimumPayment = new Decimal(data.minimumPayment);
    if (data.debtType !== undefined) updateData.debtType = data.debtType;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return await prisma.debt.update({
      where: { id: debtId, userId },
      data: updateData
    });
  }

  /**
   * Delete a debt
   */
  static async deleteDebt(userId: string, debtId: string): Promise<void> {
    await prisma.debt.delete({
      where: { id: debtId, userId }
    });
  }

  /**
   * Add a payment to a debt
   */
  static async addPayment(userId: string, data: z.infer<typeof createPaymentSchema>): Promise<Payment> {
    // Verify debt belongs to user
    const debt = await prisma.debt.findFirst({
      where: { id: data.debtId, userId }
    });

    if (!debt) {
      throw new Error('Debt not found');
    }

    const payment = await prisma.payment.create({
      data: {
        debtId: data.debtId,
        amount: new Decimal(data.amount),
        date: data.date,
        type: data.type,
        notes: data.notes,
      }
    });

    // Update debt balance if this is a current payment
    if (data.type !== PaymentType.LUMP_SUM) {
      const newBalance = Math.max(0, debt.currentBalance.toNumber() - data.amount);
      await prisma.debt.update({
        where: { id: data.debtId },
        data: { currentBalance: new Decimal(newBalance) }
      });
    }

    return payment;
  }

  /**
   * Calculate payoff timeline with chosen strategy
   */
  static async calculatePayoffTimeline(userId: string, strategy: PayoffStrategy): Promise<PayoffTimeline[]> {
    const debts = await this.getUserDebts(userId);
    
    if (debts.length === 0) return [];

    // Sort debts based on strategy
    const sortedDebts = strategy.type === 'snowball' 
      ? debts.sort((a, b) => a.remainingBalance - b.remainingBalance)
      : debts.sort((a, b) => b.apr.toNumber() - a.apr.toNumber());

    const timeline: PayoffTimeline[] = [];
    let workingDebts = sortedDebts.map(debt => ({
      id: debt.id,
      name: debt.name,
      balance: debt.remainingBalance,
      apr: debt.apr.toNumber(),
      minimumPayment: debt.minimumPayment.toNumber(),
    }));

    let month = 0;
    const maxMonths = strategy.targetMonths || 600; // 50 year safety limit

    while (workingDebts.some(debt => debt.balance > 0) && month < maxMonths) {
      month++;
      
      let totalPayment = 0;
      let interestPaid = 0;
      let principalPaid = 0;
      let extraPaymentRemaining = strategy.extraPayment;

      // Pay minimums first
      workingDebts.forEach(debt => {
        if (debt.balance > 0) {
          const monthlyInterest = (debt.balance * debt.apr / 100) / 12;
          const principalPayment = Math.min(
            debt.minimumPayment - monthlyInterest,
            debt.balance
          );
          
          debt.balance -= principalPayment;
          totalPayment += debt.minimumPayment;
          interestPaid += monthlyInterest;
          principalPaid += principalPayment;
        }
      });

      // Apply extra payment to target debt
      const targetDebt = workingDebts.find(debt => debt.balance > 0);
      if (targetDebt && extraPaymentRemaining > 0) {
        const extraApplied = Math.min(extraPaymentRemaining, targetDebt.balance);
        targetDebt.balance -= extraApplied;
        totalPayment += extraApplied;
        principalPaid += extraApplied;
      }

      const totalBalance = workingDebts.reduce((sum, debt) => sum + debt.balance, 0);

      timeline.push({
        month,
        debts: workingDebts.map(debt => ({
          id: debt.id,
          name: debt.name,
          balance: debt.balance,
          payment: debt.balance > 0 ? debt.minimumPayment : 0,
          remainingMonths: this.estimateRemainingMonths(debt.balance, debt.minimumPayment, debt.apr),
        })),
        totalBalance,
        totalPayment,
        interestPaid,
        principalPaid,
      });
    }

    return timeline;
  }

  /**
   * Get comprehensive debt analytics
   */
  static async getDebtAnalytics(userId: string): Promise<DebtAnalytics> {
    const debts = await this.getUserDebts(userId);
    
    const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
    const monthlyMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment.toNumber(), 0);
    
    // Calculate weighted average APR
    const weightedAverageAPR = debts.length > 0 
      ? debts.reduce((sum, debt) => sum + (debt.apr.toNumber() * debt.remainingBalance), 0) / totalDebt
      : 0;

    // Group debts by type
    const debtsByType: Record<string, { count: number; totalBalance: number }> = {};
    debts.forEach(debt => {
      const type = debt.debtType;
      if (!debtsByType[type]) {
        debtsByType[type] = { count: 0, totalBalance: 0 };
      }
      debtsByType[type].count++;
      debtsByType[type].totalBalance += debt.remainingBalance;
    });

    // Calculate payoff timeline with minimum payments
    const payoffTimelineMonths = this.calculatePayoffTimeMonths(debts);
    const totalInterestWithMinimums = this.calculateTotalInterest(debts);

    // Get upcoming payments (next 30 days)
    const upcomingPayments = debts
      .filter(debt => debt.nextPaymentDate && debt.nextPaymentDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .map(debt => ({
        debtId: debt.id,
        name: debt.name,
        amount: debt.minimumPayment.toNumber(),
        dueDate: debt.nextPaymentDate!,
      }));

    return {
      totalDebt,
      monthlyMinimumPayments,
      weightedAverageAPR,
      payoffTimelineMonths,
      totalInterestWithMinimums,
      debtsByType,
      upcomingPayments,
    };
  }

  /**
   * Import debts from Plaid
   */
  static async importDebtsFromPlaid(userId: string, plaidDebts: Array<{
    accountId: string;
    name: string;
    balance: number;
    type: string;
    minimumPayment?: number;
    apr?: number;
  }>): Promise<Debt[]> {
    const importedDebts: Debt[] = [];

    for (const plaidDebt of plaidDebts) {
      // Check if debt already exists for this Plaid account
      const existingDebt = await prisma.debt.findFirst({
        where: { userId, plaidAccountId: plaidDebt.accountId }
      });

      const debtData = {
        name: plaidDebt.name,
        originalBalance: new Decimal(plaidDebt.balance),
        currentBalance: new Decimal(plaidDebt.balance),
        apr: new Decimal(plaidDebt.apr || 18.0), // Default estimate
        minimumPayment: new Decimal(plaidDebt.minimumPayment || Math.max(25, plaidDebt.balance * 0.02)),
        debtType: this.mapPlaidTypeToDebtType(plaidDebt.type),
        isFromPlaid: true,
        plaidAccountId: plaidDebt.accountId,
      };

      if (existingDebt) {
        // Update existing debt
        const updatedDebt = await prisma.debt.update({
          where: { id: existingDebt.id },
          data: debtData
        });
        importedDebts.push(updatedDebt);
      } else {
        // Create new debt
        const newDebt = await prisma.debt.create({
          data: { userId, ...debtData }
        });
        importedDebts.push(newDebt);
      }
    }

    return importedDebts;
  }

  // Private helper methods

  private static calculateNextPaymentDate(debt: Debt): Date | undefined {
    if (!debt.dueDate) return undefined;
    
    const now = new Date();
    const dueDate = new Date(debt.dueDate);
    
    if (dueDate > now) {
      return dueDate;
    }
    
    // Calculate next due date (monthly)
    const nextDue = new Date(dueDate);
    while (nextDue <= now) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }
    
    return nextDue;
  }

  private static estimateRemainingMonths(balance: number, minimumPayment: number, apr: number): number {
    if (balance <= 0) return 0;
    if (minimumPayment <= 0) return Infinity;
    
    const monthlyRate = apr / 100 / 12;
    if (monthlyRate === 0) return Math.ceil(balance / minimumPayment);
    
    const months = -Math.log(1 - (balance * monthlyRate) / minimumPayment) / Math.log(1 + monthlyRate);
    return Math.ceil(months);
  }

  private static calculatePayoffTimeMonths(debts: DebtWithPayments[]): number {
    let maxMonths = 0;
    
    debts.forEach(debt => {
      const months = this.estimateRemainingMonths(
        debt.remainingBalance,
        debt.minimumPayment.toNumber(),
        debt.apr.toNumber()
      );
      maxMonths = Math.max(maxMonths, months);
    });
    
    return maxMonths;
  }

  private static calculateTotalInterest(debts: DebtWithPayments[]): number {
    return debts.reduce((total, debt) => {
      const balance = debt.remainingBalance;
      const monthlyPayment = debt.minimumPayment.toNumber();
      const apr = debt.apr.toNumber();
      const months = this.estimateRemainingMonths(balance, monthlyPayment, apr);
      
      if (months === Infinity) return total;
      
      const totalPayments = monthlyPayment * months;
      const interest = Math.max(0, totalPayments - balance);
      return total + interest;
    }, 0);
  }

  private static mapPlaidTypeToDebtType(plaidType: string): DebtType {
    const lowerType = plaidType.toLowerCase();
    
    if (lowerType.includes('credit')) return DebtType.CREDIT_CARD;
    if (lowerType.includes('student')) return DebtType.STUDENT_LOAN;
    if (lowerType.includes('auto') || lowerType.includes('car')) return DebtType.AUTO_LOAN;
    if (lowerType.includes('mortgage') || lowerType.includes('home')) return DebtType.MORTGAGE;
    if (lowerType.includes('personal')) return DebtType.PERSONAL_LOAN;
    if (lowerType.includes('line')) return DebtType.LINE_OF_CREDIT;
    
    return DebtType.OTHER;
  }
}
