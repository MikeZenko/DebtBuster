import { Response } from 'express';
import { DebtService, createDebtSchema, updateDebtSchema, createPaymentSchema } from '../services/debtService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { z } from 'zod';

// Additional validation schemas
const debtIdSchema = z.object({
  debtId: z.string().uuid('Invalid debt ID format'),
});

const payoffStrategySchema = z.object({
  type: z.enum(['snowball', 'avalanche']),
  extraPayment: z.number().min(0),
  targetMonths: z.number().int().min(1).max(600).optional(),
});

const importPlaidDebtsSchema = z.object({
  debts: z.array(z.object({
    accountId: z.string(),
    name: z.string(),
    balance: z.number().positive(),
    type: z.string(),
    minimumPayment: z.number().positive().optional(),
    apr: z.number().min(0).max(100).optional(),
  })),
});

export class DebtController {
  /**
   * Get all debts for the authenticated user
   */
  static getDebts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const debts = await DebtService.getUserDebts(req.user.id);

    res.json({
      success: true,
      data: {
        debts,
        count: debts.length,
      }
    });
  });

  /**
   * Get a specific debt
   */
  static getDebt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { debtId } = debtIdSchema.parse(req.params);
    const debt = await DebtService.getDebt(req.user.id, debtId);

    if (!debt) {
      throw createError('Debt not found', 404, 'DEBT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { debt }
    });
  });

  /**
   * Create a new debt
   */
  static createDebt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const validatedData = createDebtSchema.parse(req.body);
    const debt = await DebtService.createDebt(req.user.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Debt created successfully',
      data: { debt }
    });
  });

  /**
   * Update a debt
   */
  static updateDebt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { debtId } = debtIdSchema.parse(req.params);
    const validatedData = updateDebtSchema.parse(req.body);

    try {
      const debt = await DebtService.updateDebt(req.user.id, debtId, validatedData);
      
      res.json({
        success: true,
        message: 'Debt updated successfully',
        data: { debt }
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw createError('Debt not found', 404, 'DEBT_NOT_FOUND');
      }
      throw error;
    }
  });

  /**
   * Delete a debt
   */
  static deleteDebt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { debtId } = debtIdSchema.parse(req.params);

    try {
      await DebtService.deleteDebt(req.user.id, debtId);
      
      res.json({
        success: true,
        message: 'Debt deleted successfully'
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw createError('Debt not found', 404, 'DEBT_NOT_FOUND');
      }
      throw error;
    }
  });

  /**
   * Add a payment to a debt
   */
  static addPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const validatedData = createPaymentSchema.parse(req.body);

    try {
      const payment = await DebtService.addPayment(req.user.id, validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Payment added successfully',
        data: { payment }
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw createError('Debt not found', 404, 'DEBT_NOT_FOUND');
      }
      throw error;
    }
  });

  /**
   * Calculate payoff timeline with strategy
   */
  static getPayoffTimeline = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const strategy = payoffStrategySchema.parse(req.body);
    const timeline = await DebtService.calculatePayoffTimeline(req.user.id, strategy);

    // Calculate summary statistics
    const totalMonths = timeline.length;
    const totalInterest = timeline.reduce((sum, month) => sum + month.interestPaid, 0);
    const totalPayments = timeline.reduce((sum, month) => sum + month.totalPayment, 0);
    const finalBalance = timeline[timeline.length - 1]?.totalBalance || 0;

    res.json({
      success: true,
      data: {
        timeline,
        summary: {
          totalMonths,
          totalInterest,
          totalPayments,
          finalBalance,
          strategy: strategy.type,
          extraPayment: strategy.extraPayment,
        }
      }
    });
  });

  /**
   * Get comprehensive debt analytics
   */
  static getAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const analytics = await DebtService.getDebtAnalytics(req.user.id);

    res.json({
      success: true,
      data: { analytics }
    });
  });

  /**
   * Import debts from Plaid
   */
  static importFromPlaid = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { debts } = importPlaidDebtsSchema.parse(req.body);
    const importedDebts = await DebtService.importDebtsFromPlaid(req.user.id, debts);

    res.json({
      success: true,
      message: `Successfully imported ${importedDebts.length} debts from Plaid`,
      data: {
        debts: importedDebts,
        count: importedDebts.length,
      }
    });
  });

  /**
   * Get debt summary statistics
   */
  static getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const debts = await DebtService.getUserDebts(req.user.id);
    
    const summary = {
      totalDebt: debts.reduce((sum, debt) => sum + debt.remainingBalance, 0),
      totalMonthlyPayments: debts.reduce((sum, debt) => sum + debt.minimumPayment.toNumber(), 0),
      debtCount: debts.length,
      averageAPR: debts.length > 0 
        ? debts.reduce((sum, debt) => sum + debt.apr.toNumber(), 0) / debts.length 
        : 0,
      highestAPR: debts.length > 0 
        ? Math.max(...debts.map(debt => debt.apr.toNumber()))
        : 0,
      largestBalance: debts.length > 0 
        ? Math.max(...debts.map(debt => debt.remainingBalance))
        : 0,
      upcomingPayments: debts
        .filter(debt => debt.nextPaymentDate)
        .sort((a, b) => (a.nextPaymentDate!.getTime() - b.nextPaymentDate!.getTime()))
        .slice(0, 5)
        .map(debt => ({
          debtId: debt.id,
          name: debt.name,
          amount: debt.minimumPayment.toNumber(),
          dueDate: debt.nextPaymentDate,
        })),
    };

    res.json({
      success: true,
      data: { summary }
    });
  });

  /**
   * Get debt comparison for different payoff strategies
   */
  static compareStrategies = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const extraPayment = parseFloat(req.query.extraPayment as string) || 0;
    
    // Calculate both strategies
    const snowballTimeline = await DebtService.calculatePayoffTimeline(req.user.id, {
      type: 'snowball',
      extraPayment,
    });

    const avalancheTimeline = await DebtService.calculatePayoffTimeline(req.user.id, {
      type: 'avalanche',
      extraPayment,
    });

    const snowballSummary = {
      type: 'snowball',
      totalMonths: snowballTimeline.length,
      totalInterest: snowballTimeline.reduce((sum, month) => sum + month.interestPaid, 0),
      totalPayments: snowballTimeline.reduce((sum, month) => sum + month.totalPayment, 0),
    };

    const avalancheSummary = {
      type: 'avalanche',
      totalMonths: avalancheTimeline.length,
      totalInterest: avalancheTimeline.reduce((sum, month) => sum + month.interestPaid, 0),
      totalPayments: avalancheTimeline.reduce((sum, month) => sum + month.totalPayment, 0),
    };

    const savings = {
      monthsDifference: snowballSummary.totalMonths - avalancheSummary.totalMonths,
      interestSavings: snowballSummary.totalInterest - avalancheSummary.totalInterest,
      recommendedStrategy: avalancheSummary.totalInterest < snowballSummary.totalInterest ? 'avalanche' : 'snowball',
    };

    res.json({
      success: true,
      data: {
        strategies: [snowballSummary, avalancheSummary],
        savings,
        extraPayment,
      }
    });
  });
}
