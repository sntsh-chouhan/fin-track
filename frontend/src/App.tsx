import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Wallet, 
  Settings, 
  Plus, 
  Activity, 
  PiggyBank, 
  CreditCard,
  RefreshCw,
  X,
  ChevronRight
} from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface Metrics {
  balance: number;
  income: number;
  expenses: number;
  savingsRate: string;
}

interface BackendData {
  metrics: Metrics;
  transactions: Transaction[];
}

// Global Styles for Component
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
    box-shadow: 0 0 15px 0 rgba(139, 92, 246, 0.4);
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(to right, #fff, #a855f7);
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
  }

  .nav-item:hover, .nav-item.active {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.05);
  }

  .nav-item.active {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.25);
    color: #fff;
    box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.05);
  }

  .nav-item.active svg {
    color: var(--color-primary);
    filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.5));
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
    background: linear-gradient(135deg, var(--color-primary), hsl(263, 85%, 60%));
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
    box-shadow: 0 4px 15px -3px rgba(139, 92, 246, 0.4);
  }

  .btn-premium:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -3px rgba(139, 92, 246, 0.6);
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
  .balance-card .stat-icon-wrapper { background: rgba(139, 92, 246, 0.1); color: var(--color-primary); }
  
  .income-card { border-left: 3px solid var(--color-income); }
  .income-card .stat-icon-wrapper { background: rgba(16, 185, 129, 0.1); color: var(--color-income); }
  .income-card .stat-trend { color: var(--color-income); }
  
  .expense-card { border-left: 3px solid var(--color-expense); }
  .expense-card .stat-icon-wrapper { background: rgba(244, 63, 94, 0.1); color: var(--color-expense); }
  .expense-card .stat-trend { color: var(--color-expense); }
  
  .savings-card { border-left: 3px solid var(--color-accent); }
  .savings-card .stat-icon-wrapper { background: rgba(6, 182, 212, 0.1); color: var(--color-accent); }
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
  }

  .tx-amount.income { color: var(--color-income); }
  .tx-amount.expense { color: var(--color-expense); }

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
    background: linear-gradient(to right, #fff, #c084fc);
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
    box-shadow: 0 0 10px 0 rgba(139, 92, 246, 0.15);
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
    .sidebar { display: none; } /* hamburger toggler can be implemented later */
    .stats-grid { grid-template-columns: 1fr; }
    .main-content { padding: 1.5rem; }
  }
