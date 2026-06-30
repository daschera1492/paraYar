import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { AccountType, ACCOUNT_ICONS, COLOR_OPTIONS } from '../types';
import { formatCurrency } from '../utils';

const iconMap: Record<string, any> = {
  wallet: 'credit-card', 'credit-card': 'credit-card', bank: 'credit-card',
  'trending-up': 'trending-up', 'dollar-sign': 'dollar-sign',
  archive: 'archive', briefcase: 'briefcase', save: 'save',
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: 'حساب بانکی', cash: 'کیف پول', card: 'کارت', wallet: 'کیف پول الکترونیک', savings: 'حساب پس‌انداز',
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  bank: '#2563eb', cash: '#10b981', card: '#f59e0b', wallet: '#8b5cf6', savings: '#06b6d4',
};

export default function AccountsScreen() {
  const { accounts, addAccount, updateAccount, deleteAccount, transactions } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [icon, setIcon] = useState('wallet');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setType('bank');
    setIcon('wallet');
    setColor(COLOR_OPTIONS[0]);
    setShowForm(true);
  };

  const openEdit = (a: typeof accounts[0]) => {
    setEditingId(a.id);
    setName(a.name);
    setType(a.type);
    setIcon(a.icon);
    setColor(a.color);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), type, initialBalance: 0, color, icon, isDefault: false };
    if (editingId) {
      updateAccount(editingId, data);
    } else {
      addAccount(data);
    }
    setShowForm(false);
  };

  const calcBalance = (accountId: string): number => {
    const acct = accounts.find(a => a.id === accountId);
    if (!acct) return 0;
    let bal = acct.initialBalance;
    transactions.filter(t => t.accountId === accountId).forEach(t => {
      bal += t.type === 'income' ? t.amount : -t.amount;
    });
    return bal;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حساب‌های مالی</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="layers" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>هنوز حسابی ثبت نشده</Text>
        </View>
      ) : (
        accounts.map(acct => {
          const balance = calcBalance(acct.id);
          const iconName = iconMap[acct.icon] || 'wallet';
          return (
            <TouchableOpacity key={acct.id} style={styles.accountCard}
              onPress={() => openEdit(acct)} onLongPress={() => {
                Alert.alert('حذف حساب', `آیا از حذف حساب "${acct.name}" و تمام تراکنش‌های آن اطمینان دارید؟`, [
                  { text: 'انصراف', style: 'cancel' },
                  { text: 'حذف', style: 'destructive', onPress: () => deleteAccount(acct.id) },
                ]);
              }}>
              <View style={[styles.accountIcon, { backgroundColor: acct.color + '20' }]}>
                <Feather name={iconName} size={28} color={acct.color} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{acct.name}</Text>
                <Text style={styles.accountType}>{ACCOUNT_TYPE_LABELS[acct.type]}</Text>
              </View>
              <View style={styles.accountBalance}>
                <Text style={[styles.balanceAmount, balance >= 0 ? { color: '#10b981' } : { color: '#ef4444' }]}>
                  {formatCurrency(balance, true)}
                </Text>
                <Text style={styles.balanceLabel}>
                   {transactions.filter(t => t.accountId === acct.id).length} تراکنش
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'ویرایش حساب' : 'حساب جدید'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.fieldLabel}>نام حساب</Text>
              <TextInput style={styles.fieldInput} value={name} onChangeText={setName}
                placeholder="مثال: حساب ملی، کیف پول..." />

              <Text style={styles.fieldLabel}>نوع حساب</Text>
              <View style={styles.typeGrid}>
                {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([key, label]) => (
                  <TouchableOpacity key={key} style={[styles.typeBtn, type === key && { backgroundColor: ACCOUNT_TYPE_COLORS[key] + '20', borderColor: ACCOUNT_TYPE_COLORS[key] }]}
                    onPress={() => setType(key)}>
                    <Text style={[styles.typeBtnText, type === key && { color: ACCOUNT_TYPE_COLORS[key], fontFamily: 'Vazirmatn_700Bold' }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>آیکون</Text>
              <View style={styles.iconGrid}>
                {ACCOUNT_ICONS.map(iconStr => {
                  const ic = iconMap[iconStr];
                  return (
                    <TouchableOpacity key={iconStr} style={[styles.iconOption, icon === iconStr && { backgroundColor: color + '20', borderColor: color }]}
                      onPress={() => setIcon(iconStr)}>
                      {ic && <Feather name={ic} size={24} color={icon === iconStr ? color : '#6b7280'} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>رنگ</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorActive]}
                    onPress={() => setColor(c)} />
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingId ? 'بروزرسانی' : 'ایجاد حساب'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingBottom: 140 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  headerTitle: { fontSize: 20, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 16 },
  emptyText: { fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af' },
  accountCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20,
    padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  accountIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1, marginHorizontal: 16 },
  accountName: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  accountType: { fontSize: 12, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', marginTop: 4 },
  accountBalance: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold' },
  balanceLabel: { fontSize: 10, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: { flex: 1, backgroundColor: '#fff', marginTop: 80, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  modalBody: { padding: 24, gap: 20, paddingBottom: 120 },
  fieldLabel: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 8 },
  fieldInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Vazirmatn_500Medium', borderWidth: 1, borderColor: '#e5e7eb' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  typeBtnText: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  iconOption: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  colorActive: { borderWidth: 3, borderColor: '#1f2937', transform: [{ scale: 1.15 }] },
  modalFooter: { position: 'absolute', bottom: 0, width: '100%', padding: 24, paddingBottom: 32 },
  saveBtn: { backgroundColor: '#111827', borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'Vazirmatn_700Bold', fontSize: 16 },
});
