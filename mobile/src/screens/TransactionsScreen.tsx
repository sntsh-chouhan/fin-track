import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Transaction } from '../services/sheetService';
import { Ionicons } from '@expo/vector-icons';

export const TransactionsScreen: React.FC = () => {
  const {
    transactions,
    budgets,
    deleteTransaction,
    refreshing,
    refreshData,
    currencySymbol,
    showAlert,
    showConfirm,
  } = useApp();
  const { colors } = useTheme();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Amount Filter Popup state (Zero-typing Range filter)
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(Infinity);

  const minPresets = [0, 5, 10, 25, 50, 100, 200, 500, 1000, 2500];
  const maxPresets = [5, 10, 25, 50, 100, 200, 500, 1000, 2500, Infinity];

  const handleMinSelect = (val: number) => {
    setMinAmount(val);
    if (val > maxAmount) {
      setMaxAmount(Infinity);
    }
  };

  const handleMaxSelect = (val: number) => {
    setMaxAmount(val);
    if (val < minAmount) {
      setMinAmount(0);
    }
  };

  const handleResetFilters = () => {
    setMinAmount(0);
    setMaxAmount(Infinity);
  };

  const handleSelectCategory = (cat: string) => {
    if (selectedCategories.length > 1) {
      if (selectedCategories.includes(cat)) {
        const next = selectedCategories.filter((c) => c !== cat);
        setSelectedCategories(next);
      } else {
        setSelectedCategories([...selectedCategories, cat]);
      }
    } else {
      setSelectedCategories([cat]);
    }
  };

  const handleLongPressCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      const next = selectedCategories.filter((c) => c !== cat);
      setSelectedCategories(next);
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };
  const [typeFilter, setTypeFilter] = useState<'all' | 'essential' | 'non-essential'>('all');

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      'Delete Transaction',
      'Are you sure you want to delete this transaction from Google Sheets?',
      async () => {
        const success = await deleteTransaction(id);
        if (!success) {
          showAlert('Error', 'Failed to delete transaction.', 'error');
        }
      }
    );
  };

  // Filter transactions based on search, category, type tab, and amount bounds
  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => cat.toLowerCase() === tx.category.toLowerCase());

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'essential' && tx.isEssential) ||
      (typeFilter === 'non-essential' && !tx.isEssential);

    const matchesSearch =
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.subCategory && tx.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.amount.toString().includes(searchQuery);

    const matchesAmount = tx.amount >= minAmount && tx.amount <= maxAmount;

    return matchesCategory && matchesType && matchesSearch && matchesAmount;
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const totalFilteredSpent = filteredTransactions
    .filter((tx) => {
      try {
        const txDate = new Date(tx.timestamp);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    return (
      <View
        style={[
          styles.transactionItem,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.leftCol}>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {currencySymbol}{item.amount.toFixed(2)}
          </Text>
          <View style={styles.catRow}>
            <Text style={[styles.category, { color: colors.text }]}>{item.category}</Text>
            {item.subCategory ? (
              <Text style={[styles.subCategory, { color: colors.textSecondary }]}>
                {' • '}{item.subCategory}
              </Text>
            ) : null}
            
            {/* Essential/Non-Essential Badge */}
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: item.isEssential ? colors.success + '15' : colors.accent + '15',
                  borderColor: item.isEssential ? colors.success + '30' : colors.accent + '30',
                },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: item.isEssential ? colors.success : colors.accent },
                ]}
              >
                {item.isEssential ? 'Essential' : 'Non-Essential'}
              </Text>
            </View>
          </View>
          {item.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={[styles.deleteBtn, { backgroundColor: colors.inputBg }]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  const isFilterActive = minAmount > 0 || maxAmount < Infinity;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header Row with Funnel Filter */}
      <View style={styles.searchHeaderRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border, flex: 1 }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search category, desc..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: isFilterActive ? colors.accent + '15' : colors.inputBg,
              borderColor: isFilterActive ? colors.accent : colors.border,
            },
          ]}
        >
          <Ionicons
            name={isFilterActive ? 'funnel' : 'funnel-outline'}
            size={18}
            color={isFilterActive ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Categories filter chips */}
      <View style={styles.filterContainer}>
        <ScrollViewHorizontal
          selectedCategories={selectedCategories}
          onSelectCategory={handleSelectCategory}
          onLongPressCategory={handleLongPressCategory}
          onClearCategories={handleClearCategories}
          categories={budgets.map((b) => b.category)}
          colors={colors}
        />
      </View>

      {/* Type filter chips */}
      <View style={styles.typeFilterRow}>
        <TouchableOpacity
          onPress={() => setTypeFilter('all')}
          style={[
            styles.typeChip,
            {
              backgroundColor: typeFilter === 'all' ? colors.primary : colors.inputBg,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.typeChipText,
              { color: typeFilter === 'all' ? colors.primaryInverse : colors.text },
            ]}
          >
            All Types
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTypeFilter('essential')}
          style={[
            styles.typeChip,
            {
              backgroundColor: typeFilter === 'essential' ? colors.success : colors.inputBg,
              borderColor: typeFilter === 'essential' ? colors.success : colors.border,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={12}
            color={typeFilter === 'essential' ? colors.primaryInverse : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.typeChipText,
              { color: typeFilter === 'essential' ? colors.primaryInverse : colors.text },
            ]}
          >
            Essential
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTypeFilter('non-essential')}
          style={[
            styles.typeChip,
            {
              backgroundColor: typeFilter === 'non-essential' ? colors.accent : colors.inputBg,
              borderColor: typeFilter === 'non-essential' ? colors.accent : colors.border,
            },
          ]}
        >
          <Ionicons
            name="gift"
            size={12}
            color={typeFilter === 'non-essential' ? colors.primaryInverse : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.typeChipText,
              { color: typeFilter === 'non-essential' ? colors.primaryInverse : colors.text },
            ]}
          >
            Non-Essential
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={refreshData}
        ListHeaderComponent={
          <View style={[styles.spentCounterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.spentCounterLabel, { color: colors.textSecondary }]}>
              {monthName} Spent (Filtered)
            </Text>
            <Text style={[styles.spentCounterAmount, { color: colors.primary }]}>
              {currencySymbol}{totalFilteredSpent.toFixed(2)}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {refreshing ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No transactions found.
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Amount Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFilterModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Drag Handle */}
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

            {/* Header Row */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Filter by Amount</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
              >
                <Ionicons name="close-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Active Bounds Display */}
            <View style={[styles.boundsSummary, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="calculator-outline" size={16} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.boundsSummaryText, { color: colors.text }]}>
                {!isFilterActive
                  ? 'Showing all amounts'
                  : `Between ${currencySymbol}${minAmount} and ${
                      maxAmount === Infinity ? 'No Limit' : `${currencySymbol}${maxAmount}`
                    }`}
              </Text>
            </View>

            {/* Min Amount Presets */}
            <Text style={[styles.presetSectionTitle, { color: colors.textSecondary }]}>MINIMUM AMOUNT</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetScroll}
              style={styles.presetScrollWrapper}
            >
              {minPresets.map((val) => {
                const isSelected = minAmount === val;
                return (
                  <TouchableOpacity
                    key={`min-${val}`}
                    onPress={() => handleMinSelect(val)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.inputBg,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isSelected ? colors.primaryInverse : colors.text },
                      ]}
                    >
                      {val === 0 ? 'Any' : `${currencySymbol}${val}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Max Amount Presets */}
            <Text style={[styles.presetSectionTitle, { color: colors.textSecondary }]}>MAXIMUM AMOUNT</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetScroll}
              style={styles.presetScrollWrapper}
            >
              {maxPresets.map((val) => {
                const isSelected = maxAmount === val;
                return (
                  <TouchableOpacity
                    key={`max-${val}`}
                    onPress={() => handleMaxSelect(val)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.inputBg,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isSelected ? colors.primaryInverse : colors.text },
                      ]}
                    >
                      {val === Infinity ? 'No Limit' : `${currencySymbol}${val}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleResetFilters}
                style={[styles.actionBtnReset, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
              >
                <Text style={[styles.actionBtnResetText, { color: colors.text }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={[styles.actionBtnApply, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.actionBtnApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Sub-component for horizontal filters to avoid wrapping issue
const ScrollViewHorizontal: React.FC<{
  selectedCategories: string[];
  onSelectCategory: (cat: string) => void;
  onLongPressCategory: (cat: string) => void;
  onClearCategories: () => void;
  categories: string[];
  colors: any;
}> = ({
  selectedCategories,
  onSelectCategory,
  onLongPressCategory,
  onClearCategories,
  categories,
  colors,
}) => {
  const isAllSelected = selectedCategories.length === 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroll}
    >
      <TouchableOpacity
        onPress={onClearCategories}
        style={[
          styles.chip,
          {
            backgroundColor: isAllSelected ? colors.primary : colors.inputBg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { color: isAllSelected ? colors.primaryInverse : colors.text },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {categories.map((cat) => {
        const isSelected = selectedCategories.includes(cat);
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelectCategory(cat)}
            onLongPress={() => onLongPressCategory(cat)}
            delayLongPress={200}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.inputBg,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? colors.primaryInverse : colors.text },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterContainer: {
    height: 48,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  transactionItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  leftCol: {
    flex: 1,
    marginRight: 16,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
  },
  subCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  spentCounterCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spentCounterLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  spentCounterAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 10,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
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
  boundsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  boundsSummaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  presetSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetScrollWrapper: {
    marginBottom: 20,
  },
  presetScroll: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 64,
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  actionBtnReset: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnResetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnApply: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnApplyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