`;

// Default Fallback Mock Data for Standalone Mode
const DEFAULT_FALLBACK_DATA: BackendData = {
  metrics: {
    balance: 14850.50,
    income: 5120.00,
    expenses: 1593.49,
    savingsRate: '68.9%'
  },
  transactions: [
    { id: '1', title: 'Salary Credit', amount: 4800.00, type: 'income', category: 'Salary', date: new Date().toISOString() },
    { id: '2', title: 'Whole Foods Market', amount: -124.50, type: 'expense', category: 'Groceries', date: new Date().toISOString() },
    { id: '3', title: 'Equinox Gym', amount: -150.00, type: 'expense', category: 'Health & Fitness', date: new Date().toISOString() },
    { id: '4', title: 'Dividends Deposit', amount: 320.00, type: 'income', category: 'Investments', date: new Date().toISOString() }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State (Skeleton Form)
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('Groceries');

  // API State
  const [data, setData] = useState<BackendData>(DEFAULT_FALLBACK_DATA);
  const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch API Mock Data
  const fetchMockData = async () => {
    setIsLoading(true);
    try {
      const statusRes = await fetch('http://localhost:5000/api/status');
      if (statusRes.ok) {
        const transRes = await fetch('http://localhost:5000/api/transactions/mock');
        if (transRes.ok) {
          const transData = await transRes.json();
          setData(transData);
          setIsApiConnected(true);
        } else {
          throw new Error('Transaction API Failed');
        }
      } else {
        throw new Error('Status API Failed');
      }
    } catch (e) {
      console.warn('Backend API offline. Using high-fidelity local mock variables.');
      setIsApiConnected(false);
      setData(DEFAULT_FALLBACK_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMockData();
  }, []);

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;

    const amt = parseFloat(txAmount);
    if (isNaN(amt)) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      title: txTitle,
      amount: txType === 'income' ? amt : -amt,
      type: txType,
      category: txCategory,
      date: new Date().toISOString()
    };

    // Calculate simulated metrics
    const updatedTransactions = [newTx, ...data.transactions];
    const newIncome = updatedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const newExpenses = Math.abs(updatedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));
    const newBalance = data.metrics.balance + (txType === 'income' ? amt : -amt);
    const newSavings = newIncome - newExpenses;
    const newSavingsRate = newIncome > 0 ? ((newSavings / newIncome) * 100).toFixed(1) + '%' : '0%';

    setData({
      metrics: {
        balance: newBalance,
        income: newIncome,
        expenses: newExpenses,
        savingsRate: newSavingsRate
      },
      transactions: updatedTransactions
    });

    // Reset Form & Close Modal
    setTxTitle('');
    setTxAmount('');
    setIsModalOpen(false);
  };

  const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      return { bg: 'rgba(16, 185, 129, 0.1)', fg: 'var(--color-income)', icon: <TrendingUp size={18} /> };
    }
    switch (category.toLowerCase()) {
      case 'groceries':
        return { bg: 'rgba(6, 182, 212, 0.1)', fg: 'var(--color-accent)', icon: <Wallet size={18} /> };
      case 'health & fitness':
        return { bg: 'rgba(139, 92, 246, 0.1)', fg: 'var(--color-primary)', icon: <Activity size={18} /> };
      case 'investments':
        return { bg: 'rgba(16, 185, 129, 0.1)', fg: 'var(--color-income)', icon: <PiggyBank size={18} /> };
      default:
        return { bg: 'rgba(244, 63, 94, 0.1)', fg: 'var(--color-expense)', icon: <CreditCard size={18} /> };
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard-wrapper">
        
        {/* SIDEBAR COMPONENT */}
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
                { name: 'Settings', icon: <Settings size={20} /> }
              ].map((item) => (
                <a 
                  key={item.name} 
                  href={`#${item.name.toLowerCase()}`}
                  className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.name)}
                >
                  {item.icon}
                  {item.name}
                </a>
              ))}
            </nav>
          </div>

          {/* BACKEND CONNECTIVITY BADGE */}
          <div className="sidebar-footer">
            <div 
              className={`api-status-badge ${isApiConnected ? 'connected' : 'disconnected'}`}
              title={isApiConnected ? "Connected directly to Node backend server" : "Node backend offline. Running in local fallback sandbox."}
            >
              <div className="status-dot"></div>
              <span style={{ flexGrow: 1 }}>
                {isApiConnected === null ? 'Pinging API...' : isApiConnected ? 'API Connected' : 'Offline Sandbox'}
              </span>
              <button 
                onClick={fetchMockData} 
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Pings API Server Status again"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="main-content animate-slide-up">
          
          {/* HEADER TOP BAR */}
          <header className="top-bar">
            <div className="user-greeting">
              <h1>Dashboard Overview</h1>
              <p>Welcome back, Santosh! Here is your high-fidelity financial status.</p>
            </div>

            <div className="action-buttons">
              {!isApiConnected && isApiConnected !== null && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
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
              <button className="btn-secondary" onClick={fetchMockData}>
                <RefreshCw size={15} />
                Refresh
              </button>
              <button className="btn-premium" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} />
                Add Transaction
              </button>
            </div>
          </header>

          {/* KEY FINANCIAL METRICS CARDS */}
          <section className="stats-grid">
            
            {/* CARD 1: NET WORTH BALANCE */}
            <div className="glass-panel stat-card balance-card">
              <div className="stat-header">
                <span className="stat-title">NET ASSETS</span>
                <div className="stat-icon-wrapper">
                  <Wallet size={18} />
                </div>
              </div>
              <div>
                <div className="stat-value">
                  ${data.metrics.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="stat-trend" style={{ color: 'var(--text-secondary)' }}>
                  Total liquidity available
                </div>
              </div>
            </div>

            {/* CARD 2: MONTHLY REVENUE */}
            <div className="glass-panel stat-card income-card">
              <div className="stat-header">
                <span className="stat-title">MONTHLY REVENUE</span>
                <div className="stat-icon-wrapper">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div>
                <div className="stat-value">
                  ${data.metrics.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="stat-trend">
                  <ArrowUpRight size={14} />
                  +12.4% vs last month
                </div>
              </div>
            </div>

            {/* CARD 3: MONTHLY OUTGOINGS */}
            <div className="glass-panel stat-card expense-card">
              <div className="stat-header">
                <span className="stat-title">MONTHLY OUTGOINGS</span>
                <div className="stat-icon-wrapper">
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div>
                <div className="stat-value">
                  ${data.metrics.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="stat-trend">
                  <ArrowDownRight size={14} />
                  -4.2% vs last month
                </div>
              </div>
            </div>

            {/* CARD 4: SAVINGS RATIO */}
            <div className="glass-panel stat-card savings-card">
              <div className="stat-header">
                <span className="stat-title">SAVINGS RATIO</span>
                <div className="stat-icon-wrapper">
                  <PiggyBank size={18} />
                </div>
              </div>
              <div>
                <div className="stat-value">
                  {data.metrics.savingsRate}
                </div>
                <div className="stat-trend">
                  <TrendingUp size={14} />
                  Top 5% of savers
                </div>
              </div>
            </div>

          </section>

          {/* LOWER GRID DETAILS PANEL */}
          <div className="details-grid">
            
            {/* LEFT: CUSTOM RESPONSIVE TREND SVG CHART */}
            <section className="glass-panel chart-panel">
              <div className="panel-header" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="panel-title">Asset Trend Accumulation</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Visual tracking of monthly asset accretion & balance index
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-primary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
                    Balance
                  </span>
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
                  
                  {/* Curved Area Under Line */}
                  <path 
                    d="M0 220 C 100 180, 200 210, 300 130 C 400 90, 500 110, 600 50 L 600 240 L 0 240 Z" 
                    fill="url(#chartGlow)" 
                  />
                  
                  {/* Curved Line Path */}
                  <path 
                    d="M0 220 C 100 180, 200 210, 300 130 C 400 90, 500 110, 600 50" 
                    fill="none" 
                    stroke="var(--color-primary)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    filter="drop-shadow(0px 4px 10px rgba(168, 85, 247, 0.4))"
                  />
                  
                  {/* Glowing Data Dots */}
                  <circle cx="300" cy="130" r="5" fill="var(--color-accent)" stroke="#fff" strokeWidth="2" />
                  <circle cx="600" cy="50" r="5" fill="var(--color-primary)" stroke="#fff" strokeWidth="2" />
                  
                  {/* Tooltip Simulation */}
                  <rect x="250" y="70" width="100" height="40" rx="8" fill="var(--bg-secondary)" stroke="var(--border-glass)" strokeWidth="1" />
                  <text x="300" y="88" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">Current Balance</text>
                  <text x="300" y="102" fill="var(--color-accent)" fontSize="9" fontWeight="600" textAnchor="middle">$14,850.50</text>
                </svg>
              </div>
            </section>

            {/* RIGHT: MOCK TRANSACTIONS RETRIEVED FROM BACKEND */}
            <section className="glass-panel transactions-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Recent Transactions</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Live outgoings & credits listing
                  </p>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              </div>

              <div className="transaction-list">
                {data.transactions.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                    No recent transactions. Click Add Transaction to start.
                  </p>
                ) : (
                  data.transactions.map((tx) => {
                    const styling = getCategoryIcon(tx.category, tx.type);
                    return (
                      <div key={tx.id} className="transaction-item">
                        <div className="tx-left">
                          <div 
                            className="tx-icon-wrapper" 
                            style={{ backgroundColor: styling.bg, color: styling.fg }}
                          >
                            {styling.icon}
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
                          {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

          </div>

        </main>

        {/* TRANSACTIONS FORM MODAL (HIGH FIDELITY DIALOG) */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
              
              <h2 className="modal-title">New Entry Registry</h2>
              
              <form onSubmit={handleCreateTransaction}>
                
                <div className="form-group">
                  <label htmlFor="tx-title">Merchant / Source Title</label>
                  <input 
                    type="text" 
                    id="tx-title" 
                    className="form-input" 
                    placeholder="e.g., Whole Foods, Netflix, dividend"
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tx-amount">Total Value ($)</label>
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
                    <option value="Salary">Salary Credit</option>
                    <option value="Groceries">Groceries Supply</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Investments">Investments Asset</option>
                    <option value="Entertainment">Entertainment / Media</option>
                    <option value="Electronics">Electronics purchase</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn-premium" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }}
                >
                  <Plus size={18} />
                  Register Transaction
                </button>

              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
