import { Router } from 'express';
import { LoanController } from '../controllers/loanController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/errorHandler';
import { createLoanSchema, updateLoanSchema } from '../services/loanService';
import { z } from 'zod';

const router = Router();

// All loan routes require authentication
router.use(authenticate);

// Validation schemas for routes
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

// Loan CRUD routes
router.get('/', LoanController.getLoans);
router.post('/', validateBody(createLoanSchema), LoanController.createLoan);
router.get('/summary', LoanController.getSummary);
router.get('/analytics', LoanController.getAnalytics);

// Loan calculation and comparison routes
router.post('/calculate', validateBody(loanCalculationSchema), LoanController.calculateLoan);
router.post('/compare', validateBody(compareLoanIdsSchema), LoanController.compareLoans);

// Individual loan routes
router.get('/:loanId', validateParams(loanIdSchema), LoanController.getLoan);
router.patch('/:loanId', validateParams(loanIdSchema), validateBody(updateLoanSchema), LoanController.updateLoan);
router.delete('/:loanId', validateParams(loanIdSchema), LoanController.deleteLoan);
router.get('/:loanId/amortization', validateParams(loanIdSchema), LoanController.getAmortizationSchedule);

export default router;
