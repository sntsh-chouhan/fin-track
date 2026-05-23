import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Wallet, 
  Settings as SettingsIcon, 
  Plus, 
  Activity, 
  PiggyBank, 
  CreditCard,
  RefreshCw,
  X,
  ChevronRight,
  Search,
  Download,
  Trash2,
  Edit2,
  User,
  Palette
} from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface Budget {
  category: string;
  limit: number;
  spent: number;
}

interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

interface AppSettings {
  userName: string;
  currency: string;
  themeAccent: string;
}

interface Metrics {
  balance: number;
  income: number;
  expenses: number;
  savingsRate: string;
}

const ACCENT_COLORS = [
  { name: 'Electric Violet', hsl: '263, 85%, 68%', glow: 'rgba(139, 92, 246, 0.4)' },
  { name: 'Neon Cyan', hsl: '190, 95%, 48%', glow: 'rgba(6, 182, 212, 0.4)' },
  { name: 'Neon Emerald', hsl: '142, 72%, 48%', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Coral Rose', hsl: '350, 84%, 58%', glow: 'rgba(244, 63, 94, 0.4)' }
];

// Enhanced CSS styles including support for sub-views, tables, forms, and custom color switches
const styles = `
  .dashboard-wrapper {
    display: grid;
    grid-template-columns: 260px 1fr;
    min-height: 100vh;
    width: 100%;
    background-color: var(--bg-primary);
  }

  /* Sidebar styling */
  .sidebar {
    background-color: var(--bg-sidebar);
    border-right: 1px solid var(--border-glass);
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 3rem;
  }

  .logo-icon {
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 0 15px 0 var(--color-primary-glow);
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(to right, #fff, var(--color-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-menu {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1rem;
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: 12px;
    font-weight: 500;
    transition: var(--transition-fast);
    border: 1px solid transparent;
    cursor: pointer;
  }

  .nav-item:hover, .nav-item.active {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.05);
  }

  .nav-item.active {
    background: var(--color-primary-glow);
    border-color: rgba(139, 92, 246, 0.25);
    color: #fff;
    box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.05);
  }

  .nav-item.active svg {
    color: var(--color-primary);
    filter: drop-shadow(0 0 5px var(--color-primary-glow));
  }

  /* Status Indicator at Sidebar bottom */
  .api-status-badge {
    padding: 0.85rem 1rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .api-status-badge.connected {
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.15);
    color: var(--color-income);
  }

  .api-status-badge.disconnected {
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.15);
    color: var(--color-expense);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: relative;
  }

  .status-dot::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    animation: statusPulse 2s infinite;
  }

  .connected .status-dot { background-color: var(--color-income); }
  .connected .status-dot::after { background-color: var(--color-income); }
  .disconnected .status-dot { background-color: var(--color-expense); }
  .disconnected .status-dot::after { background-color: var(--color-expense); }

  @keyframes statusPulse {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  /* Main panel styling */
  .main-content {
    padding: 2.5rem;
    overflow-y: auto;
    height: 100vh;
  }

  /* Top Bar */
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
  }

  .user-greeting h1 {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(to right, #fff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .user-greeting p {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-top: 0.25rem;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .btn-premium {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary));
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: var(--transition-fast);
    box-shadow: 0 4px 15px -3px var(--color-primary-glow);
  }

  .btn-premium:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -3px var(--color-primary-glow);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-glass);
    color: var(--text-primary);
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: var(--transition-fast);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .btn-danger {
    background: rgba(244, 63, 94, 0.1);
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: var(--color-expense);
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-fast);
  }
  .btn-danger:hover {
    background: rgba(244, 63, 94, 0.2);
    border-color: var(--color-expense);
  }

  /* Grid layouts */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  .stat-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 140px;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(255,255,255,0.01) 0%, transparent 70%);
    border-radius: 50%;
  }

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-title {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  .stat-icon-wrapper {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-top: 1rem;
    margin-bottom: 0.25rem;
  }

  .stat-trend {
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 500;
  }

  /* Stat details */
  .balance-card { border-left: 3px solid var(--color-primary); }
  .balance-card .stat-icon-wrapper { background: var(--color-primary-glow); color: var(--color-primary); }
  
  .income-card { border-left: 3px solid var(--color-income); }
  .income-card .stat-icon-wrapper { background: var(--color-income-glow); color: var(--color-income); }
  .income-card .stat-trend { color: var(--color-income); }
  
  .expense-card { border-left: 3px solid var(--color-expense); }
  .expense-card .stat-icon-wrapper { background: var(--color-expense-glow); color: var(--color-expense); }
  .expense-card .stat-trend { color: var(--color-expense); }
  
  .savings-card { border-left: 3px solid var(--color-accent); }
  .savings-card .stat-icon-wrapper { background: var(--color-accent-glow); color: var(--color-accent); }
  .savings-card .stat-trend { color: var(--color-accent); }

  /* Dashboard Details Grid */
  .details-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 1.5rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .panel-title {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  /* Custom SVG Chart Area */
  .chart-panel {
    padding: 1.5rem;
    min-height: 380px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .chart-container {
    flex-grow: 1;
    position: relative;
    min-height: 250px;
    margin-top: 1rem;
  }

  .chart-svg {
    width: 100%;
    height: 100%;
    min-height: 240px;
  }

  /* Transactions Panel */
  .transactions-panel {
    padding: 1.5rem;
    min-height: 380px;
  }

  .transaction-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    border: 1px solid var(--border-glass);
    background: rgba(255, 255, 255, 0.01);
    transition: var(--transition-fast);
  }

  .transaction-item:hover {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    transform: translateX(4px);
  }

  .tx-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-grow: 1;
  }

  .tx-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tx-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .tx-title {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .tx-cat-date {
    font-size: 0.75rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tx-amount {
    font-weight: 600;
    font-size: 1rem;
    margin-right: 1rem;
  }

  .tx-amount.income { color: var(--color-income); }
  .tx-amount.expense { color: var(--color-expense); }

  /* Filters Toolbar */
  .toolbar-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding: 1rem;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-glass);
    border-radius: 10px;
    padding: 0.5rem 0.85rem;
    width: 250px;
  }

  .search-box input {
    background: none;
    border: none;
    color: var(--text-primary);
    outline: none;
    width: 100%;
    font-size: 0.9rem;
  }

  .filter-group {
    display: flex;
    gap: 0.75rem;
  }

  .filter-select {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid var(--border-glass);
    color: var(--text-secondary);
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    outline: none;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .filter-select:focus {
    border-color: var(--color-primary);
  }

  /* Table Design */
  .table-scroll {
    overflow-x: auto;
    width: 100%;
  }

  .premium-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .premium-table th {
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 1rem;
    border-bottom: 1px solid var(--border-glass);
  }

  .premium-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border-glass);
    font-size: 0.95rem;
    vertical-align: middle;
  }

  .premium-table tbody tr {
    transition: var(--transition-fast);
  }

  .premium-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .row-action-group {
    display: flex;
    gap: 0.5rem;
  }

  .action-icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.35rem;
    border-radius: 8px;
    transition: var(--transition-fast);
  }

  .action-icon-btn:hover.edit {
    color: var(--color-primary);
    background: var(--color-primary-glow);
  }

  .action-icon-btn:hover.delete {
    color: var(--color-expense);
    background: var(--color-expense-glow);
  }

  /* Budgets Panel */
  .budget-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .budget-card {
    padding: 1.5rem;
    position: relative;
  }

  .budget-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .budget-progress-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 1rem;
  }

  .budget-progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-out;
  }

  .alert-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .alert-warning {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .alert-danger {
    background: var(--color-expense-glow);
    color: var(--color-expense);
    border: 1px solid rgba(244, 63, 94, 0.3);
    animation: flash 1.5s infinite;
  }

  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.65; }
  }

  /* Goals Layout */
  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .goal-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 200px;
  }

  .goal-progress-bar {
    width: 100%;
    height: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
    overflow: hidden;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .goal-progress-fill {
    height: 100%;
    border-radius: 5px;
    background: linear-gradient(to right, var(--color-accent), var(--color-primary));
  }

  .goal-meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }

  .goal-contribution-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-glass);
  }

  .goal-contribution-form input {
    flex-grow: 1;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-glass);
    color: white;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    font-size: 0.85rem;
    outline: none;
  }
  .goal-contribution-form input:focus {
    border-color: var(--color-primary);
  }

  .goal-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  /* Settings view */
  .settings-layout {
    max-width: 650px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .settings-section {
    padding: 2rem;
  }

  .settings-section h3 {
    font-size: 1.15rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border-glass);
    padding-bottom: 0.5rem;
  }

  .color-swatch-container {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .color-swatch {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: var(--transition-fast);
    position: relative;
  }

  .color-swatch.active {
    border-color: white;
    transform: scale(1.08);
    box-shadow: 0 0 15px currentColor;
  }

  /* Modal Overlay Styling */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(8, 12, 24, 0.8);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  }

  .modal-content {
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    border: 1px solid var(--border-glass-active);
    box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25);
    position: relative;
    animation: slideUp 0.4s var(--transition-smooth);
  }

  .close-btn {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .close-btn:hover {
    color: var(--text-primary);
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    background: linear-gradient(to right, #fff, var(--color-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .form-group {
    margin-bottom: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .form-input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-glass);
    color: var(--text-primary);
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: var(--transition-fast);
    outline: none;
  }

  .form-input:focus {
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 10px 0 var(--color-primary-glow);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  /* Responsive styling */
  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .details-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    .dashboard-wrapper { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .stats-grid { grid-template-columns: 1fr; }
    .main-content { padding: 1.5rem; }
  }
`;

// Predefined categories lists
const CATEGORIES = [
  'Salary',
  'Groceries',
  'Health & Fitness',
  'Investments',
  'Entertainment',
  'Electronics',
  'Transportation',
  'Other'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Modals States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Editing state pointers
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form inputs States
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('Groceries');
  const [txDate, setTxDate] = useState('');

  const [budgetCategory, setBudgetCategory] = useState('Groceries');
  const [budgetLimit, setBudgetLimit] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  const [settingsUserName, setSettingsUserName] = useState('');
  const [settingsCurrency, setSettingsCurrency] = useState('$');
  const [settingsThemeAccent, setSettingsThemeAccent] = useState('Electric Violet');

  // Inline goal contribution values
  const [goalContribution, setGoalContribution] = useState<{ [goalId: string]: string }>({});

  // Filters state (for Transactions tab)
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSort, setFilterSort] = useState('newest');

  // Global Backend bound variables state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    userName: 'Santosh',
    currency: '$',
    themeAccent: 'Electric Violet'
  });
  const [metrics, setMetrics] = useState<Metrics>({
    balance: 0,
    income: 0,
    expenses: 0,
    savingsRate: '0%'
  });

  const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Global Loader fetching data from Node API
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Ping api status
      const statusRes = await fetch('http://localhost:5000/api/status');
      if (!statusRes.ok) throw new Error('API server down');

      // 2. Fetch settings
      const settingsRes = await fetch('http://localhost:5000/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      setSettingsUserName(settingsData.userName);
      setSettingsCurrency(settingsData.currency);
      setSettingsThemeAccent(settingsData.themeAccent);
      applyThemeVariables(settingsData.themeAccent);

      // 3. Fetch metrics
      const metricsRes = await fetch('http://localhost:5000/api/transactions/metrics');
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      // 4. Fetch transactions (all)
      const txRes = await fetch('http://localhost:5000/api/transactions');
      const txData = await txRes.json();
      setTransactions(txData);

      // 5. Fetch budgets
      const budgetRes = await fetch('http://localhost:5000/api/budgets');
      const budgetData = await budgetRes.json();
      setBudgets(budgetData);

      // 6. Fetch goals
      const goalRes = await fetch('http://localhost:5000/api/goals');
      const goalData = await goalRes.json();
      setGoals(goalData);

      setIsApiConnected(true);
    } catch (error) {
      console.error('Connection failure. API server offline.', error);
      setIsApiConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Dynamically apply accent color overrides based on theme
  const applyThemeVariables = (themeName: string) => {
    const selected = ACCENT_COLORS.find(c => c.name === themeName) || ACCENT_COLORS[0];
    const root = document.documentElement;
    root.style.setProperty('--color-primary', `hsl(${selected.hsl})`);
    root.style.setProperty('--color-primary-glow', selected.glow);
  };

  // --- CONTROLLER MUTATION HANDLERS (API BINDINGS) ---

  const handleTransactionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount || !txCategory) return;

    const bodyData = {
      title: txTitle,
      amount: parseFloat(txAmount),
      type: txType,
      category: txCategory,
      date: txDate || new Date().toISOString()
    };

    try {
      let res;
      if (editingTx) {
        // Edit flow
        res = await fetch(`http://localhost:5000/api/transactions/${editingTx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      } else {
        // Create flow
        res = await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      }

      if (res.ok) {
        // Reset form
        setTxTitle('');
        setTxAmount('');
        setTxType('expense');
        setTxCategory('Groceries');
        setTxDate('');
        setEditingTx(null);
        setIsTxModalOpen(false);
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to save transaction entry', e);
    }
  };

  const handleTransactionDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to delete transaction', e);
    }
  };

  const handleBudgetSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimit) return;

    try {
      const res = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: budgetCategory,
          limit: parseFloat(budgetLimit)
        })
      });

      if (res.ok) {
        setBudgetLimit('');
        setIsBudgetModalOpen(false);
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to configure category budget limit', e);
    }
  };

  const handleBudgetDelete = async (category: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/budgets/${encodeURIComponent(category)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to delete budget', e);
    }
  };

  const handleGoalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTargetAmount || !goalTargetDate) return;

    try {
      const res = await fetch('http://localhost:5000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalTitle,
          targetAmount: parseFloat(goalTargetAmount),
          currentAmount: parseFloat(goalCurrentAmount) || 0,
          targetDate: goalTargetDate
        })
      });

      if (res.ok) {
        setGoalTitle('');
        setGoalTargetAmount('');
        setGoalCurrentAmount('');
        setGoalTargetDate('');
        setIsGoalModalOpen(false);
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to create savings goal', e);
    }
  };

  const handleGoalDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to delete savings goal', e);
    }
  };

  const handleGoalContribution = async (id: string, amountStr: string) => {
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const res = await fetch(`http://localhost:5000/api/goals/${id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (res.ok) {
        setGoalContribution({ ...goalContribution, [id]: '' });
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to contribute to goal', e);
    }
  };

  const handleSettingsUpdate = async (userName: string, currency: string, themeAccent: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, currency, themeAccent })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        applyThemeVariables(data.themeAccent);
      }
    } catch (e) {
      console.error('Failed to update config settings', e);
    }
  };

  const handleResetDatabase = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings/reset', {
        method: 'POST'
      });
      if (res.ok) {
        setIsResetConfirmOpen(false);
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to trigger database purge', e);
    }
  };

  // Trigger editing values setup
  const triggerEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setTxTitle(tx.title);
    setTxAmount(Math.abs(tx.amount).toString());
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxDate(tx.date.substring(0, 16)); // Format for datetime-local input
    setIsTxModalOpen(true);
  };

  // CSV Data Downloader Exporter
  const exportTransactionsToCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Date', 'Type', 'Amount'];
    const csvRows = [headers.join(',')];

    filteredTransactions.forEach(tx => {
      const row = [
        tx.id,
        `"${tx.title.replace(/"/g, '""')}"`,
        tx.category,
        tx.date,
        tx.type,
        tx.amount
      ];
      csvRows.push(row.join(','));
    });

    const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `fintrack_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lucide helper maps for transactions/budgets categories
  const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      return { bg: 'var(--color-income-glow)', fg: 'var(--color-income)', icon: <TrendingUp size={18} /> };
    }
    switch (category.toLowerCase()) {
      case 'groceries':
        return { bg: 'rgba(6, 182, 212, 0.1)', fg: 'var(--color-accent)', icon: <Wallet size={18} /> };
      case 'health & fitness':
        return { bg: 'var(--color-primary-glow)', fg: 'var(--color-primary)', icon: <Activity size={18} /> };
      case 'investments':
        return { bg: 'var(--color-income-glow)', fg: 'var(--color-income)', icon: <PiggyBank size={18} /> };
      default:
        return { bg: 'var(--color-expense-glow)', fg: 'var(--color-expense)', icon: <CreditCard size={18} /> };
    }
  };

  // Client-side transactions filters matcher
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(filterSearch.toLowerCase()) || 
                          tx.category.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  }).sort((a, b) => {
    if (filterSort === 'oldest') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Calculate dynamic line chart SVG coordinate indexes
  // Plotting a rolling net assets index over the last 6 transactions
  const plotLineChartPath = () => {
    if (transactions.length === 0) return "M 0 120 L 600 120";
    
    // Grab transactions chronologically
    const sortedChron = [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-6); // Plot last 6 data points

    let runningVal = metrics.balance - sortedChron.reduce((sum, tx) => sum + tx.amount, 0);
    const coordinates: { x: number; y: number }[] = [];
    
    sortedChron.forEach((tx, idx) => {
      runningVal += tx.amount;
      const x = (idx / 5) * 600;
      // Scale dynamic values between 30 (high/top) and 210 (low/bottom)
      // Map based on range bounds
      const minVal = metrics.balance - 5000;
      const maxVal = metrics.balance + 5000;
      const pct = (runningVal - minVal) / (maxVal - minVal || 1);
      const y = 210 - (pct * 180);
      coordinates.push({ x, y: Math.max(30, Math.min(210, y)) });
    });

    // Make smooth bezier curves path
    let d = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    return {
      linePath: d,
      areaPath: `${d} L 600 240 L 0 240 Z`,
      dots: coordinates
    };
  };

  const chartPaths = plotLineChartPath();

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard-wrapper">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="sidebar">
          <div>
            <div className="logo-area">
              <div className="logo-icon">
                <Wallet size={22} />
              </div>
              <span className="logo-text">FinTrack</span>
            </div>

            <nav className="nav-menu">
              {[
                { name: 'Overview', icon: <LayoutDashboard size={20} /> },
                { name: 'Transactions', icon: <CreditCard size={20} /> },
                { name: 'Budgets', icon: <Activity size={20} /> },
                { name: 'Savings Goals', icon: <PiggyBank size={20} /> },
                { name: 'Settings', icon: <SettingsIcon size={20} /> }
              ].map((item) => (
                <a 
                  key={item.name} 
                  className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.name)}
                >
                  {item.icon}
                  {item.name}
                </a>
              ))}
            </nav>
          </div>

          {/* SERVER CONNECTIVITY BADGE */}
          <div className="sidebar-footer">
            <div 
              className={`api-status-badge ${isApiConnected ? 'connected' : 'disconnected'}`}
              title={isApiConnected ? "Connected directly to Node backend server" : "Node backend offline. Running in offline sandbox fallback mode."}
            >
              <div className="status-dot"></div>
              <span style={{ flexGrow: 1 }}>
                {isApiConnected === null ? 'Pinging API...' : isApiConnected ? 'API Connected' : 'Offline Sandbox'}
              </span>
              <button 
                onClick={fetchAllData} 
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Pings API Server Status again"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT VIEWPORT */}
        <main className="main-content animate-slide-up">
          
          {/* HEADER TOP BAR */}
          <header className="top-bar">
            <div className="user-greeting">
              <h1>{activeTab}</h1>
              <p>Welcome back, {settings.userName}! Manage your premium assets securely.</p>
            </div>

            <div className="action-buttons">
              {!isApiConnected && isApiConnected !== null && (
                <div style={{
                  background: 'var(--color-expense-glow)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  color: 'var(--color-expense)',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  Offline Mode Active
                </div>
              )}
              <button className="btn-secondary" onClick={fetchAllData} title="Fetch data records again">
                <RefreshCw size={15} />
                Refresh
              </button>
              
              {/* Context-aware key action buttons */}
              {activeTab === 'Transactions' && (
                <button className="btn-premium" onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }}>
                  <Plus size={18} />
                  Add Entry
                </button>
              )}
              {activeTab === 'Budgets' && (
                <button className="btn-premium" onClick={() => setIsBudgetModalOpen(true)}>
                  <Plus size={18} />
                  New Budget
                </button>
              )}
              {activeTab === 'Savings Goals' && (
                <button className="btn-premium" onClick={() => setIsGoalModalOpen(true)}>
                  <Plus size={18} />
                  Create Goal
                </button>
              )}
              {activeTab === 'Overview' && (
                <button className="btn-premium" onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }}>
                  <Plus size={18} />
                  Add Entry
                </button>
              )}
            </div>
          </header>

          {/* CONDITIONAL TAB RENDERINGS */}

          {/* 1. OVERVIEW VIEW */}
          {activeTab === 'Overview' && (
            <section className="animate-fade-in">
              {/* KEY STATS METRICS ROW */}
              <div className="stats-grid">
                <div className="glass-panel stat-card balance-card">
                  <div className="stat-header">
                    <span className="stat-title">NET ASSETS</span>
                    <div className="stat-icon-wrapper">
                      <Wallet size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-value">
                      {settings.currency}{metrics.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="stat-trend" style={{ color: 'var(--text-secondary)' }}>
                      Total capital holdings
                    </div>
                  </div>
                </div>

                <div className="glass-panel stat-card income-card">
                  <div className="stat-header">
                    <span className="stat-title">REVENUE (MONTH)</span>
                    <div className="stat-icon-wrapper">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-value">
                      {settings.currency}{metrics.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="stat-trend">
                      <ArrowUpRight size={14} />
                      Total income credits
                    </div>
                  </div>
                </div>

                <div className="glass-panel stat-card expense-card">
                  <div className="stat-header">
                    <span className="stat-title">OUTGOINGS (MONTH)</span>
                    <div className="stat-icon-wrapper">
                      <ArrowDownRight size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-value">
                      {settings.currency}{metrics.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="stat-trend">
                      <ArrowDownRight size={14} />
                      Total outlays debits
                    </div>
                  </div>
                </div>

                <div className="glass-panel stat-card savings-card">
                  <div className="stat-header">
                    <span className="stat-title">SAVINGS RATIO</span>
                    <div className="stat-icon-wrapper">
                      <PiggyBank size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-value">
                      {metrics.savingsRate}
                    </div>
                    <div className="stat-trend">
                      <TrendingUp size={14} />
                      Capital accretion percentage
                    </div>
                  </div>
                </div>
              </div>

              {/* LOWER SPLIT GRID: TREND CHART + RECENT LIST */}
              <div className="details-grid">
                
                {/* SVG TREND CHART */}
                <div className="glass-panel chart-panel">
                  <div className="panel-header" style={{ marginBottom: 0 }}>
                    <div>
                      <h2 className="panel-title">Asset Trend Accumulation</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Accretion of total assets based on chronological ledger index
                      </p>
                    </div>
                  </div>

                  <div className="chart-container">
                    <svg className="chart-svg" viewBox="0 0 600 240" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="160" x2="600" y2="160" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Area under curve */}
                      {typeof chartPaths !== 'string' && (
                        <path d={chartPaths.areaPath} fill="url(#chartGlow)" />
                      )}
                      
                      {/* SVG Bezier Line */}
                      <path 
                        d={typeof chartPaths === 'string' ? chartPaths : chartPaths.linePath} 
                        fill="none" 
                        stroke="var(--color-primary)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        filter="drop-shadow(0px 4px 10px var(--color-primary-glow))"
                      />
                      
                      {/* Glowing Data Dots */}
                      {typeof chartPaths !== 'string' && chartPaths.dots.map((dot, idx) => (
                        <circle 
                          key={idx} 
                          cx={dot.x} 
                          cy={dot.y} 
                          r="5" 
                          fill={idx === chartPaths.dots.length - 1 ? 'var(--color-accent)' : 'var(--color-primary)'} 
                          stroke="#fff" 
                          strokeWidth="2" 
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* RECENT TRANSACTIONS LEDGER */}
                <div className="glass-panel transactions-panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Recent Transactions</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Ledger updates
                      </p>
                    </div>
                    <ChevronRight 
                      size={18} 
                      style={{ color: 'var(--text-muted)', cursor: 'pointer' }} 
                      onClick={() => setActiveTab('Transactions')} 
                    />
                  </div>

                  <div className="transaction-list">
                    {transactions.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                        No records found. Click Add Entry to populate.
                      </p>
                    ) : (
                      transactions.slice(0, 4).map((tx) => {
                        const styleMap = getCategoryIcon(tx.category, tx.type);
                        return (
                          <div key={tx.id} className="transaction-item">
                            <div className="tx-left">
                              <div 
                                className="tx-icon-wrapper" 
                                style={{ backgroundColor: styleMap.bg, color: styleMap.fg }}
                              >
                                {styleMap.icon}
                              </div>
                              <div className="tx-info">
                                <span className="tx-title">{tx.title}</span>
                                <div className="tx-cat-date">
                                  <span>{tx.category}</span>
                                  <span style={{ fontSize: '0.65rem' }}>•</span>
                                  <span>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>
                            </div>
                            
                            <span className={`tx-amount ${tx.type}`}>
                              {tx.type === 'income' ? '+' : '-'}{settings.currency}{Math.abs(tx.amount).toFixed(2)}
                            </span>

                            <div className="row-action-group">
                              <button 
                                className="action-icon-btn edit" 
                                onClick={() => triggerEditTransaction(tx)}
                                title="Edit Record"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                className="action-icon-btn delete" 
                                onClick={() => handleTransactionDelete(tx.id)}
                                title="Delete Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* 2. TRANSACTIONS VIEW */}
          {activeTab === 'Transactions' && (
            <section className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
              
              {/* FILTERS & SEARCH TOOLBAR */}
              <div className="toolbar-container">
                <div className="search-box">
                  <Search size={18} style={{ color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search entries or categories..." 
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <select 
                    className="filter-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Type: All</option>
                    <option value="income">Type: Income</option>
                    <option value="expense">Type: Expense</option>
                  </select>

                  <select 
                    className="filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">Category: All</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select 
                    className="filter-select"
                    value={filterSort}
                    onChange={(e) => setFilterSort(e.target.value)}
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                  </select>

                  <button 
                    className="btn-secondary" 
                    onClick={exportTransactionsToCSV}
                    title="Download ledger data in CSV format"
                  >
                    <Download size={15} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* TRANSACTIONS LEDGER TABLE */}
              <div className="table-scroll">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No matching records found in database.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ fontWeight: 500 }}>{tx.title}</td>
                          <td>
                            <span style={{ 
                              background: getCategoryIcon(tx.category, tx.type).bg,
                              color: getCategoryIcon(tx.category, tx.type).fg,
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
                              {tx.category}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(tx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{tx.type}</td>
                          <td className={`tx-amount ${tx.type}`} style={{ fontWeight: 600 }}>
                            {tx.type === 'income' ? '+' : '-'}{settings.currency}{Math.abs(tx.amount).toFixed(2)}
                          </td>
                          <td>
                            <div className="row-action-group">
                              <button 
                                className="action-icon-btn edit" 
                                onClick={() => triggerEditTransaction(tx)}
                                title="Edit entry"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                className="action-icon-btn delete" 
                                onClick={() => handleTransactionDelete(tx.id)}
                                title="Delete entry"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </section>
          )}

          {/* 3. BUDGETS VIEW */}
          {activeTab === 'Budgets' && (
            <section className="animate-fade-in">
              <div className="budget-grid">
                {budgets.length === 0 ? (
                  <div className="glass-panel" style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No category budgets configured yet.</p>
                  </div>
                ) : (
                  budgets.map(budget => {
                    const ratio = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
                    const isExceeded = budget.spent > budget.limit;
                    
                    // Progressive progress bar color changes
                    let barColor = 'linear-gradient(to right, var(--color-accent), var(--color-primary))';
                    if (ratio > 90) {
                      barColor = 'var(--color-expense)'; // Coral Red
                    } else if (ratio > 60) {
                      barColor = '#f59e0b'; // Amber yellow-orange
                    }

                    return (
                      <div key={budget.category} className="glass-panel budget-card">
                        
                        {/* Budget status overlay banner */}
                        {isExceeded ? (
                          <span className="alert-badge alert-danger">EXCEEDED</span>
                        ) : ratio > 80 ? (
                          <span className="alert-badge alert-warning">WARNING</span>
                        ) : null}

                        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--color-primary)' }}>
                            {getCategoryIcon(budget.category, 'expense').icon}
                          </span>
                          {budget.category}
                        </h3>

                        <div className="budget-progress-container">
                          <div 
                            className="budget-progress-fill" 
                            style={{ width: `${ratio}%`, background: barColor }}
                          ></div>
                        </div>

                        <div className="budget-meta">
                          <div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                              {settings.currency}{budget.spent.toLocaleString()}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {' '}of {settings.currency}{budget.limit.toLocaleString()}
                            </span>
                          </div>
                          
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isExceeded ? 'var(--color-expense)' : 'var(--text-secondary)' }}>
                            {ratio}%
                          </span>
                        </div>

                        {/* Extra logic: Detail feedback */}
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {isExceeded 
                              ? `Over budget by ${settings.currency}${(budget.spent - budget.limit).toFixed(2)}!`
                              : `${settings.currency}${(budget.limit - budget.spent).toFixed(2)} remaining`
                            }
                          </span>
                          <button 
                            className="action-icon-btn delete"
                            onClick={() => handleBudgetDelete(budget.category)}
                            title="Remove Category Budget"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* 4. SAVINGS GOALS VIEW */}
          {activeTab === 'Savings Goals' && (
            <section className="animate-fade-in">
              <div className="goals-grid">
                {goals.length === 0 ? (
                  <div className="glass-panel" style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No savings goals created. Click Create Goal to start saving.</p>
                  </div>
                ) : (
                  goals.map(goal => {
                    const progressRatio = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                    const isCompleted = goal.currentAmount >= goal.targetAmount;
                    const contributionVal = goalContribution[goal.id] || '';

                    return (
                      <div key={goal.id} className="glass-panel goal-card">
                        
                        <div className="goal-card-header">
                          <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{goal.title}</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Target Date: {new Date(goal.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <button 
                            className="action-icon-btn delete"
                            onClick={() => handleGoalDelete(goal.id)}
                            title="Delete goal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <div className="goal-progress-bar">
                            <div className="goal-progress-fill" style={{ width: `${progressRatio}%` }}></div>
                          </div>

                          <div className="goal-meta-row">
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {settings.currency}{goal.currentAmount.toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              goal: {settings.currency}{goal.targetAmount.toLocaleString()}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                              {progressRatio}%
                            </span>
                          </div>
                        </div>

                        {/* Contribution trigger form inside goal widget */}
                        {!isCompleted ? (
                          <div className="goal-contribution-form">
                            <input 
                              type="number" 
                              placeholder={`Contribute (${settings.currency})`}
                              step="0.01"
                              value={contributionVal}
                              onChange={(e) => setGoalContribution({ ...goalContribution, [goal.id]: e.target.value })}
                            />
                            <button 
                              className="btn-premium"
                              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem' }}
                              onClick={() => handleGoalContribution(goal.id, contributionVal)}
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          <div style={{ 
                            marginTop: '1.25rem', 
                            padding: '0.5rem', 
                            textAlign: 'center', 
                            background: 'var(--color-income-glow)', 
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '8px',
                            color: 'var(--color-income)',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            🎉 GOAL COMPLETED!
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* 5. SETTINGS VIEW */}
          {activeTab === 'Settings' && (
            <section className="animate-fade-in settings-layout">
              
              {/* Profile Config */}
              <div className="glass-panel settings-section">
                <h3>
                  <User size={18} style={{ color: 'var(--color-primary)' }} />
                  Profile Configuration
                </h3>
                
                <div className="form-group">
                  <label htmlFor="settings-username">Nickname / Alias</label>
                  <input 
                    type="text" 
                    id="settings-username"
                    className="form-input"
                    value={settingsUserName}
                    onChange={(e) => setSettingsUserName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="settings-currency">System Currency Symbol</label>
                  <select 
                    id="settings-currency"
                    className="form-input"
                    value={settingsCurrency}
                    onChange={(e) => setSettingsCurrency(e.target.value)}
                  >
                    <option value="$">US Dollar ($)</option>
                    <option value="€">Euro (€)</option>
                    <option value="£">British Pound (£)</option>
                    <option value="₹">Indian Rupee (₹)</option>
                    <option value="¥">Japanese Yen (¥)</option>
                  </select>
                </div>

                <button 
                  className="btn-premium" 
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => handleSettingsUpdate(settingsUserName, settingsCurrency, settingsThemeAccent)}
                >
                  Save Profile Settings
                </button>
              </div>

              {/* Palette Accent Customizer */}
              <div className="glass-panel settings-section">
                <h3>
                  <Palette size={18} style={{ color: 'var(--color-primary)' }} />
                  Accent Color Theme
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Choose your glowing brand variable representation.
                </p>

                <div className="color-swatch-container">
                  {ACCENT_COLORS.map(color => (
                    <div 
                      key={color.name}
                      className={`color-swatch ${settingsThemeAccent === color.name ? 'active' : ''}`}
                      style={{ backgroundColor: `hsl(${color.hsl})`, color: `hsl(${color.hsl})` }}
                      onClick={() => {
                        setSettingsThemeAccent(color.name);
                        handleSettingsUpdate(settingsUserName, settingsCurrency, color.name);
                      }}
                      title={color.name}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Dangerous operations reset database */}
              <div className="glass-panel settings-section" style={{ borderLeft: '3px solid var(--color-expense)' }}>
                <h3 style={{ color: 'var(--color-expense)' }}>
                  ⚠️ Dangerous Actions
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Wipes out all ledger entries, budgets, and savings goals, restoring default starting templates. This action is irreversible.
                </p>
                
                <button className="btn-danger" onClick={() => setIsResetConfirmOpen(true)}>
                  Reset Database Records
                </button>
              </div>

            </section>
          )}

        </main>

        {/* --- DIALOG MODALS --- */}

        {/* 1. TRANSACTION ADD / EDIT MODAL */}
        {isTxModalOpen && (
          <div className="modal-overlay" onClick={() => setIsTxModalOpen(false)}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setIsTxModalOpen(false)}>
                <X size={20} />
              </button>
              
              <h2 className="modal-title">{editingTx ? 'Edit Ledger Entry' : 'New Entry Registry'}</h2>
              
              <form onSubmit={handleTransactionSave}>
                <div className="form-group">
                  <label htmlFor="tx-title">Merchant / Source Title</label>
                  <input 
                    type="text" 
                    id="tx-title" 
                    className="form-input" 
                    placeholder="e.g., Whole Foods, Netflix, salary"
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tx-amount">Total Value ({settings.currency})</label>
                    <input 
                      type="number" 
                      id="tx-amount" 
                      className="form-input" 
                      placeholder="0.00" 
                      step="0.01"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="tx-type">Entry Type</label>
                    <select 
                      id="tx-type" 
                      className="form-input"
                      value={txType}
                      onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                    >
                      <option value="expense">Expense Outgoing</option>
                      <option value="income">Income Revenue</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="tx-category">Categorization</label>
                  <select 
                    id="tx-category" 
                    className="form-input"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="tx-date">Transaction Date</label>
                  <input 
                    type="datetime-local" 
                    id="tx-date" 
                    className="form-input" 
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-premium" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }}
                >
                  <Plus size={18} />
                  {editingTx ? 'Update Entry' : 'Register Entry'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. BUDGET CREATE / UPDATE MODAL */}
        {isBudgetModalOpen && (
          <div className="modal-overlay" onClick={() => setIsBudgetModalOpen(false)}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setIsBudgetModalOpen(false)}>
                <X size={20} />
              </button>
              
              <h2 className="modal-title">Limit Configuration</h2>
              
              <form onSubmit={handleBudgetSave}>
                <div className="form-group">
                  <label htmlFor="budget-category">Target Category</label>
                  <select 
                    id="budget-category" 
                    className="form-input"
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value)}
                  >
                    {CATEGORIES.filter(c => c !== 'Salary').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="budget-limit">Limit ({settings.currency})</label>
                  <input 
                    type="number" 
                    id="budget-limit" 
                    className="form-input" 
                    placeholder="0.00" 
                    step="0.01"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-premium" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }}
                >
                  Configure Budget Limit
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. GOAL CREATE MODAL */}
        {isGoalModalOpen && (
          <div className="modal-overlay" onClick={() => setIsGoalModalOpen(false)}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setIsGoalModalOpen(false)}>
                <X size={20} />
              </button>
              
              <h2 className="modal-title">New Savings Target</h2>
              
              <form onSubmit={handleGoalSave}>
                <div className="form-group">
                  <label htmlFor="goal-title">Savings Objective / Title</label>
                  <input 
                    type="text" 
                    id="goal-title" 
                    className="form-input" 
                    placeholder="e.g., Emergency Fund, New Laptop"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="goal-target">Target ({settings.currency})</label>
                    <input 
                      type="number" 
                      id="goal-target" 
                      className="form-input" 
                      placeholder="0.00" 
                      step="0.01"
                      value={goalTargetAmount}
                      onChange={(e) => setGoalTargetAmount(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="goal-current">Initial Savings ({settings.currency})</label>
                    <input 
                      type="number" 
                      id="goal-current" 
                      className="form-input" 
                      placeholder="0.00" 
                      step="0.01"
                      value={goalCurrentAmount}
                      onChange={(e) => setGoalCurrentAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="goal-date">Target Goal Date</label>
                  <input 
                    type="date" 
                    id="goal-date" 
                    className="form-input" 
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-premium" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }}
                >
                  Create Target Goal
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. MASTER RESET DATABASE CONFIRM MODAL */}
        {isResetConfirmOpen && (
          <div className="modal-overlay" onClick={() => setIsResetConfirmOpen(false)}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title" style={{ color: 'var(--color-expense)' }}>Confirm Database Wipeout</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Are you absolutely sure you want to reset all records back to default starting templates? This cannot be undone.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setIsResetConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleResetDatabase}>
                  Yes, Wipe Database
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
