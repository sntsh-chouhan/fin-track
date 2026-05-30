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
  Animated,
  PanResponder,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

export const DashboardScreen: React.FC = () => {
  const { transactions, budgets, addTransaction, refreshing, refreshData, currencySymbol, showAlert } = useApp();
  const { isDark, colors } = useTheme();

  // Form State
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [isLineView, setIsLineView] = useState(true);
  const chartTransition = useRef(new Animated.Value(1)).current; // 1 = Line Curve, 0 = Bar Chart

  const toggleChartView = () => {
    const nextValue = !isLineView;
    setIsLineView(nextValue);
    Animated.spring(chartTransition, {
      toValue: nextValue ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };
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
      onPanResponderGrant: () => { },
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

  // Daily Spending Calculation & Weekend/Quarter Math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailySpent = Array(daysInMonth).fill(0);

  thisMonthTransactions.forEach((tx) => {
    try {
      const date = new Date(tx.timestamp);
      const day = date.getDate();
      if (day >= 1 && day <= daysInMonth) {
        dailySpent[day - 1] += tx.amount;
      }
    } catch (e) {
      // ignore
    }
  });

  const maxDailySpent = Math.max(...dailySpent, 10); // avoid division by zero, min scale of 10
  const logK = 0.05; // Compression factor: smaller is more linear, larger is more logarithmic
  const logScaleMax = Math.log(1 + logK * maxDailySpent);

  const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const spent = dailySpent[index];
    const percentage = (spent / maxDailySpent) * 100; // Reverted back to linear scale
    const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekdayName = WEEKDAYS[dayOfWeek];

    return {
      day,
      spent,
      percentage,
      isWeekend,
      isSunday,
      weekdayName,
    };
  });

  // Bezier curve calculations for line chart (Full month fit)
  const svgWidth = 350;
  const svgHeight = 150;
  const paddingLeft = 30;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Logarithmic grid thresholds (1, 10, 100, 1000, 10000, 100000) for inflection lines
  const logThresholds = [1, 10, 100, 1000, 10000, 100000].filter(t => {
    if (t > maxDailySpent) return false;
    // Don't show threshold if it's too close to the top label (within 15% of chartHeight)
    const yThreshold = (Math.log(1 + logK * t) / logScaleMax) * chartHeight;
    return (chartHeight - yThreshold) > (chartHeight * 0.15);
  });

  // Generate minor grid lines to show log scale compression
  const minorGridLines: number[] = [];
  const decades = [1, 10, 100, 1000, 10000, 100000];
  decades.forEach(D => {
    for (let multiplier = 2; multiplier <= 9; multiplier++) {
      const val = D * multiplier;
      if (val < maxDailySpent) {
        minorGridLines.push(val);
      }
    }
  });

  // Color interpolation for log heat gradient
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    const pad = (str: string) => (str.length === 1 ? '0' + str : str);
    return '#' + pad(r.toString(16)) + pad(g.toString(16)) + pad(b.toString(16));
  };

  // Determine top of chart color based on the peak daily spending tier
  let topColor = '#3b82f6'; // Default to Blue for <= 1
  if (maxDailySpent <= 1) {
    topColor = '#3b82f6';
  } else if (maxDailySpent <= 10) {
    topColor = '#10b981';
  } else if (maxDailySpent <= 100) {
    topColor = '#eab308';
  } else if (maxDailySpent <= 1000) {
    topColor = '#f97316';
  } else {
    topColor = '#ef4444'; // Red for > 1000
  }

  const getGradientStops = (opacity: number) => {
    const stops: React.ReactElement[] = [];
    stops.push(<Stop key="start" offset="0%" stopColor={topColor} stopOpacity={opacity} />);

    if (maxDailySpent > 100000) {
      const offset100k = `${((1 - Math.log(1 + logK * 100000) / logScaleMax) * 100).toFixed(2)}%`;
      stops.push(<Stop key="stop-100k-above" offset={offset100k} stopColor="#ef4444" stopOpacity={opacity} />);
      stops.push(<Stop key="stop-100k-below" offset={offset100k} stopColor="#ef4444" stopOpacity={opacity} />);
    }
    if (maxDailySpent > 10000) {
      const offset10k = `${((1 - Math.log(1 + logK * 10000) / logScaleMax) * 100).toFixed(2)}%`;
      stops.push(<Stop key="stop-10k-above" offset={offset10k} stopColor="#ef4444" stopOpacity={opacity} />);
      stops.push(<Stop key="stop-10k-below" offset={offset10k} stopColor="#ef4444" stopOpacity={opacity} />);
    }
    if (maxDailySpent > 1000) {
      const offset1000 = `${((1 - Math.log(1 + logK * 1000) / logScaleMax) * 100).toFixed(2)}%`;
      stops.push(<Stop key="stop-1000-above" offset={offset1000} stopColor="#ef4444" stopOpacity={opacity} />);
      stops.push(<Stop key="stop-1000-below" offset={offset1000} stopColor="#f97316" stopOpacity={opacity} />);
    }
    if (maxDailySpent > 100) {
      const offset100 = `${((1 - Math.log(1 + logK * 100) / logScaleMax) * 100).toFixed(2)}%`;
      stops.push(<Stop key="stop-100-above" offset={offset100} stopColor="#f97316" stopOpacity={opacity} />);
      stops.push(<Stop key="stop-100-below" offset={offset100} stopColor="#eab308" stopOpacity={opacity} />);
    }
    if (maxDailySpent > 10) {
      const offset10 = `${((1 - Math.log(1 + logK * 10) / logScaleMax) * 100).toFixed(2)}%`;
      stops.push(<Stop key="stop-10-above" offset={offset10} stopColor="#eab308" stopOpacity={opacity} />);
      stops.push(<Stop key="stop-10-below" offset={offset10} stopColor="#10b981" stopOpacity={opacity} />);
    }
    if (maxDailySpent > 1) {
      const offset1 = `${((1 - Math.log(1 + logK * 1) / logScaleMax) * 100).toFixed(2)}%`;
      stops.push(<Stop key="stop-1-above" offset={offset1} stopColor="#10b981" stopOpacity={opacity} />);
      stops.push(<Stop key="stop-1-below" offset={offset1} stopColor="#3b82f6" stopOpacity={opacity} />);
    }

    stops.push(<Stop key="end" offset="100%" stopColor="#3b82f6" stopOpacity={opacity} />);
    return stops;
  };

  const points = dailyData.map((item, index) => {
    const x = paddingLeft + (index * chartWidth) / (daysInMonth - 1);
    const y = svgHeight - paddingBottom - (item.spent > 0 ? (Math.log(1 + logK * item.spent) / logScaleMax) * chartHeight : 0);
    return { x, y };
  });

  const todayIndex = Math.min(now.getDate() - 1, points.length - 1);

  let pastLineD = '';
  let futureLineD = '';
  let pastAreaD = '';

  if (points.length > 0) {
    // Past Line Path (solid curve)
    pastLineD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < todayIndex; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p1.x - (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      pastLineD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Past Area Fill Path (closed)
    if (todayIndex > 0) {
      pastAreaD = pastLineD + ` L ${points[todayIndex].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`;
    } else {
      pastAreaD = `M ${points[0].x} ${points[0].y} L ${points[0].x} ${svgHeight - paddingBottom} Z`;
    }

    // Future Line Path (dashed curve)
    if (todayIndex < points.length - 1) {
      futureLineD = `M ${points[todayIndex].x} ${points[todayIndex].y}`;
      for (let i = todayIndex; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p1.x - (p1.x - p0.x) / 3;
        const cpY2 = p1.y;
        futureLineD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
    }
  }

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
      showAlert('Invalid Amount', 'Please enter a positive number.', 'error');
      return;
    }
    if (!selectedCategory) {
      showAlert('No Category', 'Please select or create a category first.', 'error');
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
        showAlert('Success', 'Expense recorded!', 'success');
      } else {
        showAlert('Error', 'Failed to save transaction to Google Sheets.', 'error');
      }
    } catch (e) {
      showAlert('Error', 'An unexpected error occurred.', 'error');
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {refreshing && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
              <TouchableOpacity
                onPress={() => setShowChart(!showChart)}
                style={[
                  styles.chartToggleBtn,
                  { backgroundColor: showChart ? colors.primary : colors.inputBg }
                ]}
              >
                <Ionicons
                  name={showChart ? "close" : "bar-chart-outline"}
                  size={14}
                  color={showChart ? colors.primaryInverse : colors.text}
                />
              </TouchableOpacity>
            </View>
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

          {/* Collapsible Daily Spending Chart */}
          {showChart && (
            <View style={styles.chartContainer}>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.chartHeaderRow}>
                <Text style={[styles.breakdownTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {isLineView ? "Daily Trend (Logarithmic)" : "Daily Spending (Linear)"}
                </Text>

                {/* Visual view toggle pills */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    onPress={() => { if (!isLineView) toggleChartView(); }}
                    style={[
                      styles.miniTab,
                      isLineView && { backgroundColor: colors.primary }
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniTabText,
                        { color: isLineView ? colors.primaryInverse : colors.textSecondary }
                      ]}
                    >
                      Trend
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { if (isLineView) toggleChartView(); }}
                    style={[
                      styles.miniTab,
                      !isLineView && { backgroundColor: colors.primary }
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniTabText,
                        { color: !isLineView ? colors.primaryInverse : colors.textSecondary }
                      ]}
                    >
                      Bars
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.comparisonWrapper}>
                {/* Scrollable Bar Chart View (Animate-able) */}
                <Animated.View
                  style={[
                    styles.animContainer,
                    {
                      opacity: chartTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                      transform: [
                        { scale: chartTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }) }
                      ],
                      position: isLineView ? 'absolute' : 'relative',
                      pointerEvents: isLineView ? 'none' : 'auto',
                    }
                  ]}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartScrollContent}
                  >
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={toggleChartView}
                      style={{ flexDirection: 'row', alignItems: 'flex-end' }}
                    >
                      {dailyData.map((item, index) => {
                        const showDivider = item.isSunday && index < dailyData.length - 1;

                        return (
                          <React.Fragment key={item.day}>
                            <View
                              style={[
                                styles.chartColumn,
                                item.isWeekend && { backgroundColor: colors.inputBg + '40' }
                              ]}
                            >
                              <Text style={[styles.barAmount, { color: colors.textSecondary }]}>
                                {item.spent > 0 ? `${item.spent.toFixed(0)}` : ''}
                              </Text>

                              <View style={styles.barTrack}>
                                {item.spent > 0 && (
                                  <View
                                    style={[
                                      styles.barActive,
                                      {
                                        height: `${Math.max(item.percentage, 5)}%`,
                                        backgroundColor: item.isWeekend ? colors.warning : colors.accent,
                                      },
                                    ]}
                                  />
                                )}
                              </View>

                              <Text
                                style={[
                                  styles.dayLabel,
                                  { color: colors.text },
                                  item.isWeekend && { color: colors.warning, fontWeight: '700' }
                                ]}
                              >
                                {item.day}
                              </Text>
                              <Text
                                style={[
                                  styles.weekdayLabel,
                                  { color: colors.textSecondary },
                                  item.isWeekend && { color: colors.warning, fontWeight: '700' }
                                ]}
                              >
                                {item.weekdayName}
                              </Text>
                            </View>

                            {showDivider && (
                              <View style={[styles.weekDivider, { borderColor: colors.border }]} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TouchableOpacity>
                  </ScrollView>
                </Animated.View>

                {/* SVG Line Curve View (Animate-able) */}
                <Animated.View
                  style={[
                    styles.animContainer,
                    {
                      opacity: chartTransition,
                      transform: [
                        { scale: chartTransition.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }
                      ],
                      position: isLineView ? 'relative' : 'absolute',
                      pointerEvents: isLineView ? 'auto' : 'none',
                    }
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={toggleChartView}
                    style={styles.svgChartContainer}
                  >
                    <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                      <Defs>
                        {/* Gradient for area fill under the curve (soft opacity) */}
                        <LinearGradient
                          id="lineGrad"
                          x1="0"
                          y1={svgHeight - paddingBottom - chartHeight}
                          x2="0"
                          y2={svgHeight - paddingBottom}
                          gradientUnits="userSpaceOnUse"
                        >
                          {getGradientStops(0.3)}
                        </LinearGradient>

                        {/* Gradient for the solid curve line (full opacity) */}
                        <LinearGradient
                          id="strokeGrad"
                          x1="0"
                          y1={svgHeight - paddingBottom - chartHeight}
                          x2="0"
                          y2={svgHeight - paddingBottom}
                          gradientUnits="userSpaceOnUse"
                        >
                          {getGradientStops(1)}
                        </LinearGradient>
                      </Defs>

                      {/* Weekend background highlights */}
                      {dailyData.map((item, index) => {
                        if (!item.isWeekend) return null;
                        const x = paddingLeft + (index * chartWidth) / (daysInMonth - 1);
                        const colWidth = chartWidth / (daysInMonth - 1);
                        return (
                          <Rect
                            key={`line-weekend-bg-${item.day}`}
                            x={x - colWidth / 2}
                            y={5}
                            width={colWidth}
                            height={svgHeight - paddingBottom - 5}
                            fill="#fef08a"
                            opacity={isDark ? 0.12 : 0.22}
                          />
                        );
                      })}

                      {/* Filled Area under the curve (Past segment only) */}
                      {pastAreaD ? <Path d={pastAreaD} fill="url(#lineGrad)" /> : null}

                      {/* Vertical Y-axis line */}
                      <Line
                        x1={paddingLeft}
                        y1={svgHeight - paddingBottom - chartHeight}
                        x2={paddingLeft}
                        y2={svgHeight - paddingBottom}
                        stroke={colors.border}
                        strokeWidth={1}
                      />

                      {/* Y-axis labels */}
                      <SvgText
                        x={paddingLeft - 6}
                        y={svgHeight - paddingBottom + 3}
                        fontSize={8}
                        fontWeight="600"
                        fill={colors.textSecondary}
                        textAnchor="end"
                      >
                        0
                      </SvgText>

                      {/* Minor logarithmic grid lines (very fine background lines) */}
                      {minorGridLines.map((val) => {
                        const y = svgHeight - paddingBottom - (Math.log(1 + logK * val) / logScaleMax) * chartHeight;
                        return (
                          <Line
                            key={`minor-grid-${val}`}
                            x1={paddingLeft}
                            y1={y}
                            x2={svgWidth - paddingRight}
                            y2={y}
                            stroke={colors.primary}
                            strokeWidth={0.5}
                            opacity={isDark ? 0.22 : 0.32}
                          />
                        );
                      })}

                      {/* Logarithmic threshold lines & labels */}
                      {logThresholds.map((T) => {
                        const y = svgHeight - paddingBottom - (Math.log(1 + logK * T) / logScaleMax) * chartHeight;
                        return (
                          <G key={`log-threshold-${T}`}>
                            <Line
                              x1={paddingLeft}
                              y1={y}
                              x2={svgWidth - paddingRight}
                              y2={y}
                              stroke={colors.primary}
                              strokeWidth={1}
                              opacity={0.65}
                            />
                            <SvgText
                              x={paddingLeft - 6}
                              y={y + 3}
                              fontSize={8}
                              fontWeight="700"
                              fill={colors.primary}
                              textAnchor="end"
                            >
                              {T}
                            </SvgText>
                          </G>
                        );
                      })}

                      <SvgText
                        x={paddingLeft - 6}
                        y={svgHeight - paddingBottom - chartHeight + 3}
                        fontSize={8}
                        fontWeight="600"
                        fill={colors.primary}
                        textAnchor="end"
                      >
                        {maxDailySpent.toFixed(0)}
                      </SvgText>

                      {/* Bottom axis line */}
                      <Line
                        x1={paddingLeft}
                        y1={svgHeight - paddingBottom}
                        x2={svgWidth - paddingRight}
                        y2={svgHeight - paddingBottom}
                        stroke={colors.border}
                        strokeWidth={1}
                      />

                      {/* Top axis line */}
                      <Line
                        x1={paddingLeft}
                        y1={svgHeight - paddingBottom - chartHeight}
                        x2={svgWidth - paddingRight}
                        y2={svgHeight - paddingBottom - chartHeight}
                        stroke={colors.border}
                        strokeWidth={0.8}
                        strokeDasharray="4 4"
                      />

                      {/* Grid lines removed to let the banded gradient visually define regions */}

                      {/* Vertical week dividers right after Sunday */}
                      {dailyData.map((item, index) => {
                        const showDivider = item.isSunday && index < dailyData.length - 1;
                        if (!showDivider) return null;
                        const x = paddingLeft + (index * chartWidth) / (daysInMonth - 1);
                        const colWidth = chartWidth / (daysInMonth - 1);
                        return (
                          <Line
                            key={`line-week-div-${item.day}`}
                            x1={x + colWidth / 2}
                            y1={5}
                            x2={x + colWidth / 2}
                            y2={svgHeight - paddingBottom}
                            stroke={colors.border}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                          />
                        );
                      })}

                      {/* Timeline axis ruler dots for each day */}
                      {dailyData.map((item, index) => {
                        const x = paddingLeft + (index * chartWidth) / (daysInMonth - 1);
                        const isToday = index === todayIndex;
                        return (
                          <Circle
                            key={`axis-dot-${item.day}`}
                            cx={x}
                            cy={svgHeight - paddingBottom}
                            r={isToday ? 2.5 : 1.2}
                            fill={isToday ? colors.primary : colors.border}
                          />
                        );
                      })}

                      {/* Today vertical indicator line & text label */}
                      {points[todayIndex] ? (
                        <G key="today-indicator">
                          <Line
                            x1={points[todayIndex].x}
                            y1={5}
                            x2={points[todayIndex].x}
                            y2={svgHeight - paddingBottom}
                            stroke={colors.primary}
                            strokeWidth={1.5}
                            strokeDasharray="2 2"
                          />
                          <SvgText
                            x={points[todayIndex].x}
                            y={15}
                            fontSize={8}
                            fontWeight="800"
                            fill={colors.primary}
                            textAnchor="middle"
                          >
                            Today ({now.getDate()})
                          </SvgText>
                        </G>
                      ) : null}

                      {/* The Line Curve Path (Past: Solid) */}
                      {pastLineD ? (
                        <Path
                          d={pastLineD}
                          fill="none"
                          stroke="url(#strokeGrad)"
                          strokeWidth={2.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ) : null}

                      {/* The Line Curve Path (Future: Dashed) */}
                      {futureLineD ? (
                        <Path
                          d={futureLineD}
                          fill="none"
                          stroke="url(#strokeGrad)"
                          strokeWidth={2.2}
                          strokeDasharray="3 3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={0.65}
                        />
                      ) : null}

                      {/* Data points (dots) */}
                      {points.map((pt, index) => {
                        const item = dailyData[index];
                        if (item.spent === 0) return null;

                        // Determine dot color to match discrete spending tier
                        let dotColor = '#3b82f6';
                        if (item.spent <= 1) {
                          dotColor = '#3b82f6';
                        } else if (item.spent <= 10) {
                          dotColor = '#10b981';
                        } else if (item.spent <= 100) {
                          dotColor = '#eab308';
                        } else if (item.spent <= 1000) {
                          dotColor = '#f97316';
                        } else {
                          dotColor = '#ef4444';
                        }

                        return (
                          <G key={`line-pt-${item.day}`}>
                            <Circle
                              cx={pt.x}
                              cy={pt.y}
                              r={4.5}
                              fill={dotColor}
                            />
                            <Circle
                              cx={pt.x}
                              cy={pt.y}
                              r={2}
                              fill={colors.primaryInverse}
                            />
                          </G>
                        );
                      })}

                      {/* Axis labels */}
                      {dailyData.map((item, index) => {
                        const isFirst = index === 0;
                        const isLast = index === dailyData.length - 1;
                        const isSunday = item.isSunday;
                        const shouldShowLabel = isFirst || isLast || isSunday;

                        if (!shouldShowLabel) return null;

                        const x = paddingLeft + (index * chartWidth) / (daysInMonth - 1);
                        return (
                          <G key={`line-label-${item.day}`}>
                            <SvgText
                              x={x}
                              y={svgHeight - 14}
                              fontSize={9}
                              fontWeight={isSunday ? "700" : "500"}
                              fill={item.isWeekend ? colors.warning : colors.textSecondary}
                              textAnchor="middle"
                            >
                              {item.day}
                            </SvgText>
                            <SvgText
                              x={x}
                              y={svgHeight - 4}
                              fontSize={8}
                              fontWeight={isSunday ? "700" : "500"}
                              fill={item.isWeekend ? colors.warning : colors.textSecondary}
                              textAnchor="middle"
                            >
                              {item.weekdayName}
                            </SvgText>
                          </G>
                        );
                      })}
                    </Svg>
                  </TouchableOpacity>
                </Animated.View>
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
  chartToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    marginTop: 16,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartScrollContent: {
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  chartColumn: {
    width: 32,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  barAmount: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    height: 12,
    textAlign: 'center',
  },
  barTrack: {
    height: 100,
    width: 10,
    justifyContent: 'flex-end',
    marginBottom: 6,
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barActive: {
    width: '100%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  weekdayLabel: {
    fontSize: 8,
    fontWeight: '600',
  },
  weekDivider: {
    width: 1,
    height: 120,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  svgChartContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: 8,
    padding: 2,
  },
  miniTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniTabText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  comparisonWrapper: {
    position: 'relative',
    width: '100%',
    minHeight: 165,
  },
  animContainer: {
    width: '100%',
  },
});
