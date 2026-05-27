import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Vibration,
  Alert,
  Keyboard,
  Animated,
  PanResponder,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const ShakeExpenseModal: React.FC = () => {
  const { sheetUrl, isLocked, budgets, addTransaction, currencySymbol } = useApp();
  const { colors } = useTheme();

  // Modal display state
  const [modalVisible, setModalVisible] = useState(false);

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

  // Accelerometer subscription
  useEffect(() => {
    // Only listen for shakes if a sheet is connected and the app is not passcode-locked
    if (!sheetUrl || isLocked) return;

    let lastShakeTime = 0;
    // Set update frequency to 100ms
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // Calculate total force magnitude (excluding gravity at rest, which is ~1g)
      const force = Math.sqrt(x * x + y * y + z * z);
      
      // A force > 2.4g represents a firm shake
      if (force > 2.4) {
        const now = Date.now();
        // Throttle shake events to prevent double triggers within 3 seconds
        if (now - lastShakeTime > 3000 && !modalVisible) {
          lastShakeTime = now;
          Vibration.vibrate(150); // Haptic feedback
          setModalVisible(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [sheetUrl, isLocked, modalVisible]);

  // Set default category when modal opens
  useEffect(() => {
    if (modalVisible && budgets.length > 0 && !selectedCategory) {
      setSelectedCategory(budgets[0].category);
    }
  }, [modalVisible, budgets]);

  const handleClose = () => {
    setModalVisible(false);
    setAmount('');
    setSubCategory('');
    setDescription('');
    setShowOptional(false);
    setIsAmountFocused(false);
    setIsEssential(true);
  };

  const handleSubmit = async () => {
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
    Keyboard.dismiss();
    try {
      const success = await addTransaction(
        numAmount,
        selectedCategory,
        subCategory.trim(),
        description.trim(),
        isEssential
      );

      if (success) {
        handleClose();
        Alert.alert('Success', 'Expense recorded via shake!');
      } else {
        Alert.alert('Error', 'Failed to save transaction.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="flash" size={18} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.modalTitle, { color: colors.primary }]}>Quick Shake Add</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
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
                autoFocus={true}
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

            {/* Category selection */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {budgets.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 8 }}>
                  No categories found.
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
                  placeholder="e.g. Coffee, Snacks"
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
                  placeholder="e.g. Snack bar at station"
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={100}
                />
              </View>
            )}

            {/* Actions */}
            <TouchableOpacity
              onPress={handleSubmit}
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
                  Save Expense
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    paddingBottom: 8,
    marginBottom: 24,
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
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
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
});
