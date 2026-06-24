export type TransactionType = 'income' | 'expense';
export type ParentCategoryType = 'loans_installments' | 'savings_investments' | 'essentials';

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

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  parentCategoryId?: ParentCategoryType;
}

export type ReminderType = 'monthly' | 'onetime';

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
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
}

export interface BackupData {
  transactions: Transaction[];
  budgets: Record<string, number>;
  categories: Category[];
  reminders: Reminder[];
  userProfile: UserProfile;
  exportedAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'حقوق و دستمزد', icon: 'credit-card', color: '#10b981', type: 'income' },
  { id: 'freelance', name: 'پروژه آزاد', icon: 'monitor', color: '#14b8a6', type: 'income' },
  { id: 'gift_in', name: 'هدیه دریافتی', icon: 'gift', color: '#22c55e', type: 'income' },
  { id: 'food', name: 'رستوران و خوراک', icon: 'coffee', color: '#f43f5e', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'transport', name: 'اسنپ و رفت‌وآمد', icon: 'truck', color: '#f97316', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'shopping', name: 'خرید لباس و ...', icon: 'shopping-bag', color: '#d946ef', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'home', name: 'خانه و سوپرمارکت', icon: 'home', color: '#6366f1', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'bills', name: 'قبوض و اینترنت', icon: 'file-text', color: '#3b82f6', type: 'expense', parentCategoryId: 'loans_installments' },
  { id: 'entertainment', name: 'تفریح و سرگرمی', icon: 'film', color: '#ec4899', type: 'expense', parentCategoryId: 'essentials' },
  { id: 'health', name: 'دارو و درمان', icon: 'activity', color: '#ef4444', type: 'expense', parentCategoryId: 'essentials' },
];

export const CATEGORY_ICONS = [
  'credit-card', 'monitor', 'gift', 'coffee', 'truck', 'shopping-bag',
  'home', 'file-text', 'film', 'activity', 'zap', 'bus', 'plane',
  'phone', 'heart', 'circle', 'book', 'briefcase', 'camera', 'cpu',
  'headphones', 'map-pin', 'music', 'server', 'smile', 'star', 'sun',
  'tv', 'umbrella', 'user'
];

export const COLOR_OPTIONS = [
  '#10b981', '#14b8a6', '#22c55e', '#84cc16',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#6b7280',
];
