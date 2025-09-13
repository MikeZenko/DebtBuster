import { Router } from 'express';
import { DebtController } from '../controllers/debtController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/errorHandler';
import { createDebtSchema, updateDebtSchema, createPaymentSchema } from '../services/debtService';
import { z } from 'zod';

const router = Router();

// All debt routes require authentication
router.use(authenticate);

// Validation schemas for routes
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

const compareStrategiesQuerySchema = z.object({
  extraPayment: z.string().optional(),
});

// Debt CRUD routes
router.get('/', DebtController.getDebts);
router.post('/', validateBody(createDebtSchema), DebtController.createDebt);
router.get('/summary', DebtController.getSummary);
router.get('/analytics', DebtController.getAnalytics);

// Payoff strategy routes
router.post('/payoff-timeline', validateBody(payoffStrategySchema), DebtController.getPayoffTimeline);
router.get('/compare-strategies', DebtController.compareStrategies);

// Plaid integration routes
router.post('/import-plaid', validateBody(importPlaidDebtsSchema), DebtController.importFromPlaid);

// Individual debt routes
router.get('/:debtId', validateParams(debtIdSchema), DebtController.getDebt);
router.patch('/:debtId', validateParams(debtIdSchema), validateBody(updateDebtSchema), DebtController.updateDebt);
router.delete('/:debtId', validateParams(debtIdSchema), DebtController.deleteDebt);

// Payment routes
router.post('/payments', validateBody(createPaymentSchema), DebtController.addPayment);

export default router;
