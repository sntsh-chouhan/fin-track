import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middlewares
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Core Routes
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'FinTrack API is active and running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock transactions endpoint for the rich dashboard skeleton
app.get('/api/transactions/mock', (req: Request, res: Response) => {
  const transactions = [
    {
      id: '1',
      title: 'Salary Credit',
      amount: 4800.00,
      type: 'income',
      category: 'Salary',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    },
    {
      id: '2',
      title: 'Whole Foods Market',
      amount: -124.50,
      type: 'expense',
      category: 'Groceries',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    },
    {
      id: '3',
      title: 'Equinox Gym Membership',
      amount: -150.00,
      type: 'expense',
      category: 'Health & Fitness',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    },
    {
      id: '4',
      title: 'Stock Portfolio Dividend',
      amount: 320.00,
      type: 'income',
      category: 'Investments',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    },
    {
      id: '5',
      title: 'Netflix Subscription',
      amount: -19.99,
      type: 'expense',
      category: 'Entertainment',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    },
    {
      id: '6',
      title: 'Apple Store Purchase',
      amount: -1299.00,
      type: 'expense',
      category: 'Electronics',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    }
  ];

  // Calculate summary metrics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = Math.abs(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const netSavings = totalIncome - totalExpenses;

  res.json({
    metrics: {
      balance: 14850.50, // mock starting balance + savings
      income: totalIncome,
      expenses: totalExpenses,
      savingsRate: ((netSavings / totalIncome) * 100).toFixed(1) + '%'
    },
    transactions
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FinTrack Backend active on http://localhost:${PORT}`);
});
