import { Router } from 'express';
import { PlaidController } from '../controllers/plaidController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/errorHandler';
import { linkTokenSchema, exchangeTokenSchema } from '../services/plaidService';
import { z } from 'zod';

const router = Router();

// All Plaid routes require authentication
router.use(authenticate);

// Validation schemas for routes
const itemIdSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

const syncTransactionsSchema = z.object({
  startDate: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)), 
    'Invalid start date format'
  ),
  endDate: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)), 
    'Invalid end date format'
  ),
});

const spendingAnalysisQuerySchema = z.object({
  months: z.string().optional().refine(
    (months) => !months || (!isNaN(Number(months)) && Number(months) >= 1 && Number(months) <= 24),
    'Months must be between 1 and 24'
  ),
});

const createLinkTokenBodySchema = z.object({
  clientName: z.string().optional(),
});

const exchangeTokenBodySchema = z.object({
  publicToken: z.string().min(1, 'Public token is required'),
});

// Plaid Link routes
router.post('/create-link-token', validateBody(createLinkTokenBodySchema), PlaidController.createLinkToken);
router.post('/exchange-token', validateBody(exchangeTokenBodySchema), PlaidController.exchangeToken);

// Account and connection management routes
router.get('/accounts', PlaidController.getAccounts);
router.get('/connection-status', PlaidController.getConnectionStatus);
router.delete('/items/:itemId', validateParams(itemIdSchema), PlaidController.removeItem);

// Financial data routes
router.get('/debt-summary', PlaidController.getDebtSummary);
router.post('/sync-transactions', validateBody(syncTransactionsSchema), PlaidController.syncTransactions);
router.get('/spending-analysis', validateQuery(spendingAnalysisQuerySchema), PlaidController.getSpendingAnalysis);

// Utility routes
router.get('/transaction-categories', PlaidController.getTransactionCategories);
router.get('/health', PlaidController.health);

export default router;
