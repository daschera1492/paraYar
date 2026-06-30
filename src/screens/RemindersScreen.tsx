import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { Reminder } from '../types';
import { gregorianToShamsi, SHAMSI_MONTH_NAMES, isShamsiLeapYear } from '../utils';

export default function RemindersScreen() {
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder, isReminderDue } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [reminderType, setReminderType] = useState<'monthly' | 'onetime'>('monthly');
  const [dueDate, setDueDate] = useState('1');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpYear, setDpYear] = useState(1405);
  const [dpMonth, setDpMonth] = useState(1);
  const [dpDay, setDpDay] = useState(1);
  const [selectedFullDate, setSelectedFullDate] = useState<{ year: number; month: number; day: number } | null>(null);

  useEffect(() => {
    const today = gregorianToShamsi(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    setDpYear(today.year);
    setDpMonth(today.month);
    setDpDay(today.day);
  }, []);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDate('1');
    setSelectedFullDate(null);
    setReminderType('monthly');
    setEditingReminder(null);
    setIsAdding(false);
  };

  const startEdit = (r: Reminder) => {
    setEditingReminder(r);
    setTitle(r.title);
    setAmount(r.amount ? String(r.amount) : '');
    setReminderType(r.type);
    if (r.type === 'monthly') {
      setDueDate(String(r.dueDate));
    } else {
      setSelectedFullDate({ year: r.dueYear || dpYear, month: r.dueMonth || dpMonth, day: r.dueDate });
    }
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const data: Omit<Reminder, 'id'> = {
      title: title.trim(),
      amount: amount ? Number(amount.replace(/\D/g, '')) : undefined,
      type: reminderType,
      dueDate: reminderType === 'monthly' ? Number(dueDate) : (selectedFullDate?.day || 1),
      dueYear: reminderType === 'onetime' ? selectedFullDate?.year : undefined,
      dueMonth: reminderType === 'onetime' ? selectedFullDate?.month : undefined,
      isActive: true,
      notificationInterval: 0,
      completed: false,
    };
    if (editingReminder) {
      updateReminder(editingReminder.id, data);
    } else {
      addReminder(data);
    }
    resetForm();
  };

  const confirmDate = () => {
    setSelectedFullDate({ year: dpYear, month: dpMonth, day: dpDay });
    setShowDatePicker(false);
  };

  const maxDay = dpMonth <= 6 ? 31 : dpMonth <= 11 ? 30 : isShamsiLeapYear(dpYear) ? 30 : 29;
  const safeDay = Math.min(dpDay, maxDay);

  const reminderLabel = (r: Reminder) => {
    if (r.type === 'monthly') return `روز ${r.dueDate} هر ماه`;
    if (r.dueYear && r.dueMonth) {
      return `${r.dueDate} ${SHAMSI_MONTH_NAMES[r.dueMonth - 1]} ${r.dueYear}`;
    }
    return '';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>یادآور پرداختی‌ها</Text>
          <Text style={styles.headerSub}>مدیریت قبوض، اجاره و پرداخت‌های ماهانه</Text>
        </View>
        <TouchableOpacity style={styles.addIcon} onPress={() => { resetForm(); setIsAdding(true); }}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={isAdding} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingReminder ? 'ویرایش یادآور' : 'یادآور جدید'}</Text>
              <TouchableOpacity onPress={resetForm}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View>
                <Text style={styles.inputLabel}>عنوان پرداختی</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="مثال: اجاره خانه" />
              </View>

              <View>
                <Text style={styles.inputLabel}>مبلغ (اختیاری)</Text>
                <TextInput style={[styles.input, { textAlign: 'left' }]} value={amount}
                  onChangeText={t => setAmount(t.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                  placeholder="2,000,000" keyboardType="numeric" />
              </View>

              <View>
                <Text style={styles.inputLabel}>نوع یادآور</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity style={[styles.typeBtn, reminderType === 'monthly' && styles.typeBtnActive]}
                    onPress={() => setReminderType('monthly')}>
                    <Text style={[styles.typeBtnText, reminderType === 'monthly' && styles.typeBtnTextActive]}>ماهانه</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.typeBtn, reminderType === 'onetime' && styles.typeBtnActive]}
                    onPress={() => setReminderType('onetime')}>
                    <Text style={[styles.typeBtnText, reminderType === 'onetime' && styles.typeBtnTextActive]}>تاریخ مشخص</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {reminderType === 'monthly' ? (
                <View>
                  <Text style={styles.inputLabel}>روز ماه</Text>
                  <TextInput style={[styles.input, { textAlign: 'left' }]} value={dueDate}
                    onChangeText={t => setDueDate(t.replace(/\D/g, ''))} placeholder="1" keyboardType="numeric" maxLength={2} />
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>تاریخ</Text>
                  <TouchableOpacity style={styles.dateField} onPress={() => setShowDatePicker(true)}>
                    <Feather name="calendar" size={18} color="#6b7280" />
                    <Text style={styles.dateFieldText}>
                      {selectedFullDate ? `${selectedFullDate.year}/${String(selectedFullDate.month).padStart(2, '0')}/${String(selectedFullDate.day).padStart(2, '0')}` : 'انتخاب تاریخ'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.saveBtn, !title.trim() && { backgroundColor: '#93c5fd' }]}
                onPress={handleSave} disabled={!title.trim()}>
                <Text style={styles.saveBtnText}>{editingReminder ? 'بروزرسانی' : 'ثبت یادآور'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="bell-off" size={32} color="#d1d5db" />
          <Text style={styles.emptyText}>هیچ یادآوری ثبت نشده است</Text>
        </View>
      ) : (
        reminders.map(r => {
          const due = isReminderDue(r);
          return (
            <View key={r.id} style={[styles.reminderCard, !r.isActive && styles.reminderCardInactive]}>
              <View style={styles.reminderTop}>
                <View style={styles.reminderLeft}>
                  <TouchableOpacity style={[styles.toggleBtn, r.isActive ? styles.toggleActive : styles.toggleInactive]}
                    onPress={() => toggleReminder(r.id)}>
                    <Feather name={r.isActive ? 'bell' : 'bell-off'} size={20} color={r.isActive ? '#2563eb' : '#9ca3af'} />
                  </TouchableOpacity>
                  <View>
                    <Text style={styles.reminderTitle}>{r.title}</Text>
                    {r.amount ? <Text style={styles.reminderAmount}>{r.amount.toLocaleString('en-US')} تومان</Text> : null}
                  </View>
                </View>
                <View style={styles.reminderActions}>
                  <TouchableOpacity onPress={() => startEdit(r)} style={styles.editBtn}>
                    <Feather name="edit" size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteReminder(r.id)} style={styles.deleteBtn}>
                    <Feather name="trash-2" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.reminderMeta}>
                <View style={[styles.reminderBadge, due && styles.reminderBadgeDue]}>
                  <Feather name={due ? 'alert-circle' : 'calendar'} size={14} color={due ? '#ef4444' : '#6b7280'} />
                  <Text style={[styles.reminderBadgeText, due && { color: '#ef4444' }]}>
                    {reminderLabel(r)}
                  </Text>
                </View>
                {due && (
                  <View style={styles.overdueBadge}>
                    <Feather name="alert-triangle" size={14} color="#fff" />
                    <Text style={styles.overdueBadgeText}>سررسید گذشته</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}

      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.dpOverlay}>
          <View style={styles.dpContainer}>
            <Text style={styles.dpTitle}>انتخاب تاریخ</Text>
            <Text style={styles.dpSubtitle}>شمسی</Text>
            <View style={styles.dpRow}>
              <View style={styles.dpCol}>
                <TouchableOpacity onPress={() => setDpYear(dpYear + 1)}>
                  <Feather name="chevron-up" size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text style={styles.dpValue}>{dpYear}</Text>
                <TouchableOpacity onPress={() => setDpYear(Math.max(dpYear - 1, 1300))}>
                  <Feather name="chevron-down" size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text style={styles.dpLabel}>سال</Text>
              </View>
              <View style={styles.dpCol}>
                <TouchableOpacity onPress={() => setDpMonth(dpMonth % 12 + 1)}>
                  <Feather name="chevron-up" size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text style={styles.dpValue}>{SHAMSI_MONTH_NAMES[dpMonth - 1]}</Text>
                <TouchableOpacity onPress={() => setDpMonth(dpMonth <= 1 ? 12 : dpMonth - 1)}>
                  <Feather name="chevron-down" size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text style={styles.dpLabel}>ماه</Text>
              </View>
              <View style={styles.dpCol}>
                <TouchableOpacity onPress={() => setDpDay(Math.min(dpDay + 1, maxDay))}>
                  <Feather name="chevron-up" size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text style={styles.dpValue}>{String(safeDay).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setDpDay(Math.max(dpDay - 1, 1))}>
                  <Feather name="chevron-down" size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text style={styles.dpLabel}>روز</Text>
              </View>
            </View>
            <View style={styles.dpActions}>
              <TouchableOpacity style={styles.dpCancel} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.dpCancelText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dpConfirm} onPress={confirmDate}>
                <Text style={styles.dpConfirmText}>تایید</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { fontFamily: 'Vazirmatn_400Regular', flex: 1, backgroundColor: '#f8fafc'},
  content: { fontFamily: 'Vazirmatn_400Regular', padding: 24, paddingBottom: 140},

  header: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, marginTop: 8},
  headerTitle: { fontSize: 20, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  headerSub: { fontFamily: 'Vazirmatn_400Regular', fontSize: 13, color: '#6b7280', marginTop: 4},
  addIcon: { fontFamily: 'Vazirmatn_400Regular', width: 40, height: 40, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc', marginTop: 80, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  modalBody: { padding: 24, gap: 20, paddingBottom: 120 },
  modalFooter: { position: 'absolute', bottom: 0, width: '100%', padding: 24, paddingBottom: 32 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },

  inputLabel: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280', marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Vazirmatn_500Medium', borderWidth: 1, borderColor: '#f3f4f6' },

  typeToggle: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4},
  typeBtn: { fontFamily: 'Vazirmatn_400Regular', flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
  typeBtnActive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff'},
  typeBtnText: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#9ca3af' },
  typeBtnTextActive: { fontFamily: 'Vazirmatn_400Regular', color: '#2563eb'},

  dateField: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  dateFieldText: { fontFamily: 'Vazirmatn_400Regular', flex: 1, fontSize: 14, color: '#1f2937', textAlign: 'center' },

  emptyState: { fontFamily: 'Vazirmatn_400Regular', alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e5e7eb', gap: 16, marginTop: 16},
  emptyText: { fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af' },

  reminderCard: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#dbeafe' },
  reminderCardInactive: { fontFamily: 'Vazirmatn_400Regular', opacity: 0.6, borderColor: '#f3f4f6'},
  reminderTop: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12},
  reminderLeft: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 12},
  toggleBtn: { fontFamily: 'Vazirmatn_400Regular', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  toggleActive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#eff6ff'},
  toggleInactive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#f3f4f6'},
  reminderTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  reminderAmount: { fontSize: 12, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium', marginTop: 2 },
  reminderActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },

  reminderMeta: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 0},
  reminderBadge: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start'},
  reminderBadgeDue: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fef2f2'},
  reminderBadgeText: { fontSize: 11, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280' },

  overdueBadge: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10},
  overdueBadgeText: { fontSize: 11, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },

  dpOverlay: { fontFamily: 'Vazirmatn_400Regular', flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  dpContainer: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  dpTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 4 },
  dpSubtitle: { fontSize: 11, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium', marginBottom: 20 },
  dpRow: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', gap: 24, marginBottom: 24 },
  dpCol: { fontFamily: 'Vazirmatn_400Regular', alignItems: 'center', gap: 8, minWidth: 80 },
  dpValue: { fontSize: 20, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', textAlign: 'center', minHeight: 30 },
  dpLabel: { fontSize: 11, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium' },
  dpActions: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', gap: 16, width: '100%' },
  dpCancel: { fontFamily: 'Vazirmatn_400Regular', flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center' },
  dpCancelText: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280' },
  dpConfirm: { fontFamily: 'Vazirmatn_400Regular', flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center' },
  dpConfirmText: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },
});
