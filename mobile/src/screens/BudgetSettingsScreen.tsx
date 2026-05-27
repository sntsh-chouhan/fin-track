import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const BudgetSettingsScreen: React.FC = () => {
  const { budgets, saveCategory, deleteCategory, refreshing, refreshData, currencySymbol } = useApp();
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

  const handleCreateCategory = async () => {
    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      Alert.alert('Empty Name', 'Please enter a category name.');
      return;
    }
    const numBudget = parseFloat(newCatBudget);
    if (isNaN(numBudget) || numBudget < 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget amount (0 or more).');
      return;
    }

    // Check if category already exists
    if (budgets.some((b) => b.category.toLowerCase() === trimmedName.toLowerCase())) {
      Alert.alert('Duplicate Category', 'A category with this name already exists.');
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
        Alert.alert('Success', `Category "${trimmedName}" created!`);
      } else {
        Alert.alert('Error', 'Failed to save category to Google Sheets.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateBudget = async (category: string) => {
    const numBudget = parseFloat(editBudgetVal);
    if (isNaN(numBudget) || numBudget < 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget amount.');
      return;
    }

    setIsUpdating(true);
    try {
      const success = await saveCategory(category, numBudget);
      if (success) {
        setEditingCategory(null);
        setEditBudgetVal('');
      } else {
        Alert.alert('Error', 'Failed to update budget.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditBudget = (category: string, currentBudget: number) => {
    setEditingCategory(category);
    setEditBudgetVal(currentBudget.toString());
  };

  const handleDeleteCategory = (category: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the category "${category}"? This will remove its budget tracking from Google Sheets.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCategory(category);
            if (!success) {
              Alert.alert('Error', 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  return (
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
            const isEditing = editingCategory === item.category;
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
                {isEditing ? (
                  /* Edit State */
                  <View style={styles.editRow}>
                    <View style={styles.editLeft}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {item.category}
                      </Text>
                      <View style={[styles.editInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                        <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>{currencySymbol}</Text>
                        <TextInput
                          style={[styles.editInput, { color: colors.text }]}
                          value={editBudgetVal}
                          onChangeText={setEditBudgetVal}
                          keyboardType="decimal-pad"
                          autoFocus
                          maxLength={10}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.actionGroup}>
                      <TouchableOpacity
                        onPress={() => handleUpdateBudget(item.category)}
                        disabled={isUpdating}
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={colors.primaryInverse} />
                        ) : (
                          <Ionicons name="checkmark" size={18} color={colors.primaryInverse} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingCategory(null)}
                        style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
                      >
                        <Ionicons name="close" size={18} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Normal State */
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
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
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
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLeft: {
    flex: 1,
    marginRight: 8,
  },
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  dollarSign: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
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
