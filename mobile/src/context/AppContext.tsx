import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sheetService, Transaction, Budget } from '../services/sheetService';

interface AppContextType {
  sheetUrl: string | null;
  setSheetUrl: (url: string) => Promise<boolean>;
  disconnectSheet: () => Promise<void>;
  
  passcode: string | null;
  setPasscodeState: (pin: string | null) => Promise<void>;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => Promise<void>;
  
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  refreshing: boolean;
  refreshData: () => Promise<void>;
  
  addTransaction: (amount: number, category: string, subCategory: string, description: string, isEssential: boolean) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  saveCategory: (category: string, budget: number) => Promise<boolean>;
  deleteCategory: (category: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sheetUrl, setSheetUrlState] = useState<string | null>(null);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [currencySymbol, setCurrencySymbolState] = useState<string>('₹');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 1. Initial Load from AsyncStorage
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem('sheet_url');
        const storedPasscode = await AsyncStorage.getItem('local_passcode');
        const cachedTrans = await AsyncStorage.getItem('cached_transactions');
        const cachedBudgets = await AsyncStorage.getItem('cached_budgets');
        const storedCurrency = await AsyncStorage.getItem('currency_symbol');

        if (storedUrl) {
          setSheetUrlState(storedUrl);
        }
        
        if (storedPasscode) {
          setPasscode(storedPasscode);
          setIsLocked(true); // Lock immediately on boot if passcode exists
        }

        if (storedCurrency) {
          setCurrencySymbolState(storedCurrency);
        } else {
          // Default to Rupees if not set
          setCurrencySymbolState('₹');
        }

        if (cachedTrans) {
          setTransactions(JSON.parse(cachedTrans));
        }
        
        if (cachedBudgets) {
          setBudgets(JSON.parse(cachedBudgets));
        }
      } catch (e) {
        console.error('Error loading stored data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // 2. Fetch data from Google Sheets when sheetUrl changes
  useEffect(() => {
    if (sheetUrl) {
      refreshData();
    } else {
      setTransactions([]);
      setBudgets([]);
    }
  }, [sheetUrl]);

  // 3. Handle app state changes (Auto-lock on background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // If we go to background or inactive, lock the screen if passcode exists
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (passcode) {
          setIsLocked(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [passcode]);

  const refreshData = async () => {
    if (!sheetUrl) return;
    setRefreshing(true);
    try {
      const data = await sheetService.fetchData(sheetUrl);
      setTransactions(data.transactions);
      setBudgets(data.budgets);
      
      // Update local cache
      await AsyncStorage.setItem('cached_transactions', JSON.stringify(data.transactions));
      await AsyncStorage.setItem('cached_budgets', JSON.stringify(data.budgets));
    } catch (e) {
      console.error('Error refreshing sheets data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const setSheetUrl = async (url: string): Promise<boolean> => {
    const isValid = await sheetService.testConnection(url);
    if (isValid) {
      await AsyncStorage.setItem('sheet_url', url);
      setSheetUrlState(url);
      return true;
    }
    return false;
  };

  const disconnectSheet = async () => {
    await AsyncStorage.removeItem('sheet_url');
    await AsyncStorage.removeItem('cached_transactions');
    await AsyncStorage.removeItem('cached_budgets');
    setSheetUrlState(null);
    setTransactions([]);
    setBudgets([]);
  };

  const setPasscodeState = async (pin: string | null) => {
    if (pin) {
      await AsyncStorage.setItem('local_passcode', pin);
      setPasscode(pin);
    } else {
      await AsyncStorage.removeItem('local_passcode');
      setPasscode(null);
      setIsLocked(false);
    }
  };

  const setCurrencySymbol = async (symbol: string) => {
    await AsyncStorage.setItem('currency_symbol', symbol);
    setCurrencySymbolState(symbol);
  };

  const addTransaction = async (
    amount: number,
    category: string,
    subCategory: string,
    description: string,
    isEssential: boolean
  ): Promise<boolean> => {
    if (!sheetUrl) return false;
    try {
      const newId = await sheetService.addTransaction(sheetUrl, amount, category, subCategory, description, isEssential);
      
      // Optimistic UI update or just standard refresh
      const newTx: Transaction = {
        id: newId,
        amount,
        timestamp: new Date().toISOString(),
        category,
        subCategory,
        description,
        isEssential,
      };
      
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      await AsyncStorage.setItem('cached_transactions', JSON.stringify(updatedTxs));
      
      // Refresh in background to sync
      refreshData();
      return true;
    } catch (e) {
      console.error('Failed to add transaction:', e);
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    if (!sheetUrl) return false;
    try {
      // Optimistically remove it locally
      const updatedTxs = transactions.filter(t => t.id !== id);
      setTransactions(updatedTxs);
      await AsyncStorage.setItem('cached_transactions', JSON.stringify(updatedTxs));

      await sheetService.deleteTransaction(sheetUrl, id);
      refreshData();
      return true;
    } catch (e) {
      console.error('Failed to delete transaction:', e);
      // Rollback
      refreshData();
      return false;
    }
  };

  const saveCategory = async (category: string, budget: number): Promise<boolean> => {
    if (!sheetUrl) return false;
    try {
      // Optimistic update
      const exists = budgets.some(b => b.category.toLowerCase() === category.toLowerCase());
      let updatedBudgets: Budget[];
      if (exists) {
        updatedBudgets = budgets.map(b => 
          b.category.toLowerCase() === category.toLowerCase() ? { ...b, budget } : b
        );
      } else {
        updatedBudgets = [...budgets, { category, budget }];
      }
      setBudgets(updatedBudgets);
      await AsyncStorage.setItem('cached_budgets', JSON.stringify(updatedBudgets));

      await sheetService.saveCategory(sheetUrl, category, budget);
      refreshData();
      return true;
    } catch (e) {
      console.error('Failed to save category:', e);
      refreshData();
      return false;
    }
  };

  const deleteCategory = async (category: string): Promise<boolean> => {
    if (!sheetUrl) return false;
    try {
      const updatedBudgets = budgets.filter(b => b.category.toLowerCase() !== category.toLowerCase());
      setBudgets(updatedBudgets);
      await AsyncStorage.setItem('cached_budgets', JSON.stringify(updatedBudgets));

      await sheetService.deleteCategory(sheetUrl, category);
      refreshData();
      return true;
    } catch (e) {
      console.error('Failed to delete category:', e);
      refreshData();
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        sheetUrl,
        setSheetUrl,
        disconnectSheet,
        passcode,
        setPasscodeState,
        isLocked,
        setIsLocked,
        currencySymbol,
        setCurrencySymbol,
        transactions,
        budgets,
        loading,
        refreshing,
        refreshData,
        addTransaction,
        deleteTransaction,
        saveCategory,
        deleteCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
