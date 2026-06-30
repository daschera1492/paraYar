import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import {
  TransactionType, ParentCategoryType, Category, PARENT_CATEGORIES, COLOR_OPTIONS, CATEGORY_ICONS,
  GOAL_ICONS, DEBT_ICONS,   StatusBarConfig, DEFAULT_STATUS_BAR_CONFIG, BACKUP_INTERVALS, DEFAULT_DRIVE_BACKUP,
} from '../types';
import { formatCurrency, calculateGoalProgress, generateId, getShamsiNow, SHAMSI_MONTH_NAMES, formatShamsiDateParts, gregorianToShamsi } from '../utils';
import CurrencyInput from '../components/CurrencyInput';
import ShamsiDatePicker from '../components/ShamsiDatePicker';
import { signInToDrive, signOutFromDrive, uploadBackupToDrive, refreshAccessToken } from '../services/DriveService';

const SECTION_TITLES: Record<string, string> = {
  profile: 'پروفایل', budgets: 'بودجه', categories: 'دسته‌ها',
  goals: 'اهداف', debts: 'بدهی‌ها', backup: 'پشتیبان', security: 'امنیت', statusbar: 'نوار وضعیت',
};

const iconMap: Record<string, any> = {
  'credit-card': 'credit-card', monitor: 'monitor', gift: 'gift', coffee: 'coffee',
  truck: 'truck', 'shopping-bag': 'shopping-bag', home: 'home', 'file-text': 'file-text',
  film: 'film', activity: 'activity', zap: 'zap',
  phone: 'phone', heart: 'heart', circle: 'circle', book: 'book', briefcase: 'briefcase',
  camera: 'camera', cpu: 'cpu', headphones: 'headphones', 'map-pin': 'map-pin',
  music: 'music', server: 'server', smile: 'smile', star: 'star', sun: 'sun',
  tv: 'tv', umbrella: 'umbrella', user: 'user', 'trending-up': 'trending-up',
  'dollar-sign': 'dollar-sign', archive: 'archive', target: 'target', flag: 'flag',
  award: 'award', users: 'users', 'user-check': 'user-check', 'user-minus': 'user-minus',
  'user-plus': 'user-plus', 'help-circle': 'help-circle', save: 'save',
};

type SettingTab = 'profile' | 'budgets' | 'categories' | 'backup' | 'goals' | 'debts' | 'security' | 'statusbar';

interface SettingsScreenProps {
  onNavigateTo?: (view: string) => void;
  initialTab?: SettingTab;
}

