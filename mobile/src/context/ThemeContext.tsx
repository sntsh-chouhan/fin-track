import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  background: '#f9f9fb',
  card: '#ffffff',
  text: '#111111',
  textSecondary: '#666666',
  border: '#eaeaea',
  primary: '#000000',
  primaryInverse: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  accent: '#6366f1',
  inputBg: '#f3f4f6',
  keypadBg: '#f3f4f6',
};

export const darkColors = {
  background: '#0d0d0e',
  card: '#161618',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  border: '#27272a',
  primary: '#ffffff',
  primaryInverse: '#000000',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  accent: '#818cf8',
  inputBg: '#202023',
  keypadBg: '#202023',
};

type ThemeContextType = {
  isDark: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(true); // default to dark mode for rich premium feel

  useEffect(() => {
    // Load theme preference from storage
    AsyncStorage.getItem('theme_mode').then((val) => {
      if (val !== null) {
        setIsDark(val === 'dark');
      }
    });
  }, []);

  const toggleTheme = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    AsyncStorage.setItem('theme_mode', newVal ? 'dark' : 'light');
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
