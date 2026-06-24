import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, getPersianDate, isSameDay, generateLast14Days } from '../utils';
import { PARENT_CATEGORIES } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = 24;
const CALENDAR_ITEM_WIDTH = 68;

const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
  'credit-card': 'credit-card', monitor: 'monitor', gift: 'gift', coffee: 'coffee',
  truck: 'truck', 'shopping-bag': 'shopping-bag', home: 'home', 'file-text': 'file-text',
  film: 'film', activity: 'activity', zap: 'zap', bus: 'bus', plane: 'plane',
};

interface HomeScreenProps {
  onEdit: () => void;
}

export default function HomeScreen({ onEdit }: HomeScreenProps) {
  const {
    totalBalance, monthlyIncome, monthlyExpense, transactions, budgets,
    deleteTransaction, setEditingTransactionId, categories, userProfile,
  } = useFinance();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const calendarDays = useMemo(() => generateLast14Days(), []);

  const categoryExpenses = useMemo(() => {
    const now = new Date();
    const exps: Record<string, number> = {};
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (tx.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        exps[tx.categoryId] = (exps[tx.categoryId] || 0) + tx.amount;
      }
    });
    return exps;
  }, [transactions]);

  const parentExpenses = useMemo(() => {
    const now = new Date();
    const exps: Record<string, number> = { loans_installments: 0, savings_investments: 0, essentials: 0 };
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (tx.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (cat?.parentCategoryId) exps[cat.parentCategoryId] = (exps[cat.parentCategoryId] || 0) + tx.amount;
      }
    });
    return exps;
  }, [transactions, categories]);

  const budgetItems = useMemo(() => {
    const items: { id: string; name: string; spent: number; limit: number; percentage: number; color: string }[] = [];
    Object.entries(budgets).forEach(([catId, rawLimit]) => {
      const limit = Number(rawLimit);
      if (limit <= 0) return;
      const parentCat = PARENT_CATEGORIES.find(p => p.id === catId);
      if (parentCat) {
        const spent = parentExpenses[catId] || 0;
        items.push({ id: catId, name: parentCat.name, spent, limit, percentage: (spent / limit) * 100, color: parentCat.color });
      } else {
        const spent = categoryExpenses[catId] || 0;
        const cat = categories.find(c => c.id === catId);
        if (cat) items.push({ id: catId, name: cat.name, spent, limit, percentage: (spent / limit) * 100, color: cat.color });
      }
    });
    return items.sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categoryExpenses, parentExpenses, categories]);

  const dailyStats = useMemo(() => {
    let inc = 0, exp = 0;
    transactions.forEach(t => {
      if (selectedDate && isSameDay(new Date(t.date), selectedDate)) {
        if (t.type === 'income') inc += t.amount;
        else exp += t.amount;
      }
    });
    return { income: inc, expense: exp };
  }, [transactions, selectedDate]);

  const displayTransactions = useMemo(() => {
    if (!selectedDate) return transactions;
    return transactions.filter(tx => isSameDay(new Date(tx.date), selectedDate));
  }, [selectedDate, transactions]);

  const isToday = isSameDay(selectedDate, new Date());
  const selectedDateFull = selectedDate ? getPersianDate(selectedDate).full : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>سلام، روز بخیر</Text>
          <Text style={styles.userName}>{userProfile.name} عزیز</Text>
        </View>
        <View style={styles.avatar}>
          <Feather name="user" size={24} color="#2563eb" />
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceDeco1} />
        <View style={styles.balanceDeco2} />
        <Text style={styles.balanceLabel}>موجودی کل</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <View style={[styles.balanceIcon, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
              <Feather name="arrow-down-right" size={18} color="#6ee7b7" style={{ transform: [{ rotate: '180deg' }] }} />
            </View>
            <View>
              <Text style={styles.balanceItemLabel}>درآمد این ماه</Text>
              <Text style={styles.balanceItemValue}>{formatCurrency(monthlyIncome, true)}</Text>
            </View>
          </View>
          <View style={styles.balanceDivider} />
          <View style={[styles.balanceItem, { justifyContent: 'flex-end' }]}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.balanceItemLabel}>هزینه این ماه</Text>
              <Text style={styles.balanceItemValue}>{formatCurrency(monthlyExpense, true)}</Text>
            </View>
            <View style={[styles.balanceIcon, { backgroundColor: 'rgba(244,63,94,0.2)' }]}>
              <Feather name="arrow-up-right" size={18} color="#fda4af" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <Feather name="calendar" size={16} color="#3b82f6" />
          <Text style={styles.calendarTitle}>تقویم روزانه</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
          {calendarDays.map((date, i) => {
            const s = isSameDay(date, selectedDate);
            const t = isSameDay(date, new Date());
            const pd = getPersianDate(date);
            return (
              <TouchableOpacity key={i} style={[styles.calendarItem, s && styles.calendarItemActive]}
                onPress={() => setSelectedDate(date)} activeOpacity={0.7}>
                <Text style={[styles.calendarDayName, s && styles.calendarTextActive]}>
                  {t ? 'امروز' : pd.dayName}
                </Text>
                <Text style={[styles.calendarDayNum, s && styles.calendarTextActive]}>
                  {pd.dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedDate && (
        <View style={styles.dailySummary}>
          <View style={styles.dailyCard}>
            <Feather name="arrow-down-right" size={20} color="#10b981" />
            <View>
              <Text style={styles.dailyLabel}>دریافتی روز</Text>
              <Text style={[styles.dailyAmount, { color: '#10b981' }]}>{formatCurrency(dailyStats.income, true)}</Text>
            </View>
          </View>
          <View style={styles.dailyCard}>
            <Feather name="arrow-up-right" size={20} color="#f43f5e" />
            <View>
              <Text style={styles.dailyLabel}>پرداختی روز</Text>
              <Text style={[styles.dailyAmount, { color: '#f43f5e' }]}>{formatCurrency(dailyStats.expense, true)}</Text>
            </View>
          </View>
        </View>
      )}

      {budgetItems.length > 0 && (
        <View style={styles.budgetSummarySection}>
          <View style={styles.budgetSummaryHeader}>
            <Feather name="pie-chart" size={16} color="#2563eb" />
            <Text style={styles.budgetSummaryTitle}>بودجه ماه جاری</Text>
          </View>
          {budgetItems.map(item => (
            <View key={item.id} style={styles.budgetSummaryItem}>
              <View style={styles.budgetSummaryRow}>
                <Text style={styles.budgetSummaryName} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.budgetSummaryPct, item.percentage >= 100 && { color: '#ef4444' }]}>
                  {item.percentage.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.budgetSummaryBarBg}>
                <View style={[styles.budgetSummaryBarFill, {
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: item.percentage >= 100 ? '#ef4444' : item.percentage >= 80 ? '#f97316' : '#10b981',
                }]} />
              </View>
              <View style={styles.budgetSummaryStats}>
                <Text style={styles.budgetSummaryStat}>
                  هزینه: {formatCurrency(item.spent, true)}
                </Text>
                <Text style={styles.budgetSummaryStat}>
                  باقی‌مانده: {item.limit > item.spent ? formatCurrency(item.limit - item.spent, true) : '0'}
                </Text>
                <Text style={styles.budgetSummaryStat}>
                  سقف: {formatCurrency(item.limit, true)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.transactionsSection}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>تراکنش‌های روز</Text>
          <Text style={styles.transactionsDate}>{isToday ? 'امروز' : selectedDateFull}</Text>
        </View>

        {displayTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={24} color="#d1d5db" />
            <Text style={styles.emptyText}>تراکنشی در این تاریخ ثبت نشده</Text>
          </View>
        ) : (
          displayTransactions.slice(0, 10).map(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            const iconName = (cat?.icon && iconMap[cat.icon]) ? iconMap[cat.icon] : 'credit-card';
            const isInc = tx.type === 'income';
            return (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: cat?.color ? `${cat.color}26` : '#f3f4f6' }]}>
                    <Feather name={iconName} size={22} color={cat?.color || '#6b7280'} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName} numberOfLines={1}>{tx.note || cat?.name}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                  </View>
                  <Text style={[styles.txAmount, isInc && { color: '#10b981' }]}>
                    {isInc ? '+' : '-'}{formatCurrency(tx.amount, true)}
                  </Text>
                </View>
                <View style={styles.txActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => {
                    setEditingTransactionId(tx.id);
                    onEdit();
                  }}>
                    <Feather name="edit" size={12} color="#2563eb" />
                    <Text style={styles.editBtnText}>ویرایش</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTransaction(tx.id)}>
                    <Feather name="trash-2" size={12} color="#ef4444" />
                    <Text style={styles.deleteBtnText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { fontFamily: 'Vazirmatn_400Regular', flex: 1, backgroundColor: '#f8fafc'},
  content: { fontFamily: 'Vazirmatn_400Regular', padding: CONTENT_PADDING, paddingBottom: 140},

  header: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8},
  greeting: { fontSize: 13, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium' },
  userName: { fontSize: 20, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  avatar: { fontFamily: 'Vazirmatn_400Regular', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(219,234,254,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff'},

  balanceCard: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#4f46e5', borderRadius: 32, padding: 24, marginBottom: 32,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    overflow: 'hidden',
  },
  balanceDeco1: { fontFamily: 'Vazirmatn_400Regular', position: 'absolute', right: -24, top: -24, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.08)'},
  balanceDeco2: { fontFamily: 'Vazirmatn_400Regular', position: 'absolute', left: -24, bottom: 0, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.06)'},
  balanceLabel: { fontSize: 13, color: 'rgba(219,234,254,0.8)', fontFamily: 'Vazirmatn_500Medium', marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontFamily: 'Vazirmatn_700Bold', color: '#fff', marginBottom: 24 },
  balanceRow: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, alignItems: 'center', gap: 12},
  balanceItem: { fontFamily: 'Vazirmatn_400Regular', flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8},
  balanceIcon: { fontFamily: 'Vazirmatn_400Regular', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  balanceItemLabel: { fontSize: 11, color: 'rgba(219,234,254,0.8)', fontFamily: 'Vazirmatn_400Regular' },
  balanceItemValue: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },
  balanceDivider: { fontFamily: 'Vazirmatn_400Regular', width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)'},

  budgetSummarySection: { fontFamily: 'Vazirmatn_400Regular', marginBottom: 24, gap: 12 },
  budgetSummaryHeader: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  budgetSummaryTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  budgetSummaryItem: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  budgetSummaryRow: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetSummaryName: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', flex: 1 },
  budgetSummaryPct: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280' },
  budgetSummaryBarBg: { fontFamily: 'Vazirmatn_400Regular', height: 8, borderRadius: 4, backgroundColor: '#f3f4f6', overflow: 'hidden', marginBottom: 8 },
  budgetSummaryBarFill: { fontFamily: 'Vazirmatn_400Regular', height: 8, borderRadius: 4 },
  budgetSummaryStats: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between' },
  budgetSummaryStat: { fontSize: 10, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium' },

  calendarSection: { fontFamily: 'Vazirmatn_400Regular', marginBottom: 24},
  calendarHeader: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  calendarTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  calendarStrip: { fontFamily: 'Vazirmatn_400Regular', gap: 12, paddingBottom: 4},
  calendarItem: { fontFamily: 'Vazirmatn_400Regular', width: CALENDAR_ITEM_WIDTH, height: 64, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  calendarItemActive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#2563eb', borderColor: 'transparent', transform: [{ scale: 1.05}] },
  calendarDayName: { fontSize: 10, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', marginBottom: 2 },
  calendarDayNum: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  calendarTextActive: { fontFamily: 'Vazirmatn_400Regular', color: '#fff'},

  dailySummary: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', gap: 16, marginBottom: 24},
  dailyCard: { fontFamily: 'Vazirmatn_400Regular', flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  dailyLabel: { fontSize: 10, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium' },
  dailyAmount: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold' },

  transactionsSection: { fontFamily: 'Vazirmatn_400Regular', flex: 1},
  transactionsHeader: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16},
  transactionsTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  transactionsDate: { fontSize: 12, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium', paddingBottom: 2 },

  emptyState: { fontFamily: 'Vazirmatn_400Regular', alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e5e7eb', gap: 12},
  emptyText: { fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af' },

  txCard: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  txRow: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 16},
  txIcon: { fontFamily: 'Vazirmatn_400Regular', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  txInfo: { fontFamily: 'Vazirmatn_400Regular', flex: 1},
  txName: { fontSize: 15, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 2 },
  txDate: { fontSize: 12, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium' },
  txAmount: { fontSize: 15, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  txActions: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingLeft: 64},
  editBtn: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8},
  editBtnText: { fontSize: 11, color: '#2563eb', fontFamily: 'Vazirmatn_500Medium' },
  deleteBtn: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8},
  deleteBtnText: { fontSize: 11, color: '#ef4444', fontFamily: 'Vazirmatn_500Medium' },
});
