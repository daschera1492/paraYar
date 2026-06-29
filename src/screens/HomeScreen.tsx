import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal, Pressable, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, getPersianDate, isSameDay, generateLast14Days,
  gregorianToShamsi, SHAMSI_MONTH_NAMES, calculateGoalProgress, formatShamsiDate } from '../utils';
import { PARENT_CATEGORIES, Reminder, SavingsGoal } from '../types';
import ShamsiDatePicker from '../components/ShamsiDatePicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = 24;
const CALENDAR_ITEM_WIDTH = 68;

const iconMap: Record<string, any> = {
  'credit-card': 'credit-card', monitor: 'monitor', gift: 'gift', coffee: 'coffee',
  truck: 'truck', 'shopping-bag': 'shopping-bag', home: 'home', 'file-text': 'file-text',
  film: 'film', activity: 'activity', zap: 'zap',
};

interface HomeScreenProps {
  onEdit: () => void;
  onToggleDrawer: () => void;
}

export default function HomeScreen({ onEdit, onToggleDrawer }: HomeScreenProps) {
  const {
    totalBalance, monthlyIncome, monthlyExpense, transactions, budgets,
    deleteTransaction, setEditingTransactionId, categories, userProfile,
    reminders, accounts, getAccountBalance, savingsGoals, completeReminder, isReminderDue,
  } = useFinance();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [budgetDetail, setBudgetDetail] = useState<{ id: string; name: string; color: string } | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    let filtered = transactions;
    if (selectedDate) {
      filtered = filtered.filter(tx => isSameDay(new Date(tx.date), selectedDate));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        return tx.note.toLowerCase().includes(q) ||
          String(tx.amount).includes(q) ||
          (cat?.name.toLowerCase().includes(q) ?? false);
      });
    }
    return filtered;
  }, [selectedDate, transactions, searchQuery, categories]);

  const isToday = isSameDay(selectedDate, new Date());
  const selectedDateFull = selectedDate ? getPersianDate(selectedDate).full : '';

  const overdueReminders = reminders.filter(r => r.isActive && isReminderDue(r));

  const reminderLabel = (r: Reminder) => {
    if (r.type === 'monthly') return `روز ${r.dueDate} هر ماه`;
    return `${r.dueDate} ${SHAMSI_MONTH_NAMES[r.dueMonth! - 1]} ${r.dueYear}`;
  };

  const budgetTransactions = useMemo(() => {
    if (!budgetDetail) return [];
    const now = new Date();
    const isParent = PARENT_CATEGORIES.some(p => p.id === budgetDetail.id);
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      if (isParent) {
        const cat = categories.find(c => c.id === tx.categoryId);
        return cat?.parentCategoryId === budgetDetail.id;
      }
      return tx.categoryId === budgetDetail.id;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [budgetDetail, transactions, categories]);

  const accountSummaries = useMemo(() => {
    return accounts.map(a => ({
      ...a,
      balance: getAccountBalance(a.id),
    }));
  }, [accounts, getAccountBalance]);

  const activeGoals = savingsGoals.filter(g => g.currentAmount < g.targetAmount);

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>سلام، روز بخیر</Text>
          <Text style={styles.userName}>{userProfile.name} عزیز</Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={onToggleDrawer} activeOpacity={0.7}>
          <Feather name="menu" size={24} color="#2563eb" />
        </TouchableOpacity>
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

      <View style={styles.sectionRow}>
        <View style={styles.sectionHeader}>
          <Feather name="layers" size={16} color="#2563eb" />
          <Text style={styles.sectionTitle}>حساب‌ها</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsStrip}>
        {accountSummaries.slice(0, 5).map(a => (
          <View key={a.id} style={[styles.accountMiniCard, { borderLeftColor: a.color, borderLeftWidth: 3 }]}>
            <Text style={styles.accountMiniName} numberOfLines={1}>{a.name}</Text>
            <Text style={[styles.accountMiniBalance, { color: a.balance >= 0 ? '#10b981' : '#ef4444' }]}>
              {formatCurrency(a.balance, true)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {activeGoals.length > 0 && (
        <View style={styles.goalsPreview}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionHeader}>
              <Feather name="flag" size={16} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>اهداف پس‌انداز</Text>
            </View>
          </View>
          {activeGoals.slice(0, 2).map(g => {
            const pct = calculateGoalProgress(g.currentAmount, g.targetAmount);
            return (
              <View key={g.id} style={styles.goalMiniCard}>
                <View style={[styles.goalMiniIcon, { backgroundColor: g.color + '20' }]}>
                  <Feather name={iconMap[g.icon] || 'flag'} size={16} color={g.color} />
                </View>
                <View style={styles.goalMiniInfo}>
                  <Text style={styles.goalMiniName}>{g.name}</Text>
                  <Text style={styles.goalMiniProgress}>{pct}%</Text>
                </View>
                <View style={styles.goalMiniBarBg}>
                  <View style={[styles.goalMiniBarFill, { width: `${pct}%`, backgroundColor: g.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="calendar" size={16} color="#3b82f6" />
            <Text style={styles.calendarTitle}>تقویم روزانه</Text>
          </View>
          <TouchableOpacity style={styles.calendarOpenBtn} onPress={() => setShowCalendarPicker(true)} activeOpacity={0.7}>
            <Feather name="chevron-down" size={16} color="#3b82f6" />
            <Text style={styles.calendarOpenText}>{formatShamsiDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
          {calendarDays.map((date, i) => {
            const s = isSameDay(date, selectedDate);
            const t = isSameDay(date, new Date());
            const pd = getPersianDate(date);
            return (
              <Pressable key={i} style={[styles.calendarItem, s && styles.calendarItemActive]}
                onPress={() => setSelectedDate(date)}>
                <Text style={[styles.calendarDayName, s && styles.calendarTextActive]}>
                  {t ? 'امروز' : pd.dayName}
                </Text>
                <Text style={[styles.calendarDayNum, s && styles.calendarTextActive]}>
                  {pd.dayNum}
                </Text>
              </Pressable>
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

      {overdueReminders.length > 0 && (
        <View style={styles.overdueSection}>
          <View style={styles.overdueHeader}>
            <Feather name="alert-triangle" size={16} color="#ef4444" />
            <Text style={styles.overdueTitle}>یادآورهای سررسید شده</Text>
          </View>
          {overdueReminders.map(r => (
            <View key={r.id} style={styles.overdueCard}>
              <View style={styles.overdueIconBox}>
                <Feather name="bell" size={20} color="#ef4444" />
              </View>
              <View style={styles.overdueInfo}>
                <Text style={styles.overdueName}>{r.title}</Text>
                <Text style={styles.overdueMeta}>{reminderLabel(r)}</Text>
              </View>
              {r.amount ? (
                <Text style={styles.overdueAmount}>{r.amount.toLocaleString('en-US')} تومان</Text>
              ) : null}
              <TouchableOpacity style={styles.overduePaidBtn}
                onPress={() => completeReminder(r.id)}>
                <Feather name="check" size={14} color="#fff" />
                <Text style={styles.overduePaidText}>پرداخت شد</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {budgetItems.length > 0 && (
        <View style={styles.budgetSummarySection}>
          <View style={styles.budgetSummaryHeader}>
            <Feather name="pie-chart" size={16} color="#2563eb" />
            <Text style={styles.budgetSummaryTitle}>بودجه ماه جاری</Text>
          </View>
          {budgetItems.slice(0, 4).map(item => (
            <TouchableOpacity key={item.id} activeOpacity={0.7}
              onPress={() => setBudgetDetail({ id: item.id, name: item.name, color: item.color })}>
              <View style={styles.budgetSummaryItem}>
                <View style={styles.budgetSummaryRow}>
                  <Text style={styles.budgetSummaryName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.budgetSummaryRight}>
                    <Text style={[styles.budgetSummaryPct, item.percentage >= 100 && { color: '#ef4444' }]}>
                      {item.percentage.toFixed(0)}%
                    </Text>
                    <Feather name="chevron-left" size={16} color="#d1d5db" />
                  </View>
                </View>
                <View style={styles.budgetSummaryBarBg}>
                  <View style={[styles.budgetSummaryBarFill, {
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.percentage >= 100 ? '#ef4444' : item.percentage >= 80 ? '#f97316' : '#10b981',
                  }]} />
                </View>
                <View style={styles.budgetSummaryStats}>
                  <Text style={styles.budgetSummaryStat}>هزینه: {formatCurrency(item.spent, true)}</Text>
                  <Text style={styles.budgetSummaryStat}>باقی‌مانده: {item.limit > item.spent ? formatCurrency(item.limit - item.spent, true) : '0'}</Text>
                  <Text style={styles.budgetSummaryStat}>سقف: {formatCurrency(item.limit, true)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.transactionsSection}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>تراکنش‌های روز</Text>
          <Text style={styles.transactionsDate}>{isToday ? 'امروز' : selectedDateFull}</Text>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#9ca3af" />
          <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery}
            placeholder="جستجوی تراکنش..." placeholderTextColor="#9ca3af" />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
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
            const acct = accounts.find(a => a.id === tx.accountId);
            return (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: cat?.color ? `${cat.color}26` : '#f3f4f6' }]}>
                    <Feather name={iconName} size={22} color={cat?.color || '#6b7280'} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName} numberOfLines={1}>{tx.note || cat?.name}</Text>
                    <Text style={styles.txDate}>
                      {formatDate(tx.date)}
                      {acct ? ` • ${acct.name}` : ''}
                    </Text>
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

      <ShamsiDatePicker visible={showCalendarPicker} date={selectedDate}
        onConfirm={(d) => { setSelectedDate(d); setShowCalendarPicker(false); }}
        onCancel={() => setShowCalendarPicker(false)} />

      <Modal visible={!!budgetDetail} transparent animationType="slide">
        <View style={styles.bdOverlay}>
          <View style={styles.bdContainer}>
            <View style={styles.bdHeader}>
              <View style={styles.bdHeaderLeft}>
                <TouchableOpacity onPress={() => setBudgetDetail(null)} style={styles.bdBack}>
                  <Feather name="arrow-right" size={22} color="#6b7280" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.bdTitle}>{budgetDetail?.name}</Text>
                  <Text style={styles.bdSubtitle}>تراکنش‌های ماه جاری</Text>
                </View>
              </View>
              <Text style={styles.bdCount}>{budgetTransactions.length} تراکنش</Text>
            </View>

            <ScrollView style={styles.bdList} contentContainerStyle={styles.bdListContent} showsVerticalScrollIndicator={false}>
              {budgetTransactions.length === 0 ? (
                <View style={styles.bdEmpty}>
                  <Feather name="file-text" size={32} color="#d1d5db" />
                  <Text style={styles.bdEmptyText}>تراکنشی در این بودجه ثبت نشده</Text>
                </View>
              ) : (
                budgetTransactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const iconName = (cat?.icon && iconMap[cat.icon]) ? iconMap[cat.icon] : 'credit-card';
                  return (
                    <View key={tx.id} style={styles.bdTxCard}>
                      <View style={[styles.bdTxIcon, { backgroundColor: cat?.color ? `${cat.color}26` : '#f3f4f6' }]}>
                        <Feather name={iconName} size={20} color={cat?.color || '#6b7280'} />
                      </View>
                      <View style={styles.bdTxInfo}>
                        <Text style={styles.bdTxName} numberOfLines={1}>{tx.note || cat?.name}</Text>
                        <Text style={styles.bdTxDate}>{formatDate(tx.date)}</Text>
                      </View>
                      <Text style={[styles.bdTxAmount, tx.type === 'income' && { color: '#10b981' }]}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, true)}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { fontFamily: 'Vazirmatn_400Regular', flex: 1, backgroundColor: '#f8fafc'},
  content: { fontFamily: 'Vazirmatn_400Regular', padding: CONTENT_PADDING, paddingBottom: 140},

  header: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8},
  greeting: { fontSize: 13, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium' },
  userName: { fontSize: 20, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  menuBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(219,234,254,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe'},

  balanceCard: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#4f46e5', borderRadius: 32, padding: 24, marginBottom: 24,
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

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  seeAll: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#2563eb' },

  accountsStrip: { gap: 12, paddingBottom: 8, marginBottom: 16 },
  accountMiniCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, minWidth: 140,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  accountMiniName: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280', marginBottom: 4 },
  accountMiniBalance: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold' },

  goalsPreview: { marginBottom: 20, gap: 10 },
  goalMiniCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  goalMiniIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalMiniInfo: { flex: 1 },
  goalMiniName: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  goalMiniProgress: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#8b5cf6' },
  goalMiniBarBg: { height: 6, borderRadius: 3, backgroundColor: '#f3f4f6', flex: 1, overflow: 'hidden', marginTop: 4 },
  goalMiniBarFill: { height: 6, borderRadius: 3 },

  budgetSummarySection: { marginBottom: 24, gap: 12 },
  budgetSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  budgetSummaryTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  budgetSummaryItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  budgetSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetSummaryName: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', flex: 1 },
  budgetSummaryRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budgetSummaryPct: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280' },
  budgetSummaryBarBg: { height: 8, borderRadius: 4, backgroundColor: '#f3f4f6', overflow: 'hidden', marginBottom: 8 },
  budgetSummaryBarFill: { height: 8, borderRadius: 4 },
  budgetSummaryStats: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetSummaryStat: { fontSize: 10, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium' },

  calendarSection: { marginBottom: 24},
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  calendarTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  calendarOpenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  calendarOpenText: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#2563eb' },
  calendarStrip: { gap: 12, paddingBottom: 4},
  calendarItem: { width: CALENDAR_ITEM_WIDTH, height: 64, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  calendarItemActive: { backgroundColor: '#2563eb', borderColor: 'transparent', transform: [{ scale: 1.05}] },
  calendarDayName: { fontSize: 10, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', marginBottom: 2 },
  calendarDayNum: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  calendarTextActive: { color: '#fff'},

  dailySummary: { flexDirection: 'row', gap: 16, marginBottom: 24},
  dailyCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  dailyLabel: { fontSize: 10, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium' },
  dailyAmount: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold' },

  transactionsSection: { flex: 1},
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16},
  transactionsTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  transactionsDate: { fontSize: 12, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium', paddingBottom: 2 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e5e7eb', gap: 12},
  emptyText: { fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Vazirmatn_400Regular', color: '#1f2937', height: 20, padding: 0 },

  txCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 16},
  txIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  txInfo: { flex: 1},
  txName: { fontSize: 15, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 2 },
  txDate: { fontSize: 12, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium' },
  txAmount: { fontSize: 15, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  txActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingLeft: 64},
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8},
  editBtnText: { fontSize: 11, color: '#2563eb', fontFamily: 'Vazirmatn_500Medium' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8},
  deleteBtnText: { fontSize: 11, color: '#ef4444', fontFamily: 'Vazirmatn_500Medium' },

  overdueSection: { marginBottom: 24, gap: 10 },
  overdueHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  overdueTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#ef4444' },
  overdueCard: { backgroundColor: '#fef2f2', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#fecaca' },
  overdueIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  overdueInfo: { flex: 1 },
  overdueName: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#991b1b' },
  overdueMeta: { fontSize: 11, fontFamily: 'Vazirmatn_500Medium', color: '#b91c1c', marginTop: 2 },
  overdueAmount: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#991b1b' },
  overduePaidBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  overduePaidText: { fontSize: 11, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },

  bdOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  bdContainer: { backgroundColor: '#f8fafc', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', minHeight: '50%' },
  bdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  bdHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bdBack: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  bdTitle: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  bdSubtitle: { fontSize: 11, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', marginTop: 2 },
  bdCount: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280', backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bdList: { flex: 1 },
  bdListContent: { padding: 24, paddingBottom: 40, gap: 12 },
  bdEmpty: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  bdEmptyText: { fontSize: 13, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af' },
  bdTxCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  bdTxIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bdTxInfo: { flex: 1 },
  bdTxName: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  bdTxDate: { fontSize: 11, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', marginTop: 2 },
  bdTxAmount: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
});
