import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  PanResponder,
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
  const [isEssential, setIsEssential] = useState(true);

  const isEssentialRef = useRef(isEssential);
  useEffect(() => {
    isEssentialRef.current = isEssential;
  }, [isEssential]);

  const slideAnim = useRef(new Animated.Value(1)).current; // 1 = Essential, 0 = Non-Essential

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        let newX = (isEssentialRef.current ? 2 : 120) + gestureState.dx;
        if (newX < 2) newX = 2;
        if (newX > 120) newX = 120;
        
        const fraction = (120 - newX) / 118;
        slideAnim.setValue(fraction);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < 5) {
          const nextState = !isEssentialRef.current;
          setIsEssential(nextState);
          Animated.spring(slideAnim, {
            toValue: nextState ? 1 : 0,
            tension: 60,
            friction: 8,
            useNativeDriver: false,
          }).start();
          return;
        }

        const finalX = (isEssentialRef.current ? 2 : 120) + gestureState.dx;
        const nextState = finalX < 61;
        
        setIsEssential(nextState);
        Animated.spring(slideAnim, {
          toValue: nextState ? 1 : 0,
          tension: 60,
          friction: 8,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Programmatic state synchronization (form resets)
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isEssential ? 1 : 0,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [isEssential]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 2],
  });

  const handleBgColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1e1e20', '#ffffff'],
  });

  const handleBorderColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2e2e30', '#eaeaea'],
  });

  const essentialOpacity = slideAnim;
  const nonEssentialOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

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

  // Essential vs Non-essential breakdown
  const essentialSpent = thisMonthTransactions
    .filter((tx) => tx.isEssential)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const nonEssentialSpent = thisMonthTransactions
    .filter((tx) => !tx.isEssential)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const essentialPercentage = totalSpent > 0 ? (essentialSpent / totalSpent) * 100 : 0;
  const nonEssentialPercentage = totalSpent > 0 ? (nonEssentialSpent / totalSpent) * 100 : 0;

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
        description.trim(),
        isEssential
      );

      if (success) {
        // Reset form
        setAmount('');
        setSubCategory('');
        setDescription('');
        setShowOptional(false);
        setIsEssential(true);
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

          {/* Custom Toggle Switch for Essential vs Non-Essential */}
          <View
            style={[
              styles.customSwitch,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Animated.View
              style={[
                styles.switchHandle,
                {
                  transform: [{ translateX }],
                  backgroundColor: handleBgColor,
                  borderColor: handleBorderColor,
                },
              ]}
            >
              <Animated.View style={[styles.handleTextWrapper, { opacity: essentialOpacity }]}>
                <Text style={[styles.switchText, { color: '#000000' }]}>Essential</Text>
              </Animated.View>
              <Animated.View style={[styles.handleTextWrapper, { opacity: nonEssentialOpacity }]}>
                <Text style={[styles.switchText, { color: '#ffffff' }]}>Non-Essential</Text>
              </Animated.View>
            </Animated.View>
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

          {/* Essential vs Non-essential Breakdown Widget */}
          {totalSpent > 0 && (
            <View style={styles.breakdownContainer}>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              
              <Text style={[styles.breakdownTitle, { color: colors.textSecondary }]}>
                Expense Breakdown
              </Text>
              
              {/* Dual progress bar */}
              <View style={[styles.ratioTrack, { backgroundColor: colors.inputBg }]}>
                <View
                  style={[
                    styles.ratioBarEssential,
                    {
                      width: `${essentialPercentage}%`,
                      backgroundColor: colors.success,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ratioBarNonEssential,
                    {
                      width: `${nonEssentialPercentage}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>

              <View style={styles.ratioLabelsRow}>
                <View style={styles.ratioLabelItem}>
                  <View style={[styles.colorIndicator, { backgroundColor: colors.success }]} />
                  <Text style={[styles.ratioText, { color: colors.text }]}>
                    Essential: {currencySymbol}{essentialSpent.toFixed(0)} ({essentialPercentage.toFixed(0)}%)
                  </Text>
                </View>
                
                <View style={styles.ratioLabelItem}>
                  <View style={[styles.colorIndicator, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.ratioText, { color: colors.text }]}>
                    Non-Essential: {currencySymbol}{nonEssentialSpent.toFixed(0)} ({nonEssentialPercentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            </View>
          )}
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
  customSwitch: {
    width: 240,
    height: 44,
    borderRadius: 22,
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
  },
  switchHandle: {
    position: 'absolute',
    top: 2,
    width: 116,
    height: 38,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  handleTextWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  breakdownContainer: {
    marginTop: 16,
  },
  separator: {
    height: 1,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ratioTrack: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  ratioBarEssential: {
    height: '100%',
  },
  ratioBarNonEssential: {
    height: '100%',
  },
  ratioLabelsRow: {
    flexDirection: 'column',
    gap: 6,
  },
  ratioLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  ratioText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
