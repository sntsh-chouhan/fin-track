import fs from 'fs';
import path from 'path';

// Define the root storage path relative to workspace, isolating test runs
const DATA_DIR = process.env.NODE_ENV === 'test'
  ? path.resolve(process.cwd(), 'data', 'test')
  : path.resolve(process.cwd(), 'data');

// Interfaces
export interface Transaction {
  id: string;
  title: string;
  amount: number; // positive for income, negative for expense
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO date string
}

export interface Budget {
  category: string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date string
}

export interface Settings {
  userName: string;
  currency: string;
  themeAccent: string; // Electric Violet, Electric Emerald, etc.
}

// Ensure the data directory exists safely
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Generic locked, type-safe, and atomic JSON Database manager.
 * Implements atomic file swaps to prevent corruption during writes.
 */
class JSONDatabase<T> {
  private filePath: string;
  private defaultValue: T;

  constructor(fileName: string, defaultValue: T) {
    // Sanitize input filename using path.basename to prevent directory traversal attacks
    const sanitizedFileName = path.basename(fileName);
    this.filePath = path.join(DATA_DIR, sanitizedFileName);
    this.defaultValue = defaultValue;
    this.initialize();
  }

  /**
   * Initializes the file with default values if it does not exist.
   */
  private initialize(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.save(this.defaultValue);
      }
    } catch (error) {
      console.error(`[DB Error] Failed to initialize file: ${this.filePath}`, error);
    }
  }

  /**
   * Reads data from file synchronously.
   */
  public read(): T {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.defaultValue;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`[DB Error] Failed to read file: ${this.filePath}. Falling back to default.`, error);
      return this.defaultValue;
    }
  }

  /**
   * Writes data atomically using a temporary file and atomic swap.
   */
  public save(data: T): void {
    const tempPath = `${this.filePath}.tmp`;
    try {
      const raw = JSON.stringify(data, null, 2);
      // Write to temporary file
      fs.writeFileSync(tempPath, raw, 'utf-8');
      // Atomic rename swap
      fs.renameSync(tempPath, this.filePath);
    } catch (error) {
      console.error(`[DB Error] Failed to save file atomically: ${this.filePath}`, error);
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
      throw new Error(`Database save failure: ${this.filePath}`);
    }
  }

  /**
   * Purges database file and resets to default values.
   */
  public reset(): void {
    this.save(this.defaultValue);
  }
}

// --- Seed Default Data Templates ---
const DEFAULT_TRANSACTIONS: Transaction[] = [
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

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Groceries', limit: 400.00 },
  { category: 'Health & Fitness', limit: 200.00 },
  { category: 'Entertainment', limit: 100.00 },
  { category: 'Electronics', limit: 1500.00 }
];

const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: 'g1',
    title: 'Emergency Fund',
    targetAmount: 10000.00,
    currentAmount: 6500.00,
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(), // 180 days from now
  },
  {
    id: 'g2',
    title: 'Europe Summer Trip',
    targetAmount: 5000.00,
    currentAmount: 1200.00,
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(), // 90 days from now
  }
];

const DEFAULT_SETTINGS: Settings = {
  userName: 'Santosh',
  currency: '$',
  themeAccent: 'Electric Violet'
};

// Database Instantiations
export const db = {
  transactions: new JSONDatabase<Transaction[]>('transactions.json', DEFAULT_TRANSACTIONS),
  budgets: new JSONDatabase<Budget[]>('budgets.json', DEFAULT_BUDGETS),
  goals: new JSONDatabase<SavingsGoal[]>('goals.json', DEFAULT_GOALS),
  settings: new JSONDatabase<Settings>('settings.json', DEFAULT_SETTINGS),
  
  // Master Reset
  resetAll: () => {
    db.transactions.reset();
    db.budgets.reset();
    db.goals.reset();
    db.settings.reset();
  }
};
