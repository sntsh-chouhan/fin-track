import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LockScreen } from './src/screens/LockScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { BudgetSettingsScreen } from './src/screens/BudgetSettingsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { ShakeExpenseModal } from './src/components/ShakeExpenseModal';

type TabType = 'dashboard' | 'history' | 'budgets' | 'settings';

function MainAppContent() {
  const { sheetUrl, isLocked, setIsLocked, loading } = useApp();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Loading Screen / Splash
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0d0d0e' : '#f9f9fb' }]}>
        <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
        <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#666666' }]}>
          Loading FinTrack...
        </Text>
      </View>
    );
  }

  // 1. If sheet is not configured, show Onboarding
  if (!sheetUrl) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen />
      </>
    );
  }

  // 2. If app is locked, show Lock Screen
  if (isLocked) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LockScreen />
      </>
    );
  }

  // 3. Show App with Navigation Tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        return <TransactionsScreen />;
      case 'budgets':
        return <BudgetSettingsScreen />;
      case 'settings':
        return <SettingsScreen onLaunchPasscodeSetup={() => setIsLocked(true)} />;
      case 'dashboard':
      default:
        return <DashboardScreen />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'history':
        return 'Expenses';
      case 'budgets':
        return 'Budgets';
      case 'settings':
        return 'Settings';
      case 'dashboard':
      default:
        return 'FinTrack';
    }
  };

  return (
    <>
      <SafeAreaView style={[styles.appContainer, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Sleek App Header */}
      <View style={[styles.appHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{getHeaderTitle()}</Text>
        <Ionicons
          name={isDark ? 'wallet-outline' : 'wallet'}
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>{renderTabContent()}</View>

      {/* Minimalist Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {/* Dashboard Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('dashboard')}
          style={styles.tabItem}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'dashboard' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'dashboard' ? colors.primary : colors.textSecondary },
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        {/* History Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={styles.tabItem}
        >
          <Ionicons
            name={activeTab === 'history' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={activeTab === 'history' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'history' ? colors.primary : colors.textSecondary },
            ]}
          >
            History
          </Text>
        </TouchableOpacity>

        {/* Budgets Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('budgets')}
          style={styles.tabItem}
        >
          <Ionicons
            name={activeTab === 'budgets' ? 'pie-chart' : 'pie-chart-outline'}
            size={22}
            color={activeTab === 'budgets' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'budgets' ? colors.primary : colors.textSecondary },
            ]}
          >
            Budgets
          </Text>
        </TouchableOpacity>

        {/* Settings Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={styles.tabItem}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'settings' ? colors.primary : colors.textSecondary },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
      <ShakeExpenseModal />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  appContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  appHeader: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mainContent: {
    flex: 1,
  },
  tabBar: {
    height: 64,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
