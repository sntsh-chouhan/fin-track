import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const BudgetSettingsScreen: React.FC = () => {
  const {
    budgets,
    saveCategory,
    deleteCategory,
    refreshing,
    refreshData,
    currencySymbol,
    showAlert,
    showConfirm,
  } = useApp();
  const { colors } = useTheme();

  // Create category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isNewBudgetFocused, setIsNewBudgetFocused] = useState(false);

  // Edit category state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editBudgetVal, setEditBudgetVal] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const editInputRef = useRef<TextInput>(null);

  const handleCreateCategory = async () => {
    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      showAlert('Empty Name', 'Please enter a category name.', 'error');
      return;
    }
    const numBudget = parseFloat(newCatBudget);
    if (isNaN(numBudget) || numBudget < 0) {
      showAlert('Invalid Budget', 'Please enter a valid budget amount (0 or more).', 'error');
      return;
    }

    // Check if category already exists
    if (budgets.some((b) => b.category.toLowerCase() === trimmedName.toLowerCase())) {
      showAlert('Duplicate Category', 'A category with this name already exists.', 'error');
      return;
    }

    setIsCreating(true);
    Keyboard.dismiss();
    try {
      const success = await saveCategory(trimmedName, numBudget);
      if (success) {
        setNewCatName('');
        setNewCatBudget('');
        setIsNewBudgetFocused(false);
        showAlert('Success', `Category "${trimmedName}" created!`, 'success');
      } else {
        showAlert('Error', 'Failed to save category to Google Sheets.', 'error');
      }
    } catch (e) {
      showAlert('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateBudget = async (category: string) => {
    const numBudget = parseFloat(editBudgetVal);
    if (isNaN(numBudget) || numBudget < 0) {
      showAlert('Invalid Budget', 'Please enter a valid budget amount.', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const success = await saveCategory(category, numBudget);
      if (success) {
        setEditingCategory(null);
        setEditBudgetVal('');
      } else {
        showAlert('Error', 'Failed to update budget.', 'error');
      }
    } catch (e) {
      showAlert('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditBudget = (category: string, currentBudget: number) => {
    setEditingCategory(category);
    setEditBudgetVal(currentBudget.toString());
  };

  const handleDeleteCategory = (category: string) => {
    showConfirm(
      'Delete Category',
      `Are you sure you want to delete the category "${category}"? This will remove its budget tracking from Google Sheets.`,
      async () => {
        const success = await deleteCategory(category);
        if (!success) {
          showAlert('Error', 'Failed to delete category.', 'error');
        }
      }
    );
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Create New Category Card */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Create Category</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category Name</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Health, Travel, Subscriptions"
            placeholderTextColor={colors.textSecondary}
            value={newCatName}
            onChangeText={setNewCatName}
            maxLength={20}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Monthly Budget Limit ({currencySymbol})</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
            ]}
            placeholder={isNewBudgetFocused ? "" : "e.g. 200"}
            placeholderTextColor={colors.textSecondary}
            value={newCatBudget}
            onChangeText={setNewCatBudget}
            keyboardType="decimal-pad"
            maxLength={10}
            onFocus={() => setIsNewBudgetFocused(true)}
            onBlur={() => setIsNewBudgetFocused(false)}
          />

          <TouchableOpacity
            onPress={handleCreateCategory}
            disabled={isCreating}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: isCreating ? 0.7 : 1 },
            ]}
          >
            {isCreating ? (
              <ActivityIndicator color={colors.primaryInverse} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.primaryInverse }]}>
                Create Category
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Categories & Budgets List */}
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 0 }]}>
            Manage Budgets
          </Text>
          {refreshing && <ActivityIndicator size="small" color={colors.primary} />}
          {!refreshing && (
            <TouchableOpacity onPress={refreshData}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 8 }]}>
          {budgets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No categories configured yet.
              </Text>
            </View>
          ) : (
            budgets.map((item, index) => {
              return (
                <View
                  key={item.category}
                  style={[
                    styles.categoryRow,
                    {
                      borderBottomWidth: index === budgets.length - 1 ? 0 : 1,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Normal State */}
                  <View style={styles.viewRow}>
                    <View>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {item.category}
                      </Text>
                      <Text style={[styles.categoryBudget, { color: colors.textSecondary }]}>
                        Budget: {currencySymbol}{item.budget.toFixed(2)} / month
                      </Text>
                    </View>

                    <View style={styles.actionGroup}>
                      <TouchableOpacity
                        onPress={() => startEditBudget(item.category, item.budget)}
                        style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
                      >
                        <Ionicons name="pencil" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(item.category)}
                        style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editingCategory !== null}
        onShow={() => {
          setTimeout(() => {
            editInputRef.current?.focus();
          }, 80);
        }}
        onRequestClose={() => {
          if (!isUpdating) setEditingCategory(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            if (!isUpdating) setEditingCategory(null);
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%' }}
            >
              <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleRow}>
                    <Ionicons name="pencil-sharp" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalTitle, { color: colors.primary }]}>Edit Budget</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setEditingCategory(null)}
                    disabled={isUpdating}
                    style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Category Label */}
                <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                  Category: <Text style={{ color: colors.text, fontWeight: '700' }}>{editingCategory}</Text>
                </Text>

                {/* Amount Input */}
                <View style={styles.modalAmountInputContainer}>
                  <Text style={[styles.modalDollarSign, { color: colors.textSecondary }]}>{currencySymbol}</Text>
                  <TextInput
                    ref={editInputRef}
                    style={[styles.modalAmountInput, { color: colors.primary }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={editBudgetVal}
                    onChangeText={setEditBudgetVal}
                    keyboardType="decimal-pad"
                    maxLength={10}
                  />
                </View>

                {/* Actions */}
                <TouchableOpacity
                  onPress={() => editingCategory && handleUpdateBudget(editingCategory)}
                  disabled={isUpdating}
                  style={[
                    styles.submitBtn,
                    { backgroundColor: colors.primary, opacity: isUpdating ? 0.7 : 1 },
                  ]}
                >
                  {isUpdating ? (
                    <ActivityIndicator color={colors.primaryInverse} />
                  ) : (
                    <Text style={[styles.submitBtnText, { color: colors.primaryInverse }]}>
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  categoryRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryBudget: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  categoryLabel: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    paddingBottom: 8,
    marginBottom: 24,
  },
  modalDollarSign: {
    fontSize: 32,
    fontWeight: '600',
    marginRight: 4,
  },
  modalAmountInput: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    padding: 0,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
