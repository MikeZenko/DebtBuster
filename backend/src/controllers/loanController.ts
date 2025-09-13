import { Response } from 'express';
import { LoanService, createLoanSchema, updateLoanSchema } from '../services/loanService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { z } from 'zod';

// Additional validation schemas
const loanIdSchema = z.object({
  loanId: z.string().uuid('Invalid loan ID format'),
});

const loanCalculationSchema = z.object({
  principal: z.number().positive().max(10000000),
  apr: z.number().min(0).max(100),
  termMonths: z.number().int().min(1).max(600),
  fees: z.number().min(0).default(0),
});

const compareLoanIdsSchema = z.object({
  loanIds: z.array(z.string().uuid()).optional(),
});

export class LoanController {
  /**
   * Get all loans for the authenticated user
   */
  static getLoans = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const loans = await LoanService.getUserLoans(req.user.id);

    // Add calculations for each loan
    const loansWithCalculations = loans.map(loan => {
      const calculations = LoanService.calculateLoanDetails(
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
        loanType: loan.loanType,
        lender: loan.lender,
        notes: loan.notes,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
        calculations: {
          monthlyPayment: calculations.monthlyPayment,
          totalInterest: calculations.totalInterest,
          totalCost: calculations.totalCost,
          redFlags: calculations.redFlags,
        }
      };
    });

