import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Reminder, Category, UserProfile, BackupData, DEFAULT_CATEGORIES } from '../types';
import { generateId } from '../utils';

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
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  editingTransactionId: string | null;
  setEditingTransactionId: (id: string | null) => void;
  getBackupData: () => BackupData;
  importBackup: (data: any) => boolean;
  isLoaded: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const KEYS = {
  transactions: '@finance/transactions',
  categories: '@finance/categories',
  budgets: '@finance/budgets',
  reminders: '@finance/reminders',
  profile: '@finance/profile',
} as const;

const DEFAULT_PROFILE: UserProfile = { name: 'کاربر', phone: '', email: '' };
const DEFAULT_REMINDER: Reminder = { id: '1', title: 'اجاره خانه', amount: 5000000, dueDate: 1, type: 'monthly', isActive: true, notificationInterval: 0 };

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
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [txData, catData, budData, remData, profData] = await Promise.all([
          AsyncStorage.getItem(KEYS.transactions),
          AsyncStorage.getItem(KEYS.categories),
          AsyncStorage.getItem(KEYS.budgets),
          AsyncStorage.getItem(KEYS.reminders),
          AsyncStorage.getItem(KEYS.profile),
        ]);
        if (txData) setTransactions(sortByDateDesc(JSON.parse(txData)));
        if (catData) setCategories(JSON.parse(catData));
        if (budData) setBudgets(JSON.parse(budData));
        if (remData) setReminders(JSON.parse(remData));
        if (profData) setUserProfile(JSON.parse(profData));
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(KEYS.transactions, JSON.stringify(transactions)).catch(() => {});
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(KEYS.categories, JSON.stringify(categories)).catch(() => {});
  }, [categories, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(KEYS.budgets, JSON.stringify(budgets)).catch(() => {});
  }, [budgets, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(KEYS.reminders, JSON.stringify(reminders)).catch(() => {});
  }, [reminders, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(KEYS.profile, JSON.stringify(userProfile)).catch(() => {});
  }, [userProfile, isLoaded]);

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

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const completeReminder = useCallback((id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
        .filter(r => !(r.type === 'onetime' && r.completed))
    );
  }, []);

  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);

  const getBackupData = useCallback((): BackupData => {
    return {
      transactions, budgets, categories, reminders, userProfile,
      exportedAt: new Date().toISOString()
    };
  }, [transactions, budgets, categories, reminders, userProfile]);

  const importBackup = useCallback((data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(sortByDateDesc(data.transactions));
      if (data.budgets && typeof data.budgets === 'object') setBudgets(data.budgets);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.reminders && Array.isArray(data.reminders)) setReminders(data.reminders);
      if (data.userProfile && typeof data.userProfile === 'object') setUserProfile(data.userProfile);
      return true;
    } catch { return false; }
  }, []);

  const value: FinanceContextType = {
    transactions, addTransaction, updateTransaction, deleteTransaction,
    totalBalance, monthlyIncome, monthlyExpense,
    budgets, setCategoryBudget,
    categories, addCategory, updateCategory, deleteCategory,
    userProfile, updateUserProfile,
    reminders, addReminder, deleteReminder, toggleReminder, completeReminder,
    editingTransactionId, setEditingTransactionId,
    getBackupData, importBackup, isLoaded,
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
