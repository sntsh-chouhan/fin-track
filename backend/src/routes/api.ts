import { Router, Request, Response } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { budgetController } from '../controllers/budgetController.js';
import { goalController } from '../controllers/goalController.js';
import { settingsController } from '../controllers/settingsController.js';

const router = Router();

// General Health / Status endpoint
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'FinTrack API is active and running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Transactions REST endpoints
router.get('/transactions', transactionController.getTransactions);
router.get('/transactions/metrics', transactionController.getMetrics);
router.get('/transactions/:id', transactionController.getTransactionById);
router.post('/transactions', transactionController.createTransaction);
router.put('/transactions/:id', transactionController.updateTransaction);
router.delete('/transactions/:id', transactionController.deleteTransaction);

// Budgets REST endpoints
router.get('/budgets', budgetController.getBudgets);
router.post('/budgets', budgetController.createOrUpdateBudget);
router.delete('/budgets/:category', budgetController.deleteBudget);

// Goals REST endpoints
router.get('/goals', goalController.getGoals);
router.post('/goals', goalController.createGoal);
router.put('/goals/:id', goalController.updateGoal);
router.post('/goals/:id/contribute', goalController.contributeToGoal);
router.delete('/goals/:id', goalController.deleteGoal);

// Settings REST endpoints
router.get('/settings', settingsController.getSettings);
router.post('/settings', settingsController.updateSettings);
router.post('/settings/reset', settingsController.resetDatabase);

export default router;
