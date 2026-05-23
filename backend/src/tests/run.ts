import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Force test environment directory check
process.env.NODE_ENV = 'test';

// Import services and controllers (using ESM js suffixes)
import { db } from '../services/db.js';
import { transactionController } from '../controllers/transactionController.js';
import { budgetController } from '../controllers/budgetController.js';
import { goalController } from '../controllers/goalController.js';
import { settingsController } from '../controllers/settingsController.js';

// Simple Express Request/Response Mocking Utilities
function mockRequest(options: { params?: any; query?: any; body?: any } = {}) {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
  } as any;
}

function mockResponse() {
  const res: any = {};
  res.statusCode = 200;
  res.jsonData = null;

  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };

  return res;
}

// Helper to reset and purge testing database sandbox
function resetTestDatabase() {
  db.resetAll();
}

// Define the test execution suite
async function runTests() {
  console.log('🧪 Starting FinTrack Backend Testing Suite...');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      resetTestDatabase();
      fn();
      console.log(` ✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(` ❌ ${name}`);
      console.error(error);
      failed++;
    }
  }

  // --- UNIT TESTS FOR DATABASE ENGINE ---
  test('Database - Should read default seeded values', () => {
    const txs = db.transactions.read();
    assert.strictEqual(txs.length, 6, 'Should start with 6 default transactions');
    assert.strictEqual(txs[0].title, 'Salary Credit', 'First transaction title should match');
    
    const settings = db.settings.read();
    assert.strictEqual(settings.userName, 'Santosh', 'Username should match seeded values');
  });

  test('Database - Should perform atomic saving', () => {
    const settings = db.settings.read();
    settings.userName = 'Tester';
    db.settings.save(settings);

    const reloaded = db.settings.read();
    assert.strictEqual(reloaded.userName, 'Tester', 'Atomic save should persist userName mutation');
  });

  // --- INTEGRATION TESTS FOR TRANSACTION CONTROLLER ---
  test('Transactions - Should get list of transactions', () => {
    const req = mockRequest();
    const res = mockResponse();

    transactionController.getTransactions(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.length, 6);
  });

  test('Transactions - Should support search and filter parameters', () => {
    // Search filter
    const reqSearch = mockRequest({ query: { search: 'Foods' } });
    const resSearch = mockResponse();
    transactionController.getTransactions(reqSearch, resSearch);
    assert.strictEqual(resSearch.jsonData.length, 1);
    assert.strictEqual(resSearch.jsonData[0].title, 'Whole Foods Market');

    // Type filter
    const reqType = mockRequest({ query: { type: 'income' } });
    const resType = mockResponse();
    transactionController.getTransactions(reqType, resType);
    assert.strictEqual(resType.jsonData.every((t: any) => t.type === 'income'), true);
  });

  test('Transactions - Should accurately aggregate financial metrics', () => {
    const req = mockRequest();
    const res = mockResponse();

    transactionController.getMetrics(req, res);
    assert.strictEqual(res.statusCode, 200);
    // Calculated metrics check
    // Incomes: Salary Credit (4800) + Stock Portfolio Dividend (320) = 5120
    // Expenses: Whole Foods (124.50) + Equinox Gym (150) + Netflix (19.99) + Apple Store (1299) = 1593.49
    // Savings: 5120 - 1593.49 = 3526.51
    // Savings Rate: (3526.51 / 5120) * 100 = 68.87% (which translates to 68.9%)
    assert.strictEqual(res.jsonData.income, 5120);
    assert.strictEqual(res.jsonData.expenses, 1593.49);
    assert.strictEqual(res.jsonData.savingsRate, '68.9%');
  });

  test('Transactions - Should validate and create new entries', () => {
    const req = mockRequest({
      body: {
        title: 'Starbucks Coffee',
        amount: 5.50,
        type: 'expense',
        category: 'Groceries',
        date: new Date().toISOString()
      }
    });
    const res = mockResponse();

    transactionController.createTransaction(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.title, 'Starbucks Coffee');
    assert.strictEqual(res.jsonData.amount, -5.50, 'Expense amount must register negative');

    // Check database has 7 records now
    const txs = db.transactions.read();
    assert.strictEqual(txs.length, 7);
  });

  test('Transactions - Should refuse malformed amount variables', () => {
    const req = mockRequest({
      body: {
        title: 'Free Coffee',
        amount: 'bad-amount',
        type: 'expense',
        category: 'Groceries'
      }
    });
    const res = mockResponse();

    transactionController.createTransaction(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.jsonData.error);
  });

  // --- INTEGRATION TESTS FOR BUDGET CONTROLLER ---
  test('Budgets - Should dynamically associate transaction spending', () => {
    const req = mockRequest();
    const res = mockResponse();

    budgetController.getBudgets(req, res);
    assert.strictEqual(res.statusCode, 200);
    
    // Check Groceries: Whole Foods expense was -124.50. So dynamic spent must be 124.50.
    const groceriesBudget = res.jsonData.find((b: any) => b.category === 'Groceries');
    assert.ok(groceriesBudget);
    assert.strictEqual(groceriesBudget.spent, 124.50);
  });

  test('Budgets - Should support custom budget creations & updates', () => {
    const req = mockRequest({
      body: {
        category: 'Transportation',
        limit: 150.00
      }
    });
    const res = mockResponse();

    budgetController.createOrUpdateBudget(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.category, 'Transportation');
    assert.strictEqual(res.jsonData.limit, 150.00);

    const budgets = db.budgets.read();
    assert.strictEqual(budgets.some(b => b.category === 'Transportation'), true);
  });

  // --- INTEGRATION TESTS FOR SAVINGS GOALS ---
  test('Goals - Should contribute to goal and log transfer transaction', () => {
    const req = mockRequest({
      params: { id: 'g1' }, // Emergency Fund (currentAmount: 6500)
      body: { amount: 500.00 }
    });
    const res = mockResponse();

    goalController.contributeToGoal(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.goal.currentAmount, 7000.00, 'Contribution must increment current amount');
    assert.strictEqual(res.jsonData.transaction.amount, -500.00, 'Transaction transfer amount must be negative');
    
    // Verify a corresponding outgoing was registered to the transaction database
    const transactions = db.transactions.read();
    assert.strictEqual(transactions[0].title, 'Contribution: Emergency Fund');
    assert.strictEqual(transactions[0].amount, -500.00);
  });

  // --- INTEGRATION TESTS FOR SETTINGS ---
  test('Settings - Should update settings and allow database reset', () => {
    const reqUpdate = mockRequest({
      body: {
        userName: 'S. Chouhan',
        currency: '₹',
        themeAccent: 'Neon Teal'
      }
    });
    const resUpdate = mockResponse();

    settingsController.updateSettings(reqUpdate, resUpdate);
    assert.strictEqual(resUpdate.statusCode, 200);
    assert.strictEqual(resUpdate.jsonData.userName, 'S. Chouhan');
    assert.strictEqual(resUpdate.jsonData.currency, '₹');

    // Perform data purging
    const reqReset = mockRequest();
    const resReset = mockResponse();
    settingsController.resetDatabase(reqReset, resReset);
    assert.strictEqual(resReset.statusCode, 200);

    // Verify settings were restored back to original defaults
    const reloadedSettings = db.settings.read();
    assert.strictEqual(reloadedSettings.userName, 'Santosh');
  });

  console.log('\n--- TEST SUITE SUMMARIES ---');
  console.log(` 🌟 Passed: ${passed} / ${passed + failed}`);
  if (failed > 0) {
    console.error(` 🚨 Failed: ${failed} tests`);
    process.exit(1);
  } else {
    console.log(' 🎉 All backend tests completed flawlessly!\n');
  }
}

// Run the script
runTests().catch(err => {
  console.error('[TestSuite Critical Failure]', err);
  process.exit(1);
});
