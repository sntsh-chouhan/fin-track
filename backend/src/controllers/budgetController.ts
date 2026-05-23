import { Request, Response } from 'express';
import { db, Budget } from '../services/db.js';

/**
 * Controller to manage Category Budget limits and dynamically match actual expenditures.
 */
export const budgetController = {
  // Get all budgets with dynamic integration of transaction outgoings
  getBudgets: (req: Request, res: Response): void => {
    try {
      const budgets = db.budgets.read();
      const transactions = db.transactions.read();

      // Dynamically calculate expenditures for each budget category
      const budgetsWithSpent = budgets.map(budget => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase())
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          ...budget,
          spent: Number(spent.toFixed(2))
        };
      });

      res.json(budgetsWithSpent);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve budgets' });
    }
  },

  // Create or Update a budget limit for a specific category
  createOrUpdateBudget: (req: Request, res: Response): void => {
    try {
      const { category, limit } = req.body;

      if (!category || typeof category !== 'string' || category.trim() === '') {
        res.status(400).json({ error: 'Valid category title is required' });
        return;
      }

      const numLimit = parseFloat(limit);
      if (isNaN(numLimit) || numLimit <= 0 || !isFinite(numLimit)) {
        res.status(400).json({ error: 'Budget limit must be a positive number' });
        return;
      }

      const budgets = db.budgets.read();
      const existingIndex = budgets.findIndex(b => b.category.toLowerCase() === category.trim().toLowerCase());

      const updatedBudget: Budget = {
        category: category.trim(),
        limit: Number(numLimit.toFixed(2))
      };

      if (existingIndex !== -1) {
        budgets[existingIndex] = updatedBudget;
      } else {
        budgets.push(updatedBudget);
      }

      db.budgets.save(budgets);
      
      // Calculate dynamic spent for immediate response
      const transactions = db.transactions.read();
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === updatedBudget.category.toLowerCase())
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      res.json({
        ...updatedBudget,
        spent: Number(spent.toFixed(2))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to configure budget' });
    }
  },

  // Delete a category budget limit
  deleteBudget: (req: Request, res: Response): void => {
    try {
      const categoryParam = req.params.category;
      if (!categoryParam || typeof categoryParam !== 'string') {
        res.status(400).json({ error: 'Category is required' });
        return;
      }

      const budgets = db.budgets.read();
      const filtered = budgets.filter(b => b.category.toLowerCase() !== categoryParam.toLowerCase());

      if (budgets.length === filtered.length) {
        res.status(404).json({ error: 'Budget for category not found' });
        return;
      }

      db.budgets.save(filtered);
      res.json({ success: true, message: `Budget for ${categoryParam} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete budget' });
    }
  }
};
