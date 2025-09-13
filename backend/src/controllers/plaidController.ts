import { Response } from 'express';
import { PlaidService, linkTokenSchema, exchangeTokenSchema } from '../services/plaidService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { z } from 'zod';

// Additional validation schemas
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

const spendingAnalysisSchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional().default(3),
});

export class PlaidController {
  /**
   * Create link token for Plaid Link initialization
   */
  static createLinkToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const validatedData = linkTokenSchema.parse({
      userId: req.user.id,
      clientName: req.body.clientName,
    });

    try {
      const linkTokenData = await PlaidService.createLinkToken(validatedData);

      res.json({
        success: true,
        message: 'Link token created successfully',
        data: linkTokenData
      });
    } catch (error: any) {
      console.error('Link token creation error:', error);
      throw createError('Failed to create link token', 500, 'LINK_TOKEN_ERROR');
    }
  });

  /**
   * Exchange public token for access token and store connection
   */
  static exchangeToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const validatedData = exchangeTokenSchema.parse({
      publicToken: req.body.publicToken,
      userId: req.user.id,
    });

    try {
      const result = await PlaidService.exchangePublicToken(validatedData);

      res.json({
        success: true,
        message: 'Bank account connected successfully',
        data: {
          itemId: result.itemId,
          accounts: result.accounts,
          accountCount: result.accounts.length,
        }
      });
    } catch (error: any) {
      console.error('Token exchange error:', error);
      
      if (error.message.includes('Plaid error')) {
        throw createError(error.message, 400, 'PLAID_ERROR');
      }
      
      throw createError('Failed to connect bank account', 500, 'TOKEN_EXCHANGE_ERROR');
    }
  });

  /**
   * Get user's connected accounts
   */
  static getAccounts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    try {
      const accounts = await PlaidService.getUserAccounts(req.user.id);

      res.json({
        success: true,
        data: {
          accounts,
          count: accounts.length,
        }
      });
    } catch (error: any) {
      console.error('Get accounts error:', error);
      throw createError('Failed to retrieve accounts', 500, 'ACCOUNTS_ERROR');
    }
  });

  /**
   * Get debt summary from connected accounts
   */
  static getDebtSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    try {
      const debtSummary = await PlaidService.getDebtSummary(req.user.id);

      res.json({
        success: true,
        data: debtSummary
      });
    } catch (error: any) {
      console.error('Debt summary error:', error);
      throw createError('Failed to retrieve debt summary', 500, 'DEBT_SUMMARY_ERROR');
    }
  });

  /**
   * Sync transactions from connected accounts
   */
  static syncTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { startDate, endDate } = syncTransactionsSchema.parse(req.body);

    try {
      const transactions = await PlaidService.syncTransactions(
        req.user.id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.json({
        success: true,
        message: `Successfully synced ${transactions.length} transactions`,
        data: {
          transactions,
          count: transactions.length,
          syncedAt: new Date().toISOString(),
        }
      });
    } catch (error: any) {
      console.error('Transaction sync error:', error);
      throw createError('Failed to sync transactions', 500, 'TRANSACTION_SYNC_ERROR');
    }
  });

  /**
   * Get spending analysis
   */
  static getSpendingAnalysis = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { months } = spendingAnalysisSchema.parse(req.query);

    try {
      const analysis = await PlaidService.getSpendingAnalysis(req.user.id, months);

      // Calculate additional insights
      const insights = {
        topCategories: Object.entries(analysis.categorizedSpending)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, amount]) => ({ category, amount })),
        debtPaymentRatio: analysis.totalSpending > 0 
          ? (analysis.debtPayments / analysis.totalSpending) * 100 
          : 0,
        averageDailySpending: analysis.averageMonthlySpending / 30,
      };

      res.json({
        success: true,
        data: {
          ...analysis,
          insights,
          period: {
            months,
            startDate: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          }
        }
      });
    } catch (error: any) {
      console.error('Spending analysis error:', error);
      throw createError('Failed to generate spending analysis', 500, 'SPENDING_ANALYSIS_ERROR');
    }
  });

  /**
   * Remove connected bank account
   */
  static removeItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { itemId } = itemIdSchema.parse(req.params);

    try {
      await PlaidService.removeItem(req.user.id, itemId);

      res.json({
        success: true,
        message: 'Bank account disconnected successfully'
      });
    } catch (error: any) {
      console.error('Remove item error:', error);
      
      if (error.message.includes('not found')) {
        throw createError('Bank connection not found', 404, 'ITEM_NOT_FOUND');
      }
      
      throw createError('Failed to disconnect bank account', 500, 'REMOVE_ITEM_ERROR');
    }
  });

  /**
   * Get connection status and last sync information
   */
  static getConnectionStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    try {
      const accounts = await PlaidService.getUserAccounts(req.user.id);
      const isConnected = accounts.length > 0;

      // Get basic connection info without full account details
      const connectionInfo = {
        isConnected,
        accountCount: accounts.length,
        institutions: Array.from(new Set(accounts.map(acc => acc.type))),
        lastSyncDate: new Date().toISOString(), // This would come from stored sync data
      };

      res.json({
        success: true,
        data: connectionInfo
      });
    } catch (error: any) {
      console.error('Connection status error:', error);
      throw createError('Failed to get connection status', 500, 'CONNECTION_STATUS_ERROR');
    }
  });

  /**
   * Health check for Plaid integration
   */
  static health = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Basic health check - could be expanded to test Plaid API connectivity
      res.json({
        success: true,
        message: 'Plaid service is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.PLAID_ENV || 'sandbox',
      });
    } catch (error: any) {
      throw createError('Plaid service health check failed', 500, 'HEALTH_CHECK_ERROR');
    }
  });

  /**
   * Get transaction categories for filtering/analysis
   */
  static getTransactionCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    try {
      // This would typically come from stored transaction data
      // For now, return common categories
      const categories = [
        'Food and Drink',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills',
        'Healthcare',
        'Travel',
        'Personal Care',
        'Education',
        'Investments',
        'Charitable Giving',
        'Other'
      ];

      res.json({
        success: true,
        data: {
          categories,
          count: categories.length,
        }
      });
    } catch (error: any) {
      console.error('Transaction categories error:', error);
      throw createError('Failed to get transaction categories', 500, 'CATEGORIES_ERROR');
    }
  });
}
