import { Request, Response } from 'express';
import { db, SavingsGoal, Transaction } from '../services/db.js';

/**
 * Controller to manage Savings Goals and Contributions
 */
export const goalController = {
  // Get all goals
  getGoals: (req: Request, res: Response): void => {
    try {
      const goals = db.goals.read();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve goals' });
    }
  },

  // Create a new savings goal
  createGoal: (req: Request, res: Response): void => {
    try {
      const { title, targetAmount, currentAmount, targetDate } = req.body;

      if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ error: 'Valid goal title is required' });
        return;
      }

      const target = parseFloat(targetAmount);
      if (isNaN(target) || target <= 0 || !isFinite(target)) {
        res.status(400).json({ error: 'Target amount must be a positive number' });
        return;
      }

      const current = currentAmount !== undefined ? parseFloat(currentAmount) : 0;
      if (isNaN(current) || current < 0 || !isFinite(current)) {
        res.status(400).json({ error: 'Current amount must be a positive number' });
        return;
      }

      const parsedDate = new Date(targetDate);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Valid target date is required' });
        return;
      }

      const newGoal: SavingsGoal = {
        id: 'g' + Date.now().toString() + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        targetAmount: Number(target.toFixed(2)),
        currentAmount: Number(current.toFixed(2)),
        targetDate: parsedDate.toISOString()
      };

      const goals = db.goals.read();
      goals.push(newGoal);
      db.goals.save(goals);

      res.status(201).json(newGoal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create goal' });
    }
  },

  // Update a savings goal
  updateGoal: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { title, targetAmount, currentAmount, targetDate } = req.body;

      const goals = db.goals.read();
      const index = goals.findIndex(g => g.id === id);

      if (index === -1) {
        res.status(404).json({ error: 'Savings goal not found' });
        return;
      }

      const goal = goals[index];

      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
          res.status(400).json({ error: 'Valid goal title is required' });
          return;
        }
        goal.title = title.trim();
      }

      if (targetAmount !== undefined) {
        const target = parseFloat(targetAmount);
        if (isNaN(target) || target <= 0 || !isFinite(target)) {
          res.status(400).json({ error: 'Target amount must be a positive number' });
          return;
        }
        goal.targetAmount = Number(target.toFixed(2));
      }

      if (currentAmount !== undefined) {
        const current = parseFloat(currentAmount);
        if (isNaN(current) || current < 0 || !isFinite(current)) {
          res.status(400).json({ error: 'Current amount must be a positive number' });
          return;
        }
        goal.currentAmount = Number(current.toFixed(2));
      }

      if (targetDate !== undefined) {
        const parsedDate = new Date(targetDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Valid target date is required' });
          return;
        }
        goal.targetDate = parsedDate.toISOString();
      }

      goals[index] = goal;
      db.goals.save(goals);

      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update goal' });
    }
  },

  // Contribute money to a goal
  contributeToGoal: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      const contribution = parseFloat(amount);
      if (isNaN(contribution) || contribution <= 0 || !isFinite(contribution)) {
        res.status(400).json({ error: 'Contribution amount must be a positive number' });
        return;
      }

      const goals = db.goals.read();
      const goalIndex = goals.findIndex(g => g.id === id);

      if (goalIndex === -1) {
        res.status(404).json({ error: 'Savings goal not found' });
        return;
      }

      const goal = goals[goalIndex];
      goal.currentAmount = Number((goal.currentAmount + contribution).toFixed(2));

      // Save goals
      goals[goalIndex] = goal;
      db.goals.save(goals);

      // CRITICAL LOGICAL FLOW: Write a corresponding transaction entry
      // to reflect this contribution in overall net worth as a specialized outgoing!
      const transactions = db.transactions.read();
      const contributionTx: Transaction = {
        id: 'c' + Date.now().toString(),
        title: `Contribution: ${goal.title}`,
        amount: -contribution, // registers as expense/transfer in general log
        type: 'expense',
        category: 'Investments',
        date: new Date().toISOString()
      };
      
      transactions.unshift(contributionTx);
      db.transactions.save(transactions);

      res.json({ goal, transaction: contributionTx });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register contribution' });
    }
  },

  // Delete a goal
  deleteGoal: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const goals = db.goals.read();
      const filtered = goals.filter(g => g.id !== id);

      if (goals.length === filtered.length) {
        res.status(404).json({ error: 'Savings goal not found' });
        return;
      }

      db.goals.save(filtered);
      res.json({ success: true, message: 'Savings goal deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  }
};
