import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const DashboardScreen: React.FC = () => {
  const { transactions, budgets, addTransaction, refreshing, refreshData, currencySymbol } = useApp();
  const { colors } = useTheme();

  // Form State
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  // Auto-select first category if available
  useEffect(() => {
    if (budgets.length > 0 && !selectedCategory) {
      setSelectedCategory(budgets[0].category);
    }
  }, [budgets]);

  // Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTransactions = transactions.filter((tx) => {
    try {
      const txDate = new Date(tx.timestamp);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    } catch {
      return false;
    }
  });

  const totalSpent = thisMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Category breakdown
  const categorySummaries = budgets.map((b) => {
    const spent = thisMonthTransactions
      .filter((tx) => tx.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, tx) => sum + tx.amount, 0);
    const percentage = b.budget > 0 ? (spent / b.budget) * 100 : 0;
    return {
      category: b.category,
      budget: b.budget,
      spent,
      percentage,
    };
  });

  const handleAddExpense = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive number.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('No Category', 'Please select or create a category first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addTransaction(
        numAmount,
        selectedCategory,
        subCategory.trim(),
        description.trim()
      );

      if (success) {
        // Reset form
        setAmount('');
        setSubCategory('');
        setDescription('');
        setShowOptional(false);
        Alert.alert('Success', 'Expense recorded!');
      } else {
        Alert.alert('Error', 'Failed to save transaction to Google Sheets.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return colors.danger;
    if (percentage >= 80) return colors.warning;
    return colors.success;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add Expense Form */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Quick Expense</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {/* Amount input */}
          <View style={styles.amountInputContainer}>
            <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>{currencySymbol}</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.primary }]}
              placeholder={isAmountFocused ? "" : "0.00"}
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              maxLength={10}
              onFocus={() => setIsAmountFocused(true)}
              onBlur={() => setIsAmountFocused(false)}
            />
          </View>

          {/* Category Selector */}
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {budgets.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 8 }}>
                No categories found. Create one in Budget settings.
              </Text>
            ) : (
              budgets.map((b) => {
                const isSelected = selectedCategory === b.category;
                return (
                  <TouchableOpacity
                    key={b.category}
                    onPress={() => setSelectedCategory(b.category)}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.inputBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        { color: isSelected ? colors.primaryInverse : colors.text },
                      ]}
                    >
                      {b.category}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Optional Details Toggle */}
          <TouchableOpacity
            onPress={() => setShowOptional(!showOptional)}
            style={styles.optionalToggle}
          >
            <Text style={[styles.optionalText, { color: colors.accent }]}>
              {showOptional ? 'Hide Optional Details' : 'Add Optional Details'}
            </Text>
            <Ionicons
              name={showOptional ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.accent}
            />
          </TouchableOpacity>

          {/* Optional Fields */}
          {showOptional && (
            <View style={styles.optionalFieldsContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Sub-category</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="e.g. Coffee, Groceries"
                placeholderTextColor={colors.textSecondary}
                value={subCategory}
                onChangeText={setSubCategory}
                maxLength={30}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="e.g. Starbuck's with team"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                maxLength={100}
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleAddExpense}
            disabled={isSubmitting}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.primaryInverse} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.primaryInverse }]}>
                Add Expense
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Overall Progress Widget */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Spent this Month</Text>
            {refreshing && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          <Text style={[styles.mainAmount, { color: colors.primary }]}>
            {currencySymbol}{totalSpent.toFixed(2)}
          </Text>
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
              Budget: {currencySymbol}{totalBudget.toFixed(2)}
            </Text>
            <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
              {overallPercentage.toFixed(0)}%
            </Text>
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.inputBg }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(overallPercentage, 100)}%`,
                  backgroundColor: getProgressBarColor(overallPercentage),
                },
              ]}
            />
          </View>
        </View>

        {/* Budget Health Overview */}
        {categorySummaries.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Budgets</Text>
              <TouchableOpacity onPress={refreshData}>
                <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {categorySummaries.map((cat, index) => (
                <View
                  key={cat.category}
                  style={[
                    styles.catRow,
                    {
                      borderBottomWidth: index === categorySummaries.length - 1 ? 0 : 1,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.catMeta}>
                    <Text style={[styles.catName, { color: colors.text }]}>{cat.category}</Text>
                    <Text style={[styles.catAmounts, { color: colors.textSecondary }]}>
                      {currencySymbol}{cat.spent.toFixed(0)} / {currencySymbol}{cat.budget.toFixed(0)}
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.inputBg, height: 6 }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: getProgressBarColor(cat.percentage),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainAmount: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    paddingBottom: 8,
    marginBottom: 20,
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: '600',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    padding: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryScroll: {
    paddingVertical: 4,
    marginBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  optionalText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  optionalFieldsContainer: {
    marginBottom: 16,
  },
  textInput: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  catRow: {
    paddingVertical: 16,
  },
  catMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
  },
  catAmounts: {
    fontSize: 13,
    fontWeight: '500',
  },
});
