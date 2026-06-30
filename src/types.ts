export type TransactionType = 'income' | 'expense';
export type ParentCategoryType = 'loans_installments' | 'savings_investments' | 'essentials';
export type ReminderType = 'monthly' | 'onetime';
export type AccountType = 'bank' | 'cash' | 'card' | 'wallet' | 'savings';
export type DebtType = 'loan' | 'debt';

export interface ParentCategory {
  id: ParentCategoryType;
  name: string;
  color: string;
}

export const PARENT_CATEGORIES: ParentCategory[] = [
  { id: 'loans_installments', name: 'وام و اقساط', color: '#f59e0b' },
  { id: 'savings_investments', name: 'پس‌انداز و سرمایه', color: '#10b981' },
  { id: 'essentials', name: 'هزینه‌های جاری', color: '#3b82f6' }
];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
  accountId: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note: string;
  accountId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalValue: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  parentCategoryId?: ParentCategoryType;
}

export interface Reminder {
  id: string;
  title: string;
  amount?: number;
  dueDate: number;
  dueYear?: number;
  dueMonth?: number;
  type: ReminderType;
  isActive: boolean;
  notificationInterval: number;
  completed?: boolean;
  lastCompletedShamsi?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadlineYear?: number;
  deadlineMonth?: number;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  personName: string;
  type: DebtType;
  amount: number;
  remainingAmount: number;
  description: string;
  date: string;
  dueYear?: number;
  dueMonth?: number;
  dueDay?: number;
  isPaid: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
}

export interface AppLock {
  enabled: boolean;
  pin?: string;
  useBiometric: boolean;
}

export interface StatusBarConfig {
  enabled: boolean;
  autoStart: boolean;
  showDayNumber: boolean;
}

export interface DriveBackupConfig {
  connected: boolean;
  autoBackup: boolean;
  intervalHours: number;
  lastBackupTimestamp: number | null;
  lastDataHash: string;
  accessToken: string | null;
  refreshToken: string | null;
}

export const BACKUP_INTERVALS = [
  { value: 2, label: '۲ ساعت' },
  { value: 4, label: '۴ ساعت' },
  { value: 6, label: '۶ ساعت' },
  { value: 12, label: '۱۲ ساعت' },
  { value: 24, label: '۲۴ ساعت' },
  { value: 168, label: 'یک هفته' },
] as const;

export const DEFAULT_DRIVE_BACKUP: DriveBackupConfig = {
  connected: false,
  autoBackup: false,
  intervalHours: 24,
  lastBackupTimestamp: null,
  lastDataHash: '',
  accessToken: null,
  refreshToken: null,
};

export interface BackupData {
  transactions: Transaction[];
  budgets: Record<string, number>;
  categories: Category[];
  reminders: Reminder[];
  userProfile: UserProfile;
  accounts: Account[];
  recurringTransactions: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  appLock: AppLock;
  statusBarConfig: StatusBarConfig;
  driveBackup?: DriveBackupConfig;
  exportedAt: string;
}

export const DEFAULT_STATUS_BAR_CONFIG: StatusBarConfig = {
  enabled: false,
  autoStart: false,
  showDayNumber: true,
};

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash_default', name: 'کیف پول', type: 'cash', initialBalance: 0, color: '#10b981', icon: 'wallet', isDefault: true },
  { id: 'bank_default', name: 'حساب بانکی', type: 'bank', initialBalance: 0, color: '#2563eb', icon: 'credit-card', isDefault: false },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'حقوق و دستمزد', icon: 'credit-card', color: '#10b981', type: 'income' },
  { id: 'freelance', name: 'پروژه آزاد', icon: 'monitor', color: '#14b8a6', type: 'income' },
  { id: 'gift_in', name: 'هدیه دریافتی', icon: 'gift', color: '#22c55e', type: 'income' },
  { id: 'transfer_in', name: 'انتقال وجه (دریافتی)', icon: 'repeat', color: '#0ea5e9', type: 'income' },
  { id: 'food', name: 'رستوران و خوراک', icon: 'coffee', color: '#f43f5e', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'transport', name: 'اسنپ و رفت‌وآمد', icon: 'truck', color: '#f97316', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'shopping', name: 'خرید لباس و ...', icon: 'shopping-bag', color: '#d946ef', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'home', name: 'خانه و سوپرمارکت', icon: 'home', color: '#6366f1', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'bills', name: 'قبوض و اینترنت', icon: 'file-text', color: '#3b82f6', type: 'expense', parentCategoryId: 'loans_installments' },
  { id: 'entertainment', name: 'تفریح و سرگرمی', icon: 'film', color: '#ec4899', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'health', name: 'دارو و درمان', icon: 'activity', color: '#ef4444', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'education', name: 'آموزش و کتاب', icon: 'book', color: '#8b5cf6', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'investment', name: 'سرمایه‌گذاری', icon: 'trending-up', color: '#059669', type: 'expense', parentCategoryId: 'savings_investments' },
  { id: 'transfer', name: 'انتقال وجه', icon: 'repeat', color: '#0ea5e9', type: 'expense', parentCategoryId: 'savings_investments' },
];

export const CATEGORY_ICONS = [
  'credit-card', 'monitor', 'gift', 'coffee', 'truck', 'shopping-bag',
  'home', 'file-text', 'film', 'activity', 'zap', 'bus', 'plane',
  'phone', 'heart', 'circle', 'book', 'briefcase', 'camera', 'cpu',
  'headphones', 'map-pin', 'music', 'server', 'smile', 'star', 'sun',
  'tv', 'umbrella', 'user', 'trending-up', 'dollar-sign', 'archive',
];

export const COLOR_OPTIONS = [
  '#10b981', '#14b8a6', '#22c55e', '#84cc16',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#6b7280',
  '#0ea5e9', '#06b6d4',
];

export const ACCOUNT_ICONS = ['wallet', 'credit-card', 'bank', 'trending-up', 'dollar-sign', 'archive', 'briefcase', 'save'];
export const GOAL_ICONS = ['target', 'flag', 'star', 'heart', 'zap', 'gift', 'award', 'umbrella', 'plane', 'home'];
export const DEBT_ICONS = ['users', 'user', 'user-check', 'user-minus', 'user-plus', 'briefcase', 'file-text', 'help-circle'];