export default function SettingsScreen({ onNavigateTo, initialTab }: SettingsScreenProps) {
  const {
    budgets, setCategoryBudget, categories, addCategory, updateCategory, deleteCategory,
    userProfile, updateUserProfile, getBackupData, importBackup,
    transactions, reminders,
    savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeToGoal,
    debts, addDebt, updateDebt, deleteDebt, payDebt,
    appLock, setAppLock, accounts,
    statusBarConfig, setStatusBarConfig,
    driveBackup, setDriveBackup, getDataHash,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<SettingTab>(initialTab || 'profile');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const [catType, setCatType] = useState<TransactionType>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const [tempProfile, setTempProfile] = useState(userProfile);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [driveUploading, setDriveUploading] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('credit-card');
  const [newCatColor, setNewCatColor] = useState(COLOR_OPTIONS[0]);
  const [newCatParent, setNewCatParent] = useState<ParentCategoryType>('essentials');

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalColor, setGoalColor] = useState(COLOR_OPTIONS[0]);
  const [goalIcon, setGoalIcon] = useState('target');
  const [goalDeadlineMonth, setGoalDeadlineMonth] = useState('');
  const [goalDeadlineYear, setGoalDeadlineYear] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');

  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [debtPerson, setDebtPerson] = useState('');
  const [debtType, setDebtType] = useState<'loan' | 'debt'>('debt');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [debtDueMonth, setDebtDueMonth] = useState('');
  const [debtDueYear, setDebtDueYear] = useState('');
  const [debtDueDay, setDebtDueDay] = useState('');
  const [payDebtAmount, setPayDebtAmount] = useState('');
  const [showDebtDatePicker, setShowDebtDatePicker] = useState(false);
  const [debtDueDate, setDebtDueDate] = useState(new Date());

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleExportBackup = async () => {
    try {
      const backupObj = getBackupData();
      const jsonString = JSON.stringify(backupObj, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      const fileUri = FileSystem.documentDirectory + `finance_backup_${dateStr}.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
      } else {
        Alert.alert('موفق', `فایل پشتیبان ذخیره شد: ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'خطا در تهیه نسخه پشتیبان.');
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(content);
      const success = importBackup(parsed);
      if (success) {
        setImportStatus({ type: 'success', message: 'اطلاعات با موفقیت بازگردانی شد!' });
      } else {
        setImportStatus({ type: 'error', message: 'فرمت فایل پشتیبان معتبر نیست.' });
      }
    } catch {
      setImportStatus({ type: 'error', message: 'خطا در خواندن فایل.' });
    }
  };

  const lastBackupTime = driveBackup.lastBackupTimestamp
    ? new Date(driveBackup.lastBackupTimestamp).toLocaleString('fa-IR')
    : null;

  const handleDriveLogin = useCallback(async () => {
    const result = await signInToDrive();
    if (result) {
      setDriveBackup({
        ...driveBackup,
        connected: true,
        accessToken: result.accessToken,
        refreshToken: null,
      });
      setDriveStatus({ type: 'success', message: 'اتصال به گوگل‌درایو موفقیت‌آمیز بود.' });
    } else {
      setDriveStatus({ type: 'error', message: 'خطا در اتصال به گوگل. لطفاً دوباره تلاش کنید.' });
    }
  }, [driveBackup, setDriveBackup]);

  const handleDriveDisconnect = useCallback(async () => {
    await signOutFromDrive();
    setDriveBackup({ ...DEFAULT_DRIVE_BACKUP, autoBackup: false, intervalHours: driveBackup.intervalHours });
    setDriveStatus(null);
  }, [setDriveBackup, driveBackup.intervalHours]);

  const handleDriveManualUpload = useCallback(async () => {
    let token = driveBackup.accessToken;
    if (!token) {
      setDriveStatus({ type: 'error', message: 'ابتدا به گوگل متصل شوید.' });
      return;
    }
    setDriveUploading(true);
    setDriveStatus(null);
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        token = newToken;
        setDriveBackup({ ...driveBackup, accessToken: newToken });
      }
      const backupObj = getBackupData();
      const jsonString = JSON.stringify(backupObj, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      const fileName = `finance_backup_${dateStr}.json`;
      const ok = await uploadBackupToDrive(token, jsonString, fileName);
      if (ok) {
        const currentHash = getDataHash();
        setDriveBackup({
          ...driveBackup,
          accessToken: token,
          lastBackupTimestamp: Date.now(),
          lastDataHash: currentHash,
        });
        setDriveStatus({ type: 'success', message: 'بکاپ با موفقیت به گوگل‌درایو ارسال شد.' });
      } else {
        setDriveStatus({ type: 'error', message: 'خطا در آپلود. اتصال اینترنت را بررسی کنید.' });
      }
    } catch {
      setDriveStatus({ type: 'error', message: 'خطا در آپلود فایل.' });
    }
    setDriveUploading(false);
  }, [driveBackup, getBackupData, getDataHash, setDriveBackup]);

  const handleSaveProfile = () => {
    updateUserProfile(tempProfile);
    Alert.alert('موفق', 'پروفایل با موفقیت ذخیره شد.');
  };

  const handleSaveBudget = (id: string) => {
    const amt = Number(editAmount.replace(/\D/g, ''));
    setCategoryBudget(id, !isNaN(amt) && amt > 0 ? amt : 0);
    setEditingId(null);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const catData = {
      name: newCatName.trim(), type: catType, icon: newCatIcon,
      color: newCatColor, parentCategoryId: catType === 'expense' ? newCatParent : undefined,
    };
    if (editingCatId) {
      updateCategory(editingCatId, catData);
    } else {
      addCategory(catData);
    }
    setNewCatName('');
    setIsAddingCat(false);
    setEditingCatId(null);
    setNewCatParent('essentials');
  };

  const startEditCategory = (cat: Category) => {
    setCatType(cat.type);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    setNewCatColor(cat.color);
    setNewCatParent((cat.parentCategoryId as ParentCategoryType) || 'essentials');
    setEditingCatId(cat.id);
    setIsAddingCat(true);
  };

  const openAddCategory = () => {
    setEditingCatId(null);
    setNewCatName('');
    setNewCatIcon('credit-card');
    setNewCatColor(COLOR_OPTIONS[0]);
    setNewCatParent('essentials');
    setIsAddingCat(true);
  };

  const handleGoalSave = () => {
    if (!goalName.trim() || !goalTarget) return;
    const data = {
      name: goalName.trim(),
      targetAmount: Number(goalTarget.replace(/\D/g, '')),
      currentAmount: 0,
      deadlineYear: goalDeadlineYear ? Number(goalDeadlineYear) : undefined,
      deadlineMonth: goalDeadlineMonth ? Number(goalDeadlineMonth) : undefined,
      color: goalColor,
      icon: goalIcon,
      createdAt: new Date().toISOString(),
    };
    if (editingGoalId) {
      updateSavingsGoal(editingGoalId, data);
    } else {
      addSavingsGoal(data);
    }
    resetGoalForm();
  };

  const resetGoalForm = () => {
    setIsAddingGoal(false);
    setEditingGoalId(null);
    setGoalName('');
    setGoalTarget('');
    setGoalColor(COLOR_OPTIONS[0]);
    setGoalIcon('target');
    setGoalDeadlineMonth('');
    setGoalDeadlineYear('');
    setContributeAmount('');
  };

  const handleDebtSave = () => {
    if (!debtPerson.trim() || !debtAmount) return;
    const amt = Number(debtAmount.replace(/\D/g, ''));
    const data = {
      personName: debtPerson.trim(),
      type: debtType,
      amount: amt,
      remainingAmount: amt,
      description: debtDesc,
      date: new Date().toISOString(),
      dueYear: debtDueYear ? Number(debtDueYear) : undefined,
      dueMonth: debtDueMonth ? Number(debtDueMonth) : undefined,
      dueDay: debtDueDay ? Number(debtDueDay) : undefined,
      isPaid: false,
    };
    if (editingDebtId) {
      updateDebt(editingDebtId, data);
    } else {
      addDebt(data);
    }
    resetDebtForm();
  };

  const resetDebtForm = () => {
    setIsAddingDebt(false);
    setEditingDebtId(null);
    setDebtPerson('');
    setDebtType('debt');
    setDebtAmount('');
    setDebtDesc('');
    setDebtDueMonth('');
    setDebtDueYear('');
    setDebtDueDay('');
  };

  const renderProfileTab = () => (
    <View style={{ gap: 20 }}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarBig}><Feather name="user" size={48} color="#2563eb" /></View>
        <Text style={{ fontSize: 13, color: '#6b7280' }}>اطلاعات حساب کاربری شما</Text>
      </View>
      <View>
        <Text style={styles.fieldLabel}>نام و نام خانوادگی</Text>
        <TextInput style={styles.fieldInput} value={tempProfile.name}
          onChangeText={t => setTempProfile({ ...tempProfile, name: t })} />
      </View>
      <View>
        <Text style={styles.fieldLabel}>شماره موبایل</Text>
        <TextInput style={[styles.fieldInput, { textAlign: 'left' }]} value={tempProfile.phone}
          onChangeText={t => setTempProfile({ ...tempProfile, phone: t })} placeholder="09xxxxxxxxx" keyboardType="phone-pad" />
      </View>
      <View>
        <Text style={styles.fieldLabel}>ایمیل</Text>
        <TextInput style={[styles.fieldInput, { textAlign: 'left' }]} value={tempProfile.email}
          onChangeText={t => setTempProfile({ ...tempProfile, email: t })} placeholder="user@example.com" keyboardType="email-address" />
      </View>
      <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile}>
        <Text style={styles.saveProfileBtnText}>ذخیره تغییرات پروفایل</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBudgetsTab = () => (
    <View style={{ gap: 24 }}>
      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>تعیین سقف هزینه برای دسته‌های اصلی و زیرمجموعه‌ها.</Text>
      <View style={{ gap: 12 }}>
        <Text style={styles.budgetSectionTitle}>دسته‌های اصلی</Text>
        {PARENT_CATEGORIES.map(pc => {
          const isEditing = editingId === pc.id;
          const currentBudget = budgets[pc.id] || 0;
          return (
            <View key={pc.id} style={[styles.budgetItem, { borderColor: '#dbeafe' }]}>
              <View style={styles.budgetNameRow}>
                <View style={[styles.budgetDot, { backgroundColor: pc.color }]} />
                <Text style={styles.budgetName}>{pc.name}</Text>
              </View>
              {isEditing ? (
                <View style={styles.budgetEditRow}>
                  <TextInput style={styles.budgetInput} value={editAmount}
                    onChangeText={t => setEditAmount(t.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                    keyboardType="numeric" autoFocus />
                  <TouchableOpacity style={styles.budgetCheck} onPress={() => handleSaveBudget(pc.id)}>
                    <Feather name="check" size={18} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.budgetValue, currentBudget > 0 && styles.budgetValueSet]}
                  onPress={() => { setEditingId(pc.id); setEditAmount(currentBudget > 0 ? currentBudget.toLocaleString('en-US') : ''); }}>
                  <Text style={[styles.budgetValueText, currentBudget > 0 && { color: '#1d4ed8' }]}>
                    {currentBudget > 0 ? `${currentBudget.toLocaleString('en-US')} تومان` : 'تعریف بودجه'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ gap: 12 }}>
        <Text style={styles.budgetSectionTitle}>زیرمجموعه‌ها</Text>
        {expenseCategories.map(cat => {
          const isEditing = editingId === cat.id;
          const currentBudget = budgets[cat.id] || 0;
          const iconName = iconMap[cat.icon] || 'credit-card';
          return (
            <View key={cat.id} style={styles.budgetItem}>
              <View style={styles.budgetNameRow}>
                <View style={[styles.budgetSubIcon, { backgroundColor: cat.color + '26' }]}>
                  <Feather name={iconName} size={18} color={cat.color} />
                </View>
                <Text style={styles.budgetName}>{cat.name}</Text>
              </View>
              {isEditing ? (
                <View style={styles.budgetEditRow}>
                  <TextInput style={[styles.budgetInput, { maxWidth: 100 }]} value={editAmount}
                    onChangeText={t => setEditAmount(t.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                    keyboardType="numeric" autoFocus />
                  <TouchableOpacity style={styles.budgetCheck} onPress={() => handleSaveBudget(cat.id)}>
                    <Feather name="check" size={16} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.budgetValue, currentBudget > 0 && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}
                  onPress={() => { setEditingId(cat.id); setEditAmount(currentBudget > 0 ? currentBudget.toLocaleString('en-US') : ''); }}>
                  <Text style={[styles.budgetValueText, currentBudget > 0 && { color: '#475569' }]}>
                    {currentBudget > 0 ? `${currentBudget.toLocaleString('en-US')} تومان` : 'بدون سقف'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderCategoriesTab = () => (
    <View style={{ gap: 16 }}>
      <View style={styles.catTypeToggle}>
        <TouchableOpacity style={[styles.catTypeBtn, catType === 'expense' && styles.catTypeBtnExpense]}
          onPress={() => setCatType('expense')}>
          <Text style={[styles.catTypeBtnText, catType === 'expense' && { color: '#be123c' }]}>هزینه</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.catTypeBtn, catType === 'income' && styles.catTypeBtnIncome]}
          onPress={() => setCatType('income')}>
          <Text style={[styles.catTypeBtnText, catType === 'income' && { color: '#047857' }]}>درآمد</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addCatBtn} onPress={openAddCategory}>
        <Feather name="plus" size={20} color="#6b7280" />
        <Text style={{ color: '#6b7280', fontFamily: 'Vazirmatn_700Bold', fontSize: 14 }}>دسته‌بندی جدید</Text>
      </TouchableOpacity>
      {categories.filter(c => c.type === catType).map(cat => {
        const iconName = iconMap[cat.icon] || 'credit-card';
        return (
          <View key={cat.id} style={styles.catItem}>
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              onPress={() => startEditCategory(cat)}>
              <View style={[styles.catItemIcon, { backgroundColor: cat.color + '26' }]}>
                <Feather name={iconName} size={22} color={cat.color} />
              </View>
              <Text style={styles.catItemName}>{cat.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteCategory(cat.id)} style={{ padding: 8 }}>
              <Feather name="trash-2" size={18} color="#f43f5e" />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  const renderGoalsTab = () => (
    <View style={{ gap: 16 }}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitleSm}>اهداف پس‌انداز</Text>
        <TouchableOpacity style={styles.smallAddBtn} onPress={() => { resetGoalForm(); setIsAddingGoal(true); }}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      {savingsGoals.length === 0 ? (
        <View style={styles.emptySection}>
          <Feather name="flag" size={40} color="#d1d5db" />
          <Text style={{ color: '#9ca3af', fontSize: 13 }}>هنوز هدفی ثبت نشده</Text>
        </View>
      ) : (
        savingsGoals.map(g => {
          const pct = calculateGoalProgress(g.currentAmount, g.targetAmount);
          const iconName = iconMap[g.icon] || 'flag';
          return (
            <View key={g.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalHeaderLeft}>
                  <View style={[styles.goalIconBox, { backgroundColor: g.color + '20' }]}>
                    <Feather name={iconName} size={24} color={g.color} />
                  </View>
                  <View>
                    <Text style={styles.goalName}>{g.name}</Text>
                    <Text style={styles.goalProgress}>{pct}% تکمیل</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteSavingsGoal(g.id)}>
                  <Feather name="trash-2" size={16} color="#d1d5db" />
                </TouchableOpacity>
              </View>
              <View style={styles.goalBarBg}>
                <View style={[styles.goalBarFill, { width: `${pct}%`, backgroundColor: g.color }]} />
              </View>
              <View style={styles.goalStats}>
                <Text style={styles.goalStat}>{formatCurrency(g.currentAmount, true)}</Text>
                <Text style={styles.goalStat}>از {formatCurrency(g.targetAmount, true)}</Text>
              </View>
              {g.currentAmount < g.targetAmount && (
                <View style={styles.contributeRow}>
                  <CurrencyInput value={contributeAmount} onChangeAmount={setContributeAmount}
                    placeholder="مبلغ" containerStyle={{ marginBottom: 0, flex: 1 }} suffixStyle={{ display: 'none' }}
                    inputStyle={{ fontSize: 14 }} />
                  <TouchableOpacity style={styles.contributeBtn} onPress={() => {
                    const amt = Number(contributeAmount);
                    if (amt > 0) { contributeToGoal(g.id, amt, accounts.length > 0 ? accounts[0].id : undefined); setContributeAmount(''); }
                  }}>
                    <Text style={styles.contributeBtnText}>واریز</Text>
                  </TouchableOpacity>
                </View>
              )}
              {g.deadlineYear && g.deadlineMonth && (
                <Text style={styles.goalDeadline}>مهلت: {formatShamsiDateParts(g.deadlineYear, g.deadlineMonth, 1)}</Text>
              )}
            </View>
          );
        })
      )}

      <Modal visible={isAddingGoal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingGoalId ? 'ویرایش هدف' : 'هدف جدید'}</Text>
              <TouchableOpacity onPress={() => setIsAddingGoal(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.fieldLabel}>نام هدف</Text>
              <TextInput style={styles.fieldInput} value={goalName} onChangeText={setGoalName} placeholder="مثال: خرید ماشین" />

              <CurrencyInput value={goalTarget} onChangeAmount={setGoalTarget} label="مبلغ هدف (تومان)"
                placeholder="10000000" />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>ماه مهلت (اختیاری)</Text>
                  <TextInput style={styles.fieldInput} value={goalDeadlineMonth} onChangeText={t => setGoalDeadlineMonth(t.replace(/\D/g, ''))}
                    placeholder="12" keyboardType="numeric" maxLength={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>سال مهلت (اختیاری)</Text>
                  <TextInput style={styles.fieldInput} value={goalDeadlineYear} onChangeText={t => setGoalDeadlineYear(t.replace(/\D/g, ''))}
                    placeholder="1405" keyboardType="numeric" maxLength={4} />
                </View>
              </View>

              <Text style={styles.fieldLabel}>آیکون</Text>
              <View style={styles.iconGrid}>
                {GOAL_ICONS.map(iconStr => {
                  const ic = iconMap[iconStr];
                  return (
                    <TouchableOpacity key={iconStr} style={[styles.iconOption, goalIcon === iconStr && { backgroundColor: goalColor + '20', borderColor: goalColor }]}
                      onPress={() => setGoalIcon(iconStr)}>
                      {ic && <Feather name={ic} size={24} color={goalIcon === iconStr ? goalColor : '#6b7280'} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>رنگ</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorOption, { backgroundColor: c }, goalColor === c && styles.colorActive]}
                    onPress={() => setGoalColor(c)} />
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleGoalSave}>
                <Text style={styles.saveBtnText}>ذخیره هدف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderDebtsTab = () => (
    <View style={{ gap: 16 }}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitleSm}>بدهی‌ها و طلب‌ها</Text>
        <TouchableOpacity style={styles.smallAddBtn} onPress={() => { resetDebtForm(); setIsAddingDebt(true); }}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      {debts.length === 0 ? (
        <View style={styles.emptySection}>
          <Feather name="users" size={40} color="#d1d5db" />
          <Text style={{ color: '#9ca3af', fontSize: 13 }}>بدهی یا طلبی ثبت نشده</Text>
        </View>
      ) : (
        debts.map(d => (
          <View key={d.id} style={[styles.debtCard, d.isPaid && { opacity: 0.5, borderColor: '#10b981' }]}>
            <View style={styles.debtHeader}>
              <View style={styles.debtHeaderLeft}>
                <View style={[styles.debtIconBox, { backgroundColor: d.type === 'loan' ? '#dbeafe' : '#fef3c7' }]}>
                  <Feather name={d.type === 'loan' ? 'arrow-up-right' : 'arrow-down-left'} size={20}
                    color={d.type === 'loan' ? '#2563eb' : '#f59e0b'} />
                </View>
                <View>
                  <Text style={styles.debtPerson}>{d.personName}</Text>
                  <Text style={styles.debtType}>{d.type === 'loan' ? 'قرض داده شده' : 'بدهی'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteDebt(d.id)}>
                <Feather name="trash-2" size={16} color="#d1d5db" />
              </TouchableOpacity>
            </View>
            <View style={styles.debtAmounts}>
              <Text style={[styles.debtAmountMain, d.isPaid && { color: '#10b981' }]}>
                {formatCurrency(d.remainingAmount, true)}
              </Text>
              <Text style={styles.debtAmountTotal}>از {formatCurrency(d.amount, true)}</Text>
            </View>
            {d.description ? <Text style={styles.debtDesc}>{d.description}</Text> : null}
            {d.dueYear && d.dueMonth && d.dueDay && (
              <Text style={styles.debtDue}>سررسید: {formatShamsiDateParts(d.dueYear, d.dueMonth, d.dueDay)}</Text>
            )}
            {!d.isPaid && (
              <View style={styles.payRow}>
                <CurrencyInput value={payDebtAmount} onChangeAmount={setPayDebtAmount}
                  placeholder="مبلغ پرداخت" containerStyle={{ marginBottom: 0, flex: 1 }} suffixStyle={{ display: 'none' }}
                  inputStyle={{ fontSize: 14 }} />
                <TouchableOpacity style={styles.payBtn} onPress={() => {
                  const amt = Number(payDebtAmount);
                  if (amt > 0) { payDebt(d.id, amt, accounts.length > 0 ? accounts[0].id : undefined); setPayDebtAmount(''); }
                }}>
                  <Text style={styles.payBtnText}>پرداخت</Text>
                </TouchableOpacity>
              </View>
            )}
            {d.isPaid && (
              <View style={styles.paidBadge}>
                <Feather name="check-circle" size={14} color="#059669" />
                <Text style={{ color: '#059669', fontSize: 11, fontFamily: 'Vazirmatn_700Bold' }}>تسویه شده</Text>
              </View>
            )}
          </View>
        ))
      )}

      <Modal visible={isAddingDebt} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingDebtId ? 'ویرایش' : 'ثبت بدهی/طلب'}</Text>
              <TouchableOpacity onPress={() => setIsAddingDebt(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.fieldLabel}>نام طرف مقابل</Text>
              <TextInput style={styles.fieldInput} value={debtPerson} onChangeText={setDebtPerson}
                placeholder="مثال: علی رضایی" />

              <View style={styles.typeToggle}>
                <TouchableOpacity style={[styles.typeBtn, debtType === 'debt' && styles.typeBtnActiveDebt]}
                  onPress={() => setDebtType('debt')}>
                  <Text style={[styles.typeBtnTextSm, debtType === 'debt' && { color: '#f59e0b' }]}>بدهی (من بدهکارم)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, debtType === 'loan' && styles.typeBtnActiveLoan]}
                  onPress={() => setDebtType('loan')}>
                  <Text style={[styles.typeBtnTextSm, debtType === 'loan' && { color: '#2563eb' }]}>طلب (به من بدهکار)</Text>
                </TouchableOpacity>
              </View>

              <CurrencyInput value={debtAmount} onChangeAmount={setDebtAmount} label="مبلغ (تومان)"
                placeholder="1000000" />

              <Text style={styles.fieldLabel}>توضیحات (اختیاری)</Text>
              <TextInput style={styles.fieldInput} value={debtDesc} onChangeText={setDebtDesc}
                placeholder="مثال: قرض برای تعمیر ماشین" />

              <Text style={styles.fieldLabel}>سررسید (اختیاری)</Text>
              <TouchableOpacity style={styles.fieldInput} onPress={() => setShowDebtDatePicker(true)}>
                <Text style={{ fontFamily: 'Vazirmatn_500Medium', fontSize: 14, color: (debtDueYear || debtDueMonth || debtDueDay) ? '#1f2937' : '#9ca3af' }}>
                  {debtDueYear && debtDueMonth && debtDueDay
                    ? `${debtDueYear}/${String(debtDueMonth).padStart(2, '0')}/${String(debtDueDay).padStart(2, '0')}`
                    : 'انتخاب تاریخ سررسید'}
                </Text>
              </TouchableOpacity>
              <ShamsiDatePicker visible={showDebtDatePicker} date={debtDueDate}
                onConfirm={(d) => {
                  const gy = d.getFullYear();
                  const gm = d.getMonth() + 1;
                  const gd = d.getDate();
                  const input = gregorianToShamsi(gy, gm, gd);
                  setDebtDueYear(String(input.year));
                  setDebtDueMonth(String(input.month));
                  setDebtDueDay(String(input.day));
                  setDebtDueDate(d);
                  setShowDebtDatePicker(false);
                }}
                onCancel={() => setShowDebtDatePicker(false)} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleDebtSave}>
                <Text style={styles.saveBtnText}>ذخیره</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderBackupTab = () => (
    <View style={{ gap: 24, paddingBottom: 40 }}>
      <View style={styles.backupIntroCard}>
        <View style={styles.backupIntroDeco} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Feather name="database" size={24} color="#bfdbfe" />
          <Text style={{ fontFamily: 'Vazirmatn_700Bold', fontSize: 14, color: '#fff' }}>پشتیبان‌گیری و بازگردانی</Text>
        </View>
        <Text style={{ fontSize: 12, color: 'rgba(219,234,254,0.9)', lineHeight: 20 }}>
          تمام اطلاعات مالی شما به صورت آفلاین در این گوشی ذخیره می‌شوند.
        </Text>
      </View>

      <View style={styles.backupCard}>
        <View style={styles.backupCardHeader}>
          <Feather name="download" size={16} color="#2563eb" />
          <Text style={{ fontFamily: 'Vazirmatn_700Bold', fontSize: 14, color: '#1f2937' }}>خروجی (پشتیبان‌گیری)</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18 }}>فایل JSON از تمام اطلاعات شما ساخته می‌شود.</Text>
        <View style={styles.backupStats}>
          {[
            ['تراکنش‌ها:', transactions.length.toLocaleString('fa-IR')],
            ['دسته‌ها:', categories.length.toLocaleString('fa-IR')],
            ['بودجه‌ها:', Object.keys(budgets).length.toLocaleString('fa-IR')],
            ['یادآورها:', reminders.length.toLocaleString('fa-IR')],
            ['حساب‌ها:', accounts.length.toLocaleString('fa-IR')],
            ['اهداف:', savingsGoals.length.toLocaleString('fa-IR')],
          ].map(([label, value], i) => (
            <View key={i} style={styles.backupStatRow}>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>{label}</Text>
              <Text style={{ fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', fontSize: 12 }}>{value}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportBackup}>
          <Feather name="download" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 12 }}>دانلود فایل پشتیبان</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.backupCard}>
        <View style={styles.backupCardHeader}>
          <Feather name="upload" size={16} color="#4f46e5" />
          <Text style={{ fontFamily: 'Vazirmatn_700Bold', fontSize: 14, color: '#1f2937' }}>بازگردانی (وارد کردن)</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18 }}>با آپلود فایل .json قبلی، اطلاعات جایگزین می‌شود.</Text>
        <TouchableOpacity style={styles.importBtn} onPress={handleImportBackup}>
          <Feather name="upload" size={24} color="#4f46e5" />
          <View>
            <Text style={{ color: '#374151', fontFamily: 'Vazirmatn_700Bold', fontSize: 12 }}>انتخاب فایل</Text>
            <Text style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }}>فقط .json</Text>
          </View>
        </TouchableOpacity>
        {importStatus.type && (
          <View style={[styles.importStatus, {
            backgroundColor: importStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
            borderColor: importStatus.type === 'success' ? '#a7f3d0' : '#fecaca',
          }]}>
            <View style={[styles.importStatusDot, { backgroundColor: importStatus.type === 'success' ? '#10b981' : '#ef4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.importStatusTitle, { color: importStatus.type === 'success' ? '#064e3b' : '#991b1b' }]}>
                {importStatus.type === 'success' ? 'موفق' : 'ناموفق'}
              </Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{importStatus.message}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.backupCard}>
        <View style={styles.backupCardHeader}>
          <Feather name="cloud" size={16} color="#0ea5e9" />
          <Text style={{ fontFamily: 'Vazirmatn_700Bold', fontSize: 14, color: '#1f2937' }}>پشتیبان‌گیری ابری (گوگل‌درایو)</Text>
        </View>

        {!driveBackup.connected ? (
          <>
            <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 12 }}>
              با اتصال به گوگل‌درایو، اطلاعات شما به‌صورت خودکار پشتیبان‌گیری می‌شود.
            </Text>
            <TouchableOpacity style={styles.driveConnectBtn} onPress={handleDriveLogin}>
              <Feather name="log-in" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 13 }}>ورود با گوگل</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ gap: 16 }}>
            <View style={styles.driveConnectedRow}>
              <Feather name="check-circle" size={20} color="#10b981" />
              <Text style={{ color: '#10b981', fontFamily: 'Vazirmatn_700Bold', fontSize: 13 }}>متصل به گوگل‌درایو</Text>
              <TouchableOpacity onPress={handleDriveDisconnect}>
                <Text style={{ color: '#ef4444', fontSize: 12, fontFamily: 'Vazirmatn_500Medium' }}>قطع اتصال</Text>
              </TouchableOpacity>
            </View>

            {lastBackupTime && (
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                آخرین بکاپ: {lastBackupTime}
              </Text>
            )}

            <TouchableOpacity style={styles.driveUploadBtn} onPress={handleDriveManualUpload}>
              <Feather name="upload-cloud" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 13 }}>ارسال دستی به گوگل‌درایو</Text>
            </TouchableOpacity>

            <View style={styles.secRow}>
              <View style={styles.secRowLeft}>
                <Feather name="repeat" size={20} color="#2563eb" />
                <View>
                  <Text style={styles.secTitle}>بکاپ خودکار</Text>
                  <Text style={styles.secDesc}>ارسال خودکار هنگام اتصال اینترنت</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.toggleSwitch, driveBackup.autoBackup && styles.toggleSwitchActive]}
                onPress={() => setDriveBackup({ ...driveBackup, autoBackup: !driveBackup.autoBackup })}>
                <View style={[styles.toggleKnob, driveBackup.autoBackup && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>

            {driveBackup.autoBackup && (
              <View>
                <Text style={styles.fieldLabel}>فاصله بین بکاپ‌ها</Text>
                <View style={styles.intervalRow}>
                  {BACKUP_INTERVALS.map(item => (
                    <TouchableOpacity key={item.value}
                      style={[styles.intervalBtn, driveBackup.intervalHours === item.value && styles.intervalBtnActive]}
                      onPress={() => setDriveBackup({ ...driveBackup, intervalHours: item.value })}>
                      <Text style={[styles.intervalBtnText, driveBackup.intervalHours === item.value && styles.intervalBtnTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  پس از اتصال به اینترنت، اگر از آخرین بکاپ بیشتر از این مدت گذشته باشد و اطلاعات جدیدی ثبت شده باشد، خودکار آپلود می‌شود.
                </Text>
              </View>
            )}

            {driveUploading && (
              <View style={styles.driveUploadingRow}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={{ fontSize: 12, color: '#2563eb' }}>در حال آپلود...</Text>
              </View>
            )}

            {driveStatus && (
              <View style={[styles.importStatus, {
                backgroundColor: driveStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
                borderColor: driveStatus.type === 'success' ? '#a7f3d0' : '#fecaca',
              }]}>
                <View style={[styles.importStatusDot, { backgroundColor: driveStatus.type === 'success' ? '#10b981' : '#ef4444' }]} />
                <Text style={{ fontSize: 12, color: driveStatus.type === 'success' ? '#064e3b' : '#991b1b', flex: 1 }}>
                  {driveStatus.message}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 11, color: '#9ca3af', lineHeight: 16 }}>
              تنظیمات گوگل‌درایو به بکاپ اضافه نمی‌شود و فقط روی این دستگاه ذخیره می‌گردد.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStatusBarTab = () => (
    <View style={{ gap: 20 }}>
      <View style={styles.backupIntroCard}>
        <View style={styles.backupIntroDeco} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Feather name="smartphone" size={24} color="#bfdbfe" />
          <Text style={{ fontFamily: 'Vazirmatn_700Bold', fontSize: 14, color: '#fff' }}>نوار وضعیت (Status Bar)</Text>
        </View>
        <Text style={{ fontSize: 12, color: 'rgba(219,234,254,0.9)', lineHeight: 20 }}>
          تنظیمات مربوط به نمایش اطلاعات در نوار وضعیت گوشی.
        </Text>
      </View>

      <View style={styles.secCard}>
        <View style={styles.secRow}>
          <View style={styles.secRowLeft}>
            <Feather name="activity" size={20} color="#2563eb" />
            <View>
              <Text style={styles.secTitle}>فعال‌سازی در پس‌زمینه</Text>
              <Text style={styles.secDesc}>نمایش تاریخ، درآمد و پرداختی امروز در نوار وضعیت</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.toggleSwitch, statusBarConfig.enabled && styles.toggleSwitchActive]}
            onPress={() => setStatusBarConfig({ ...statusBarConfig, enabled: !statusBarConfig.enabled })}>
            <View style={[styles.toggleKnob, statusBarConfig.enabled && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.secCard}>
        <View style={styles.secRow}>
          <View style={styles.secRowLeft}>
            <Feather name="power" size={20} color="#2563eb" />
            <View>
              <Text style={styles.secTitle}>اجرای خودکار هنگام راه‌اندازی</Text>
              <Text style={styles.secDesc}>حتی پس از بستن اپ یا خاموش/روشن کردن گوشی (نیازمند مجوز)</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.toggleSwitch, statusBarConfig.autoStart && styles.toggleSwitchActive]}
            onPress={() => setStatusBarConfig({ ...statusBarConfig, autoStart: !statusBarConfig.autoStart })}>
            <View style={[styles.toggleKnob, statusBarConfig.autoStart && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.secCard}>
        <View style={styles.secRow}>
          <View style={styles.secRowLeft}>
            <Feather name="circle" size={20} color="#2563eb" />
            <View>
              <Text style={styles.secTitle}>نمایش عدد روز شمسی به جای آیکون زنگوله</Text>
              <Text style={styles.secDesc}>مثلاً بجای زنگوله، عدد «۸» داخل یک دایره نمایش داده شود</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.toggleSwitch, statusBarConfig.showDayNumber && styles.toggleSwitchActive]}
            onPress={() => setStatusBarConfig({ ...statusBarConfig, showDayNumber: !statusBarConfig.showDayNumber })}>
            <View style={[styles.toggleKnob, statusBarConfig.showDayNumber && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.secInfoCard}>
        <Feather name="info" size={16} color="#3b82f6" />
        <Text style={{ fontSize: 12, color: '#1e40af', fontFamily: 'Vazirmatn_500Medium', flex: 1, lineHeight: 18 }}>
          این تنظیمات ظاهر نوار وضعیت را کنترل می‌کند. برای اعمال تغییرات، برنامه را مجدداً باز کنید.
        </Text>
      </View>
    </View>
  );

  const renderSecurityTab = () => (
    <View style={{ gap: 20 }}>
      <View style={styles.secCard}>
        <View style={styles.secRow}>
          <View style={styles.secRowLeft}>
            <Feather name="lock" size={20} color="#2563eb" />
            <View>
              <Text style={styles.secTitle}>قفل برنامه</Text>
              <Text style={styles.secDesc}>با PIN از اطلاعات مالی خود محافظت کنید</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.toggleSwitch, appLock.enabled && styles.toggleSwitchActive]}
            onPress={() => setAppLock({ ...appLock, enabled: !appLock.enabled })}>
            <View style={[styles.toggleKnob, appLock.enabled && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
        {appLock.enabled && (
          <View>
            <Text style={styles.fieldLabel}>PIN جدید (اختیاری - برای تغییر)</Text>
            <TextInput style={styles.fieldInput} placeholder="PIN ۴ تا ۶ رقمی"
              keyboardType="numeric" secureTextEntry maxLength={6}
              onChangeText={t => { if (t.length >= 4) setAppLock({ ...appLock, pin: t }); }} />
          </View>
        )}
      </View>

      <View style={styles.secCard}>
        <View style={styles.secRow}>
          <View style={styles.secRowLeft}>
            <Feather name="smartphone" size={20} color="#2563eb" />
            <View>
              <Text style={styles.secTitle}>اثر انگشت / بیومتریک</Text>
              <Text style={styles.secDesc}>ورود سریع با اثر انگشت</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.toggleSwitch, appLock.useBiometric && styles.toggleSwitchActive]}
            onPress={() => setAppLock({ ...appLock, useBiometric: !appLock.useBiometric })}>
            <View style={[styles.toggleKnob, appLock.useBiometric && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.secInfoCard}>
        <Feather name="info" size={16} color="#3b82f6" />
        <Text style={{ fontSize: 12, color: '#1e40af', fontFamily: 'Vazirmatn_500Medium', flex: 1, lineHeight: 18 }}>
          اطلاعات مالی شما فقط روی این دستگاه ذخیره می‌شود و جایی ارسال نمی‌گردد. قفل برنامه یک لایه امنیتی اضافی است.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <View style={styles.settingsHeader}>
        <Text style={styles.headerTitle}>{SECTION_TITLES[activeTab] || 'پروفایل'}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 140 }}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'budgets' && renderBudgetsTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'debts' && renderDebtsTab()}
        {activeTab === 'backup' && renderBackupTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'statusbar' && renderStatusBarTab()}
      </ScrollView>

      {isAddingCat && renderAddCategoryModal()}
    </View>
  );

  function renderAddCategoryModal() {
    const isEditing = editingCatId !== null;
    return (
      <Modal visible={isAddingCat} transparent animationType="slide">
        <View style={styles.addCatOverlay}>
          <View style={styles.addCatHeader}>
            <Text style={{ fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' }}>
              {isEditing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
            </Text>
            <TouchableOpacity onPress={() => { setIsAddingCat(false); setEditingCatId(null); }}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 120 }}>
            <View>
              <Text style={styles.fieldLabel}>نام</Text>
              <TextInput style={styles.fieldInput} value={newCatName} onChangeText={setNewCatName} placeholder="مثلاً: اقساط خودرو" />
            </View>
            {catType === 'expense' && (
              <View style={{ gap: 12 }}>
                <Text style={styles.fieldLabel}>دسته اصلی</Text>
                {PARENT_CATEGORIES.map(pc => (
                  <TouchableOpacity key={pc.id} style={[styles.parentSelect, newCatParent === pc.id && styles.parentSelectActive]}
                    onPress={() => setNewCatParent(pc.id)}>
                    <Text style={[styles.parentSelectText, newCatParent === pc.id && { color: '#1d4ed8', fontFamily: 'Vazirmatn_700Bold' }]}>{pc.name}</Text>
                    {newCatParent === pc.id && <Feather name="check" size={18} color="#2563eb" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ gap: 12 }}>
              <Text style={styles.fieldLabel}>رنگ</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {COLOR_OPTIONS.map(color => (
                  <TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }, newCatColor === color && styles.colorOptionActive]}
                    onPress={() => setNewCatColor(color)} />
                ))}
              </View>
            </View>
            <View style={{ gap: 12 }}>
              <Text style={styles.fieldLabel}>آیکون</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {CATEGORY_ICONS.map(iconStr => {
                  const ic = iconMap[iconStr];
                  return (
                    <TouchableOpacity key={iconStr} style={[styles.iconOption, newCatIcon === iconStr && { backgroundColor: newCatColor + '20' }]}
                      onPress={() => setNewCatIcon(iconStr)}>
                      {ic && <Feather name={ic} size={22} color={newCatIcon === iconStr ? newCatColor : '#6b7280'} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
          <View style={styles.addCatFooter}>
            <TouchableOpacity style={[styles.addCatSaveBtn, !newCatName.trim() && { backgroundColor: '#d1d5db' }]}
              onPress={handleCreateCategory} disabled={!newCatName.trim()}>
              <Text style={{ color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 16 }}>
                {editingCatId ? 'بروزرسانی' : 'ذخیره'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  settingsHeader: { backgroundColor: '#f1f5f9', paddingTop: 48, paddingHorizontal: 24, paddingBottom: 8},
  headerTitle: { fontSize: 20, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', textAlign: 'center' },

  avatarSection: { alignItems: 'center', gap: 12, marginBottom: 8},
  avatarBig: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(219,234,254,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff'},
  fieldLabel: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 8 },
  fieldInput: { backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Vazirmatn_500Medium', borderWidth: 1, borderColor: '#e5e7eb' },
  saveProfileBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveProfileBtnText: { color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 14 },

  budgetSectionTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', borderLeftWidth: 4, borderLeftColor: '#3b82f6', paddingLeft: 8, marginBottom: 8 },
  budgetItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f3f4f6'},
  budgetNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1},
  budgetDot: { width: 24, height: 24, borderRadius: 12},
  budgetSubIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  budgetName: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  budgetEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8},
  budgetInput: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: 'Vazirmatn_700Bold', borderWidth: 1, borderColor: '#e5e7eb', textAlign: 'left', minWidth: 80 },
  budgetCheck: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 12},
  budgetValue: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f9fafb'},
  budgetValueSet: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe'},
  budgetValueText: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#9ca3af' },

  catTypeToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#e5e7eb'},
  catTypeBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center'},
  catTypeBtnExpense: { backgroundColor: '#ffe4e6'},
  catTypeBtnIncome: { backgroundColor: '#d1fae5'},
  catTypeBtnText: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280' },
  addCatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 16},
  catItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6'},
  catItemIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  catItemName: { fontSize: 15, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitleSm: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  smallAddBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  emptySection: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e5e7eb' },

  goalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  goalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalName: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  goalProgress: { fontSize: 12, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium', marginTop: 2 },
  goalBarBg: { height: 12, borderRadius: 6, backgroundColor: '#f3f4f6', overflow: 'hidden' },
  goalBarFill: { height: 12, borderRadius: 6 },
  goalStats: { flexDirection: 'row', justifyContent: 'space-between' },
  goalStat: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  goalDeadline: { fontSize: 11, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium' },
  contributeRow: { flexDirection: 'row', gap: 8 },
  contributeInput: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: 'Vazirmatn_700Bold', borderWidth: 1, borderColor: '#e5e7eb' },
  contributeBtn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  contributeBtnText: { color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 12 },

  debtCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  debtHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  debtIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  debtPerson: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  debtType: { fontSize: 11, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium', marginTop: 2 },
  debtAmounts: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  debtAmountMain: { fontSize: 22, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  debtAmountTotal: { fontSize: 12, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium' },
  debtDesc: { fontSize: 12, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium' },
  debtDue: { fontSize: 11, color: '#f59e0b', fontFamily: 'Vazirmatn_500Medium' },
  payRow: { flexDirection: 'row', gap: 8 },
  payInput: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: 'Vazirmatn_700Bold', borderWidth: 1, borderColor: '#e5e7eb' },
  payBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  payBtnText: { color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 12 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },

  typeToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeBtnActiveDebt: { backgroundColor: '#fffbeb' },
  typeBtnActiveLoan: { backgroundColor: '#eff6ff' },
  typeBtnTextSm: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280' },

  backupIntroCard: { backgroundColor: '#4f46e5', borderRadius: 24, padding: 20, overflow: 'hidden'},
  backupIntroDeco: { position: 'absolute', right: 0, bottom: 0, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.05)'},
  backupCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f3f4f6', gap: 16},
  backupCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8},
  backupStats: { backgroundColor: 'rgba(249,250,251,0.8)', borderRadius: 16, padding: 16, gap: 12},
  backupStatRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(243,244,246,0.5)', paddingBottom: 8},
  exportBtn: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  importBtn: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12},
  importStatus: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1},
  importStatusDot: { width: 20, height: 20, borderRadius: 10, marginTop: 2},
  importStatusTitle: { fontFamily: 'Vazirmatn_700Bold', fontSize: 12 },
  cloudBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderColor: '#bae6fd', borderRadius: 16, backgroundColor: '#f0f9ff' },
  driveConnectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 14 },
  driveConnectedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driveUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 16, paddingVertical: 14 },
  driveUploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  intervalBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f3f4f6' },
  intervalBtnActive: { backgroundColor: '#2563eb' },
  intervalBtnText: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280' },
  intervalBtnTextActive: { color: '#fff' },

  secCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  secTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  secDesc: { fontSize: 11, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium', marginTop: 2 },
  toggleSwitch: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#d1d5db', justifyContent: 'center', paddingHorizontal: 2 },
  toggleSwitchActive: { backgroundColor: '#2563eb' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleKnobActive: { alignSelf: 'flex-end' },
  secInfoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#bfdbfe' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: { flex: 1, backgroundColor: '#fff', marginTop: 80, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  modalBody: { padding: 24, gap: 20, paddingBottom: 120 },
  modalFooter: { position: 'absolute', bottom: 0, width: '100%', padding: 24, paddingBottom: 32 },
  saveBtn: { backgroundColor: '#111827', borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 16 },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  iconOption: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  colorActive: { borderWidth: 3, borderColor: '#1f2937', transform: [{ scale: 1.15 }] },

  parentSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#f9fafb'},
  parentSelectActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(239,246,255,0.5)'},
  parentSelectText: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280' },
  colorOptionActive: { borderWidth: 3, borderColor: '#1f2937', transform: [{ scale: 1.1}] },

  addCatOverlay: { flex: 1, backgroundColor: '#fff'},
  addCatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  addCatFooter: { position: 'absolute', bottom: 0, width: '100%', padding: 24, paddingBottom: 32},
  addCatSaveBtn: { backgroundColor: '#111827', borderRadius: 24, paddingVertical: 16, alignItems: 'center'},
});
