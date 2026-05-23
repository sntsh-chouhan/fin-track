import { Request, Response } from 'express';
import { db, Transaction } from '../services/db.js';

/**
 * Controller to manage Transaction business logic
 */
export const transactionController = {
  // Get all transactions with search, sorting, and filters
  getTransactions: (req: Request, res: Response): void => {
    try {
      let transactions = db.transactions.read();
      const { search, type, category, sort } = req.query;

      // Filter by search query (title or category)
      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        transactions = transactions.filter(
          t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query)
        );
      }

      // Filter by type (income | expense)
      if (type === 'income' || type === 'expense') {
        transactions = transactions.filter(t => t.type === type);
      }

      // Filter by category
      if (category && typeof category === 'string') {
        transactions = transactions.filter(
          t => t.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Sort by date (default: descending / newest first)
      if (sort === 'oldest') {
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
  },

  // Get transaction by ID
  getTransactionById: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const transactions = db.transactions.read();
      const transaction = transactions.find(t => t.id === id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transaction details' });
    }
  },

  // Create new transaction entries with strict numerical and date parsing
  createTransaction: (req: Request, res: Response): void => {
    try {
      const { title, amount, type, category, date } = req.body;

      // Input Validation
      if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ error: 'Valid title is required' });
        return;
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount === 0 || !isFinite(numAmount)) {
        res.status(400).json({ error: 'Amount must be a non-zero valid number' });
        return;
      }

      if (type !== 'income' && type !== 'expense') {
        res.status(400).json({ error: 'Type must be either "income" or "expense"' });
        return;
      }

      if (!category || typeof category !== 'string' || category.trim() === '') {
        res.status(400).json({ error: 'Valid category is required' });
        return;
      }

      // Validate date ISO format
      const parsedDate = new Date(date || Date.now());
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Valid date is required' });
        return;
      }

      // Enforce: Expense must be negative, Income must be positive
      const finalAmount = type === 'income' ? Math.abs(numAmount) : -Math.abs(numAmount);

      const newTransaction: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        amount: finalAmount,
        type,
        category: category.trim(),
        date: parsedDate.toISOString()
      };

      const transactions = db.transactions.read();
      transactions.unshift(newTransaction);
      db.transactions.save(transactions);

      res.status(201).json(newTransaction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  },

  // Update an existing transaction entry
  updateTransaction: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { title, amount, type, category, date } = req.body;

      const transactions = db.transactions.read();
      const index = transactions.findIndex(t => t.id === id);

      if (index === -1) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      const tx = transactions[index];

      // Update fields if provided and validate
      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
          res.status(400).json({ error: 'Valid title is required' });
          return;
        }
        tx.title = title.trim();
      }

      if (type !== undefined) {
        if (type !== 'income' && type !== 'expense') {
          res.status(400).json({ error: 'Type must be "income" or "expense"' });
          return;
        }
        tx.type = type;
      }

      if (amount !== undefined) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount === 0 || !isFinite(numAmount)) {
          res.status(400).json({ error: 'Amount must be a non-zero valid number' });
          return;
        }
        // Force signage matches type
        tx.amount = tx.type === 'income' ? Math.abs(numAmount) : -Math.abs(numAmount);
      } else if (type !== undefined) {
        // Signage correction if type changed but amount remained same
        tx.amount = tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
      }

      if (category !== undefined) {
        if (typeof category !== 'string' || category.trim() === '') {
          res.status(400).json({ error: 'Valid category is required' });
          return;
        }
        tx.category = category.trim();
      }

      if (date !== undefined) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Valid date is required' });
          return;
        }
        tx.date = parsedDate.toISOString();
      }

      transactions[index] = tx;
      db.transactions.save(transactions);

      res.json(tx);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  },

  // Delete transaction entries
  deleteTransaction: (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const transactions = db.transactions.read();
      const filtered = transactions.filter(t => t.id !== id);

      if (transactions.length === filtered.length) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      db.transactions.save(filtered);
      res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  },

  // Calculate high-fidelity aggregated metrics from current transaction database
  getMetrics: (req: Request, res: Response): void => {
    try {
      const transactions = db.transactions.read();
      
      // Calculate dynamic income and expenses
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = Math.abs(
        transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
      );

      const netSavings = income - expenses;
      
      // Base Net Asset calculation ($10,000 baseline asset + net sum of transactions)
      const BASELINE_LIQUIDITY = 11287.00;
      const netTransactionDelta = transactions.reduce((sum, t) => sum + t.amount, 0);
      const balance = BASELINE_LIQUIDITY + netTransactionDelta;

      // Savings Rate String
      let savingsRate = '0%';
      if (income > 0) {
        savingsRate = ((netSavings / income) * 100).toFixed(1) + '%';
      }

      res.json({
        balance,
        income,
        expenses,
        savingsRate
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate finance metrics' });
    }
  }
};