    res.json({
      success: true,
      data: {
        loans: loansWithCalculations,
        count: loans.length,
      }
    });
  });

  /**
   * Get a specific loan with full calculations
   */
  static getLoan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { loanId } = loanIdSchema.parse(req.params);
    const loan = await LoanService.getLoan(req.user.id, loanId);

    if (!loan) {
      throw createError('Loan not found', 404, 'LOAN_NOT_FOUND');
    }

    const calculations = LoanService.calculateLoanDetails(
      loan.principal.toNumber(),
      loan.apr.toNumber(),
      loan.termMonths,
      loan.fees.toNumber()
    );

    res.json({
      success: true,
      data: {
        loan: {
          id: loan.id,
          name: loan.name,
          principal: loan.principal.toNumber(),
          apr: loan.apr.toNumber(),
          termMonths: loan.termMonths,
          fees: loan.fees.toNumber(),
          loanType: loan.loanType,
          lender: loan.lender,
          notes: loan.notes,
          createdAt: loan.createdAt,
          updatedAt: loan.updatedAt,
          calculations,
        }
      }
    });
  });

  /**
   * Create a new loan
   */
  static createLoan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const validatedData = createLoanSchema.parse(req.body);

    try {
      const loan = await LoanService.createLoan(req.user.id, validatedData);
      
      // Calculate loan details for response
      const calculations = LoanService.calculateLoanDetails(
        loan.principal.toNumber(),
        loan.apr.toNumber(),
        loan.termMonths,
        loan.fees.toNumber()
      );

      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        data: {
          loan: {
            id: loan.id,
            name: loan.name,
            principal: loan.principal.toNumber(),
            apr: loan.apr.toNumber(),
            termMonths: loan.termMonths,
            fees: loan.fees.toNumber(),
            loanType: loan.loanType,
            lender: loan.lender,
            notes: loan.notes,
            createdAt: loan.createdAt,
            calculations: {
              monthlyPayment: calculations.monthlyPayment,
              totalInterest: calculations.totalInterest,
              totalCost: calculations.totalCost,
              redFlags: calculations.redFlags,
            }
          }
        }
      });
    } catch (error: any) {
      if (error.message.includes('Invalid loan data')) {
        throw createError(error.message, 400, 'INVALID_LOAN_DATA');
      }
      throw error;
    }
  });

  /**
   * Update a loan
   */
  static updateLoan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { loanId } = loanIdSchema.parse(req.params);
    const validatedData = updateLoanSchema.parse(req.body);

    try {
      const loan = await LoanService.updateLoan(req.user.id, loanId, validatedData);
      
      // Calculate updated loan details
      const calculations = LoanService.calculateLoanDetails(
        loan.principal.toNumber(),
        loan.apr.toNumber(),
        loan.termMonths,
        loan.fees.toNumber()
      );

      res.json({
        success: true,
        message: 'Loan updated successfully',
        data: {
          loan: {
            id: loan.id,
            name: loan.name,
            principal: loan.principal.toNumber(),
            apr: loan.apr.toNumber(),
            termMonths: loan.termMonths,
            fees: loan.fees.toNumber(),
            loanType: loan.loanType,
            lender: loan.lender,
            notes: loan.notes,
            updatedAt: loan.updatedAt,
            calculations: {
              monthlyPayment: calculations.monthlyPayment,
              totalInterest: calculations.totalInterest,
              totalCost: calculations.totalCost,
              redFlags: calculations.redFlags,
            }
          }
        }
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw createError('Loan not found', 404, 'LOAN_NOT_FOUND');
      }
      if (error.message.includes('Invalid loan data')) {
        throw createError(error.message, 400, 'INVALID_LOAN_DATA');
      }
      throw error;
    }
  });

  /**
   * Delete a loan
   */
  static deleteLoan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { loanId } = loanIdSchema.parse(req.params);

    try {
      await LoanService.deleteLoan(req.user.id, loanId);
      
      res.json({
        success: true,
        message: 'Loan deleted successfully'
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw createError('Loan not found', 404, 'LOAN_NOT_FOUND');
      }
      throw error;
    }
  });

  /**
   * Calculate loan details for given parameters (without saving)
   */
  static calculateLoan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = loanCalculationSchema.parse(req.body);

    try {
      const calculations = LoanService.calculateLoanDetails(
        validatedData.principal,
        validatedData.apr,
        validatedData.termMonths,
        validatedData.fees
      );

      res.json({
        success: true,
        data: {
          input: validatedData,
          calculations
        }
      });
    } catch (error: any) {
      throw createError('Failed to calculate loan details', 400, 'CALCULATION_ERROR');
    }
  });

  /**
   * Compare multiple loans
   */
  static compareLoans = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { loanIds } = compareLoanIdsSchema.parse(req.body);

    try {
      const comparison = await LoanService.compareLoans(req.user.id, loanIds);

      res.json({
        success: true,
        data: comparison
      });
    } catch (error: any) {
      if (error.message.includes('No loans found')) {
        throw createError('No loans available for comparison', 404, 'NO_LOANS_FOUND');
      }
      throw error;
    }
  });

  /**
   * Get loan analytics for the user
   */
  static getAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const analytics = await LoanService.getLoanAnalytics(req.user.id);

    res.json({
      success: true,
      data: { analytics }
    });
  });

  /**
   * Get amortization schedule for a specific loan
   */
  static getAmortizationSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { loanId } = loanIdSchema.parse(req.params);
    const loan = await LoanService.getLoan(req.user.id, loanId);

    if (!loan) {
      throw createError('Loan not found', 404, 'LOAN_NOT_FOUND');
    }

    const calculations = LoanService.calculateLoanDetails(
      loan.principal.toNumber(),
      loan.apr.toNumber(),
      loan.termMonths,
      loan.fees.toNumber()
    );

    res.json({
      success: true,
      data: {
        loanId: loan.id,
        loanName: loan.name,
        schedule: calculations.amortizationSchedule,
        summary: {
          monthlyPayment: calculations.monthlyPayment,
          totalInterest: calculations.totalInterest,
          totalCost: calculations.totalCost,
          termMonths: loan.termMonths,
        }
      }
    });
  });

  /**
   * Get loan summary statistics
   */
  static getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const loans = await LoanService.getUserLoans(req.user.id);
    
    let totalLoanValue = 0;
    let totalMonthlyPayments = 0;
    let totalInterest = 0;
    let redFlagCount = 0;

    loans.forEach(loan => {
      const calculations = LoanService.calculateLoanDetails(
        loan.principal.toNumber(),
        loan.apr.toNumber(),
        loan.termMonths,
        loan.fees.toNumber()
      );

      totalLoanValue += loan.principal.toNumber();
      totalMonthlyPayments += calculations.monthlyPayment;
      totalInterest += calculations.totalInterest;
      redFlagCount += calculations.redFlags.length;
    });

    const summary = {
      loanCount: loans.length,
      totalLoanValue,
      totalMonthlyPayments,
      totalInterest,
      averageAPR: loans.length > 0 
        ? loans.reduce((sum, loan) => sum + loan.apr.toNumber(), 0) / loans.length 
        : 0,
      highestAPR: loans.length > 0 
        ? Math.max(...loans.map(loan => loan.apr.toNumber()))
        : 0,
      lowestAPR: loans.length > 0 
        ? Math.min(...loans.map(loan => loan.apr.toNumber()))
        : 0,
      redFlagCount,
      loanTypes: loans.reduce((acc, loan) => {
        const type = loan.loanType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      data: { summary }
    });
  });
}
