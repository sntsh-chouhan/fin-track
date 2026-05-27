import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Transaction } from '../services/sheetService';
import { Ionicons } from '@expo/vector-icons';

export const TransactionsScreen: React.FC = () => {
  const { transactions, budgets, deleteTransaction, refreshing, refreshData, currencySymbol } = useApp();
  const { colors } = useTheme();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction from Google Sheets?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteTransaction(id);
            if (!success) {
              Alert.alert('Error', 'Failed to delete transaction.');
            }
          },
        },
      ]
    );
  };

  // Filter transactions based on search, category, and type tab
  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory =
      !selectedCategory || tx.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'essential' && tx.isEssential) ||
      (typeFilter === 'non-essential' && !tx.isEssential);

    const matchesSearch =
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.subCategory && tx.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.amount.toString().includes(searchQuery);

    return matchesCategory && matchesType && matchesSearch;
  });

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search amount, category, description..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Categories filter chips */}
      <View style={styles.filterContainer}>
        <ScrollViewHorizontal
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
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
              backgroundColor: typeFilter === 'essential' ? colors.success + '20' : colors.inputBg,
              borderColor: typeFilter === 'essential' ? colors.success : colors.border,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={12}
            color={typeFilter === 'essential' ? colors.success : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.typeChipText,
              { color: typeFilter === 'essential' ? colors.success : colors.text },
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
              backgroundColor: typeFilter === 'non-essential' ? colors.accent + '20' : colors.inputBg,
              borderColor: typeFilter === 'non-essential' ? colors.accent : colors.border,
            },
          ]}
        >
          <Ionicons
            name="gift"
            size={12}
            color={typeFilter === 'non-essential' ? colors.accent : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.typeChipText,
              { color: typeFilter === 'non-essential' ? colors.accent : colors.text },
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
    </View>
  );
};

// Sub-component for horizontal filters to avoid wrapping issue
const ScrollViewHorizontal: React.FC<{
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  categories: string[];
  colors: any;
}> = ({ selectedCategory, setSelectedCategory, categories, colors }) => {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroll}
    >
      <TouchableOpacity
        onPress={() => setSelectedCategory(null)}
        style={[
          styles.chip,
          {
            backgroundColor: selectedCategory === null ? colors.primary : colors.inputBg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { color: selectedCategory === null ? colors.primaryInverse : colors.text },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
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
});
