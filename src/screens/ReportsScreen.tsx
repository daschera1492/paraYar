import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthYear, formatShortMonth, gregorianToShamsi, SHAMSI_MONTH_NAMES } from '../utils';
import PeriodPicker from '../components/PeriodPicker';
import AccountPicker from '../components/AccountPicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 24 * 2 - 24 * 2;

const iconMap: Record<string, any> = {
  'credit-card': 'credit-card', monitor: 'monitor', gift: 'gift', coffee: 'coffee',
  truck: 'truck', 'shopping-bag': 'shopping-bag', home: 'home', 'file-text': 'file-text',
  film: 'film', activity: 'activity', zap: 'zap',
};

type Period = 'month' | '3months' | '6months' | 'year';
type ChartType = 'bar' | 'line';

export default function ReportsScreen() {
  const { transactions, categories, accounts } = useFinance();
  const [period, setPeriod] = useState<Period>('month');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [chartType, setChartType] = useState<ChartType>('bar');

  const now = new Date();
  const shamsiNow = gregorianToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(t => t.accountId === selectedAccount);
    }
    switch (period) {
      case 'month':
        return filtered.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
      case '3months':
        return filtered.filter(t => {
          const d = new Date(t.date);
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return d >= threeMonthsAgo && d <= now;
        });
      case '6months':
        return filtered.filter(t => {
          const d = new Date(t.date);
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return d >= sixMonthsAgo && d <= now;
        });
      case 'year':
        return filtered.filter(t => {
          const d = new Date(t.date);
          return d.getFullYear() === now.getFullYear();
        });
      default:
        return filtered;
    }
  }, [transactions, period, selectedAccount]);

  const monthlyExpense = filteredTransactions
    .filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const netSavings = monthlyIncome - monthlyExpense;

  const expenseData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      grouped[t.categoryId] = (grouped[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(grouped)
      .map(([catId, value]) => {
        const cat = categories.find(c => c.id === catId);
        return { name: cat?.name || 'نامشخص', value, icon: cat?.icon || 'credit-card', color: cat?.color || '#6b7280' };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const incomeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'income').forEach(t => {
      grouped[t.categoryId] = (grouped[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(grouped)
      .map(([catId, value]) => {
        const cat = categories.find(c => c.id === catId);
        return { name: cat?.name || 'نامشخص', value, icon: cat?.icon || 'credit-card', color: cat?.color || '#6b7280' };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const chartData = useMemo(() => {
    const monthsToShow = period === 'year' ? 12 : period === '6months' ? 6 : period === '3months' ? 3 : 1;
    if (monthsToShow <= 1) return [];

    const keys: string[] = [];
    const dataMap: Record<string, { name: string; income: number; expense: number }> = {};
    for (let i = 0; keys.length < monthsToShow && i < 400; i += 15) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = formatMonthYear(d.toISOString());
      if (!keys.includes(key)) {
        keys.unshift(key);
        dataMap[key] = { name: formatShortMonth(d), income: 0, expense: 0 };
      }
    }
    filteredTransactions.forEach(t => {
      const key = formatMonthYear(t.date);
      if (dataMap[key]) {
        if (t.type === 'income') dataMap[key].income += t.amount;
        else dataMap[key].expense += t.amount;
      }
    });
    return keys.map(k => dataMap[k]);
  }, [filteredTransactions, period]);

  if (transactions.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Feather name="pie-chart" size={48} color="#d1d5db" />
        <Text style={{ color: '#9ca3af', marginTop: 16, fontFamily: 'Vazirmatn_500Medium' }}>داده‌ای برای نمایش گزارش وجود ندارد</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>گزارش‌های مالی</Text>
      </View>

      <View style={styles.pickersRow}>
        <PeriodPicker selected={period} onSelect={setPeriod} />
        <View style={{ flex: 1 }}>
          <AccountPicker label="حساب" selectedId={selectedAccount} onSelect={setSelectedAccount} showAll />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.statLabel}>درآمد</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{formatCurrency(monthlyIncome, true)}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#f43f5e' }]}>
          <Text style={styles.statLabel}>هزینه</Text>
          <Text style={[styles.statValue, { color: '#f43f5e' }]}>{formatCurrency(monthlyExpense, true)}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: netSavings >= 0 ? '#10b981' : '#ef4444' }]}>
          <Text style={styles.statLabel}>خالص</Text>
          <Text style={[styles.statValue, { color: netSavings >= 0 ? '#10b981' : '#ef4444' }]}>
            {formatCurrency(netSavings, true)}
          </Text>
        </View>
      </View>

      {chartData.length > 1 && (
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>نمودار مقایسه</Text>
            <View style={styles.chartTypeToggle}>
              <TouchableOpacity style={[styles.chartTypeBtn, chartType === 'bar' && styles.chartTypeBtnActive]}
                onPress={() => setChartType('bar')}>
                <Text style={[styles.chartTypeText, chartType === 'bar' && { color: '#2563eb' }]}>میله‌ای</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chartTypeBtn, chartType === 'line' && styles.chartTypeBtnActive]}
                onPress={() => setChartType('line')}>
                <Text style={[styles.chartTypeText, chartType === 'line' && { color: '#2563eb' }]}>خطی</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.chartContainer}>
            {chartType === 'bar' ? (
              <BarChart
                data={{
                  labels: chartData.map(d => d.name),
                  datasets: [
                    { data: chartData.map(d => d.income), color: () => '#10b981' },
                    { data: chartData.map(d => d.expense), color: () => '#f43f5e' },
                  ],
                }}
                width={CHART_WIDTH}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  labelColor: () => '#6b7280',
                  barPercentage: 0.5,
                  propsForBackgroundLines: { strokeDasharray: '3 3', stroke: '#f3f4f6'},
                }}
                fromZero
                showBarTops={false}
                withCustomBarColorFromData
                flatColor
                style={{ borderRadius: 16 }}
              />
            ) : (
              <LineChart
                data={{
                  labels: chartData.map(d => d.name),
                  datasets: [
                    { data: chartData.map(d => d.income), color: () => '#10b981', strokeWidth: 2 },
                    { data: chartData.map(d => d.expense), color: () => '#f43f5e', strokeWidth: 2 },
                  ],
                }}
                width={CHART_WIDTH}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  labelColor: () => '#6b7280',
                  propsForBackgroundLines: { strokeDasharray: '3 3', stroke: '#f3f4f6'},
                }}
                fromZero
                bezier
                style={{ borderRadius: 16 }}
              />
            )}
          </View>
        </View>
      )}

      <View style={styles.tabSection}>
        <View style={styles.tabHeader}>
          <View style={styles.tabBtn}>
            <Text style={styles.tabBtnTitle}>جزئیات هزینه‌ها</Text>
          </View>
        </View>

        {expenseData.length === 0 ? (
          <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: 16 }}>
            هزینه‌ای ثبت نشده است
          </Text>
        ) : (
          expenseData.map((item, idx) => {
            const iconName = iconMap[item.icon] || 'credit-card';
            const pct = monthlyExpense > 0 ? Math.round((item.value / monthlyExpense) * 100) : 0;
            return (
              <View key={idx} style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: item.color + '26' }]}>
                  <Feather name={iconName} size={22} color={item.color} />
                </View>
                <View style={styles.breakdownInfo}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownName}>{item.name}</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(item.value, true)}</Text>
                  </View>
                  <View style={styles.breakdownBarBg}>
                    <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {incomeData.length > 0 && (
        <View style={styles.tabSection}>
          <Text style={styles.sectionTitle}>جزئیات درآمدها</Text>
          {incomeData.map((item, idx) => {
            const iconName = iconMap[item.icon] || 'credit-card';
            const pct = monthlyIncome > 0 ? Math.round((item.value / monthlyIncome) * 100) : 0;
            return (
              <View key={idx} style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: item.color + '26' }]}>
                  <Feather name={iconName} size={22} color={item.color} />
                </View>
                <View style={styles.breakdownInfo}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownName}>{item.name}</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(item.value, true)}</Text>
                  </View>
                  <View style={styles.breakdownBarBg}>
                    <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { fontFamily: 'Vazirmatn_400Regular', flex: 1, backgroundColor: '#f8fafc'},
  content: { fontFamily: 'Vazirmatn_400Regular', padding: 24, paddingBottom: 140},
  header: { fontFamily: 'Vazirmatn_400Regular', marginBottom: 8, marginTop: 8},
  headerTitle: { fontSize: 20, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },

  pickersRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: '#f3f4f6' },
  statLabel: { fontSize: 10, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', marginBottom: 4 },
  statValue: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold' },

  tabSection: { marginBottom: 24, gap: 12 },
  tabHeader: { flexDirection: 'row', marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 8 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabBtnTitle: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },

  sectionTitle: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 8 },

  chartSection: { marginBottom: 24 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTypeToggle: { flexDirection: 'row', gap: 4, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4 },
  chartTypeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  chartTypeBtnActive: { backgroundColor: '#fff' },
  chartTypeText: { fontSize: 11, fontFamily: 'Vazirmatn_700Bold', color: '#9ca3af' },
  chartContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center'},

  breakdownItem: { flexDirection: 'row', gap: 16, backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  breakdownIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  breakdownInfo: { flex: 1, justifyContent: 'center'},
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
  breakdownName: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  breakdownValue: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  breakdownBarBg: { height: 6, borderRadius: 3, backgroundColor: '#f3f4f6', overflow: 'hidden'},
  breakdownBarFill: { height: 6, borderRadius: 3},
});
