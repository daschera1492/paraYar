import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import {
  Transaction, Reminder, Category, UserProfile, BackupData, DEFAULT_CATEGORIES,
  Account, RecurringTransaction, SavingsGoal, Debt, AppLock, DEFAULT_ACCOUNTS,
} from '../types';
import { generateId, gregorianToShamsi, SHAMSI_MONTH_NAMES, formatCurrency } from '../utils';
import { updateStatusBar } from '../services/StatusBarService';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: UserProfile) => void;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  budgets: Record<string, number>;
  setCategoryBudget: (categoryId: string, amount: number) => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, reminder: Omit<Reminder, 'id'>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  isReminderDue: (r: Reminder) => boolean;
  editingTransactionId: string | null;
  setEditingTransactionId: (id: string | null) => void;
  getBackupData: () => BackupData;
  importBackup: (data: any) => boolean;
  isLoaded: boolean;
  // Accounts
  accounts: Account[];
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, a: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  getAccountBalance: (accountId: string) => number;
  // Recurring
  recurringTransactions: RecurringTransaction[];
  addRecurring: (r: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurring: (id: string, r: Omit<RecurringTransaction, 'id'>) => void;
  deleteRecurring: (id: string) => void;
  processRecurring: () => void;
  // Goals
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (g: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, g: Omit<SavingsGoal, 'id'>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  // Debts
  debts: Debt[];
  addDebt: (d: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, d: Omit<Debt, 'id'>) => void;
  deleteDebt: (id: string) => void;
  payDebt: (id: string, amount: number) => void;
  // Lock
  appLock: AppLock;
  setAppLock: (lock: AppLock) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const KEYS = {
  transactions: '@finance/transactions',
  categories: '@finance/categories',
  budgets: '@finance/budgets',
  reminders: '@finance/reminders',
  profile: '@finance/profile',
  accounts: '@finance/accounts',
  recurring: '@finance/recurring',
  goals: '@finance/goals',
  debts: '@finance/debts',
  lock: '@finance/lock',
} as const;

const DEFAULT_PROFILE: UserProfile = { name: 'کاربر', phone: '', email: '' };
const DEFAULT_REMINDER: Reminder = { id: '1', title: 'اجاره خانه', amount: 5000000, dueDate: 1, type: 'monthly', isActive: true, notificationInterval: 0 };
const DEFAULT_LOCK: AppLock = { enabled: false, useBiometric: false };

function sortByDateDesc(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [reminders, setReminders] = useState<Reminder[]>([DEFAULT_REMINDER]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [appLock, setAppLockState] = useState<AppLock>(DEFAULT_LOCK);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [
          txData, catData, budData, remData, profData,
          accData, recData, goalData, debtData, lockData,
        ] = await Promise.all([
          AsyncStorage.getItem(KEYS.transactions),
          AsyncStorage.getItem(KEYS.categories),
          AsyncStorage.getItem(KEYS.budgets),
          AsyncStorage.getItem(KEYS.reminders),
          AsyncStorage.getItem(KEYS.profile),
          AsyncStorage.getItem(KEYS.accounts),
          AsyncStorage.getItem(KEYS.recurring),
          AsyncStorage.getItem(KEYS.goals),
          AsyncStorage.getItem(KEYS.debts),
          AsyncStorage.getItem(KEYS.lock),
        ]);
        if (txData) {
          let txs: Transaction[] = JSON.parse(txData);
          // migration v1.3 → v1.4: assign accountId to old transactions
          let migrated = false;
          txs = txs.map(t => {
            if (!t.accountId) { t.accountId = 'cash_default'; migrated = true; }
            return t;
          });
          setTransactions(sortByDateDesc(txs));
          if (migrated) AsyncStorage.setItem(KEYS.transactions, JSON.stringify(txs));
        }
        if (catData) setCategories(JSON.parse(catData));
        if (budData) setBudgets(JSON.parse(budData));
        if (remData) setReminders(JSON.parse(remData));
        if (profData) setUserProfile(JSON.parse(profData));
        if (accData) setAccounts(JSON.parse(accData));
        if (recData) setRecurringTransactions(JSON.parse(recData));
        if (goalData) setSavingsGoals(JSON.parse(goalData));
        if (debtData) setDebts(JSON.parse(debtData));
        if (lockData) setAppLockState(JSON.parse(lockData));
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (key: string, data: any) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, []);

  useEffect(() => { if (isLoaded) persist(KEYS.transactions, transactions); }, [transactions, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.categories, categories); }, [categories, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.budgets, budgets); }, [budgets, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.reminders, reminders); }, [reminders, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.profile, userProfile); }, [userProfile, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.accounts, accounts); }, [accounts, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.recurring, recurringTransactions); }, [recurringTransactions, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.goals, savingsGoals); }, [savingsGoals, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.debts, debts); }, [debts, isLoaded]);
  useEffect(() => { if (isLoaded) persist(KEYS.lock, appLock); }, [appLock, isLoaded]);

  useEffect(() => {
    if (!isLoaded || Platform.OS !== 'android') return;
    const total = transactions.reduce((s, t) => s + t.amount * (t.type === 'income' ? 1 : -1), 0);
    const monthStr = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter(t => t.date.startsWith(monthStr));
    const inc = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    try {
      NativeModules.FinanceWidget?.updateWidget({
        balance: `${total.toLocaleString()} تومان`,
        income: inc.toLocaleString(),
        expense: exp.toLocaleString(),
      });
    } catch {}
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const now = new Date();
    const s = gregorianToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const dateText = `${s.day} ${SHAMSI_MONTH_NAMES[s.month - 1]} ${s.year}`;
    const todayInc = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.toDateString() === now.toDateString();
    }).reduce((sum, t) => sum + t.amount, 0);
    const todayExp = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.toDateString() === now.toDateString();
    }).reduce((sum, t) => sum + t.amount, 0);
    const activeReminders = reminders
      .filter(r => r.isActive && isReminderDue(r))
      .map(r => `${r.title}${r.amount ? ` - ${r.amount.toLocaleString()} تومان` : ''}`);
    updateStatusBar({
      dateText,
      dayNum: String(s.day),
      income: todayInc.toLocaleString(),
      expense: todayExp.toLocaleString(),
      reminders: activeReminders.length > 0 ? activeReminders.slice(0, 5) : [],
    });
  }, [transactions, reminders, isLoaded]);

  function isReminderDue(r: Reminder): boolean {
    const now = new Date();
    const s = gregorianToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayOrdinal = s.year * 10000 + s.month * 100 + s.day;
    let dueOrdinal: number;
    if (r.type === 'monthly') {
      dueOrdinal = s.year * 10000 + s.month * 100 + r.dueDate;
    } else {
      if (!r.dueYear || !r.dueMonth) return false;
      dueOrdinal = r.dueYear * 10000 + r.dueMonth * 100 + r.dueDate;
    }
    if (todayOrdinal !== dueOrdinal) return false;
    if (r.completed && r.lastCompletedShamsi) {
      const currentMonth = `${s.year}-${String(s.month).padStart(2, '0')}`;
      if (r.lastCompletedShamsi === currentMonth) return false;
    }
    return true;
  }

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: generateId() };
    setTransactions(prev => sortByDateDesc([...prev, newTx]));
  }, []);

  const updateTransaction = useCallback((id: string, tx: Omit<Transaction, 'id'>) => {
    setTransactions(prev => sortByDateDesc(prev.map(t => t.id === id ? { ...tx, id } : t)));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...cat, id: generateId() }]);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCategory = useCallback((id: string, cat: Omit<Category, 'id'>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...cat, id } : c));
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
  }, []);

  const setCategoryBudget = useCallback((categoryId: string, amount: number) => {
    setBudgets(prev => ({ ...prev, [categoryId]: amount }));
  }, []);

  const addReminder = useCallback((r: Omit<Reminder, 'id'>) => {
    setReminders(prev => [...prev, { ...r, id: generateId() }]);
  }, []);

  const updateReminder = useCallback((id: string, r: Omit<Reminder, 'id'>) => {
    setReminders(prev => prev.map(x => x.id === id ? { ...r, id } : x));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const completeReminder = useCallback((id: string) => {
    const now = new Date();
    const s = gregorianToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const shamsiMonth = `${s.year}-${String(s.month).padStart(2, '0')}`;
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, completed: true, lastCompletedShamsi: shamsiMonth } : r)
    );
  }, []);

  const addAccount = useCallback((a: Omit<Account, 'id'>) => {
    setAccounts(prev => [...prev, { ...a, id: generateId() }]);
  }, []);

  const updateAccount = useCallback((id: string, a: Omit<Account, 'id'>) => {
    setAccounts(prev => prev.map(x => x.id === id ? { ...a, id } : x));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setTransactions(prev => prev.filter(t => t.accountId !== id));
  }, []);

  const getAccountBalance = useCallback((accountId: string): number => {
    const acct = accounts.find(a => a.id === accountId);
    if (!acct) return 0;
    let balance = acct.initialBalance;
    transactions.filter(t => t.accountId === accountId).forEach(t => {
      balance += t.type === 'income' ? t.amount : -t.amount;
    });
    return balance;
  }, [accounts, transactions]);

  const addRecurring = useCallback((r: Omit<RecurringTransaction, 'id'>) => {
    setRecurringTransactions(prev => [...prev, { ...r, id: generateId() }]);
  }, []);

  const updateRecurring = useCallback((id: string, r: Omit<RecurringTransaction, 'id'>) => {
    setRecurringTransactions(prev => prev.map(x => x.id === id ? { ...r, id } : x));
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
  }, []);

  const processRecurring = useCallback(() => {
    const now = new Date();
    recurringTransactions.forEach(rt => {
      if (!rt.isActive) return;
      const nextDate = new Date(rt.startDate);
      while (nextDate <= now) {
        addTransaction({
          amount: rt.amount,
          type: rt.type,
          categoryId: rt.categoryId,
          note: rt.note + ' (مکرر)',
          date: nextDate.toISOString(),
          accountId: rt.accountId,
        });
        switch (rt.frequency) {
          case 'daily': nextDate.setDate(nextDate.getDate() + rt.intervalValue); break;
          case 'weekly': nextDate.setDate(nextDate.getDate() + rt.intervalValue * 7); break;
          case 'monthly': nextDate.setMonth(nextDate.getMonth() + rt.intervalValue); break;
          case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + rt.intervalValue); break;
        }
        if (rt.endDate && nextDate > new Date(rt.endDate)) break;
      }
      setRecurringTransactions(prev => prev.map(r =>
        r.id === rt.id ? { ...r, startDate: nextDate.toISOString() } : r
      ));
    });
  }, [recurringTransactions, addTransaction]);

  const addSavingsGoal = useCallback((g: Omit<SavingsGoal, 'id'>) => {
    setSavingsGoals(prev => [...prev, { ...g, id: generateId() }]);
  }, []);

  const updateSavingsGoal = useCallback((id: string, g: Omit<SavingsGoal, 'id'>) => {
    setSavingsGoals(prev => prev.map(x => x.id === id ? { ...g, id } : x));
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const contributeToGoal = useCallback((id: string, amount: number) => {
    setSavingsGoals(prev => prev.map(g =>
      g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
    ));
    if (amount > 0) {
      addTransaction({
        amount,
        type: 'expense',
        categoryId: 'savings_goal',
        note: 'واریز به هدف پس‌انداز',
        date: new Date().toISOString(),
        accountId: '',
      });
    }
  }, [addTransaction]);

  const addDebt = useCallback((d: Omit<Debt, 'id'>) => {
    setDebts(prev => [...prev, { ...d, id: generateId() }]);
  }, []);

  const updateDebt = useCallback((id: string, d: Omit<Debt, 'id'>) => {
    setDebts(prev => prev.map(x => x.id === id ? { ...d, id } : x));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  const payDebt = useCallback((id: string, amount: number) => {
    setDebts(prev => prev.map(d => {
      if (d.id !== id) return d;
      const newRemaining = Math.max(d.remainingAmount - amount, 0);
      const isPaid = newRemaining <= 0;
      return { ...d, remainingAmount: newRemaining, isPaid };
    }));
    if (amount > 0) {
      addTransaction({
        amount,
        type: amount > 0 ? 'expense' : 'income',
        categoryId: 'debt_payment',
        note: 'پرداخت بدهی',
        date: new Date().toISOString(),
        accountId: '',
      });
    }
  }, [addTransaction]);

  const setAppLock = useCallback((lock: AppLock) => {
    setAppLockState(lock);
  }, []);

  const now = new Date();
  const currentMonthTransactions = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }), [transactions]);

  const monthlyIncome = useMemo(() => currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0), [currentMonthTransactions]);

  const monthlyExpense = useMemo(() => currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0), [currentMonthTransactions]);

  const totalBalance = useMemo(() => transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0), [transactions]);

  const getBackupData = useCallback((): BackupData => {
    return {
      transactions, budgets, categories, reminders, userProfile,
      accounts, recurringTransactions, savingsGoals, debts, appLock,
      exportedAt: new Date().toISOString()
    };
  }, [transactions, budgets, categories, reminders, userProfile, accounts, recurringTransactions, savingsGoals, debts, appLock]);

  const importBackup = useCallback((data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(sortByDateDesc(data.transactions));
      if (data.budgets && typeof data.budgets === 'object') setBudgets(data.budgets);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.reminders && Array.isArray(data.reminders)) setReminders(data.reminders);
      if (data.userProfile && typeof data.userProfile === 'object') setUserProfile(data.userProfile);
      if (data.accounts && Array.isArray(data.accounts)) setAccounts(data.accounts);
      if (data.recurringTransactions && Array.isArray(data.recurringTransactions)) setRecurringTransactions(data.recurringTransactions);
      if (data.savingsGoals && Array.isArray(data.savingsGoals)) setSavingsGoals(data.savingsGoals);
      if (data.debts && Array.isArray(data.debts)) setDebts(data.debts);
      if (data.appLock && typeof data.appLock === 'object') setAppLockState(data.appLock);
      return true;
    } catch { return false; }
  }, []);

  const value: FinanceContextType = {
    transactions, addTransaction, updateTransaction, deleteTransaction,
    totalBalance, monthlyIncome, monthlyExpense,
    budgets, setCategoryBudget,
    categories, addCategory, updateCategory, deleteCategory,
    userProfile, updateUserProfile,
    reminders, addReminder, updateReminder, deleteReminder, toggleReminder, completeReminder, isReminderDue,
    editingTransactionId, setEditingTransactionId,
    getBackupData, importBackup, isLoaded,
    accounts, addAccount, updateAccount, deleteAccount, getAccountBalance,
    recurringTransactions, addRecurring, updateRecurring, deleteRecurring, processRecurring,
    savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeToGoal,
    debts, addDebt, updateDebt, deleteDebt, payDebt,
    appLock, setAppLock,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}
