import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { Reminder } from '../types';
import { gregorianToShamsi, shamsiToGregorian, SHAMSI_MONTH_NAMES, formatShamsiDate } from '../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTERVALS = [
  { label: 'بدون تکرار', value: 0 },
  { label: 'هر ۱ ساعت', value: 1 },
  { label: 'هر ۲ ساعت', value: 2 },
  { label: 'هر ۳ ساعت', value: 3 },
  { label: 'هر ۴ ساعت', value: 4 },
];

function isReminderDue(r: Reminder): boolean {
  const now = new Date();
  const s = gregorianToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const todayOrdinal = s.year * 10000 + s.month * 100 + s.day;
  if (r.type === 'monthly') {
    const currentOrdinal = s.year * 10000 + s.month * 100 + s.day;
    const dueOrdinal = s.year * 10000 + s.month * 100 + r.dueDate;
    return currentOrdinal >= dueOrdinal;
  } else {
    if (!r.dueYear || !r.dueMonth) return false;
    const dueOrdinal = r.dueYear * 10000 + r.dueMonth * 100 + r.dueDate;
    return todayOrdinal >= dueOrdinal;
  }
}

export default function RemindersScreen() {
  const { reminders, addReminder, deleteReminder, toggleReminder, completeReminder } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [reminderType, setReminderType] = useState<'monthly' | 'onetime'>('monthly');
  const [dueDate, setDueDate] = useState('1');
  const [notificationInterval, setNotificationInterval] = useState(0);

  // date picker state for onetime
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

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const scheduleReminderNotifications = async (r: Reminder) => {
    if (!r.isActive || r.notificationInterval <= 0) return;
    const today = new Date();
    const todayS = gregorianToShamsi(today.getFullYear(), today.getMonth() + 1, today.getDate());
    let targetDate: Date;
    if (r.type === 'monthly') {
      targetDate = shamsiToGregorian(todayS.year, todayS.month, r.dueDate);
      if (targetDate < today) {
        if (todayS.month === 12) {
          targetDate = shamsiToGregorian(todayS.year + 1, 1, r.dueDate);
        } else {
          targetDate = shamsiToGregorian(todayS.year, todayS.month + 1, r.dueDate);
        }
      }
    } else {
      if (!r.dueYear || !r.dueMonth) return;
      targetDate = shamsiToGregorian(r.dueYear, r.dueMonth, r.dueDate);
    }
    if (targetDate < today) return;
    const msUntilTarget = targetDate.getTime() - today.getTime();
    const hoursUntilTarget = msUntilTarget / 3600000;
    const totalNotifications = Math.floor(hoursUntilTarget / r.notificationInterval);
    if (totalNotifications <= 0) return;
    const key = `reminder_sched_${r.id}`;
    const lastScheduled = await AsyncStorage.getItem(key);
    if (lastScheduled === targetDate.toDateString()) return;
    await AsyncStorage.setItem(key, targetDate.toDateString());
    for (let i = 0; i < Math.min(totalNotifications, 8); i++) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `یادآور پرداخت: ${r.title}`,
          body: r.amount ? `مبلغ: ${r.amount.toLocaleString('en-US')} تومان - موعد پرداخت` : 'موعد پرداخت فرا رسیده است',
          sound: true,
        },
          trigger: { seconds: Math.round(i * r.notificationInterval * 3600) + 1 } as any,
      });
    }
  };

  useEffect(() => {
    const checkReminders = async () => {
      for (const r of reminders) {
        if (!r.isActive || r.completed) continue;
        if (isReminderDue(r)) {
          const key = `reminder_shown_${r.id}_${new Date().toDateString()}`;
          const lastShown = await AsyncStorage.getItem(key);
          if (!lastShown) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `یادآور پرداخت: ${r.title}`,
                body: r.amount ? `مبلغ: ${r.amount.toLocaleString('en-US')} تومان` : 'امروز موعد پرداخت است.',
              },
              trigger: { seconds: 1 } as any,
            });
            await AsyncStorage.setItem(key, 'true');
          }
          scheduleReminderNotifications(r);
        }
      }
    };
    checkReminders();
  }, [reminders]);

  const handleAdd = () => {
    if (!title.trim()) return;
    const rem: Omit<Reminder, 'id'> = {
      title: title.trim(),
      amount: amount ? Number(amount.replace(/\D/g, '')) : undefined,
      type: reminderType,
      dueDate: reminderType === 'monthly' ? Number(dueDate) : (selectedFullDate?.day || 1),
      dueYear: reminderType === 'onetime' ? selectedFullDate?.year : undefined,
      dueMonth: reminderType === 'onetime' ? selectedFullDate?.month : undefined,
      isActive: true,
      notificationInterval,
      completed: false,
    };
    addReminder(rem);
    setTitle('');
    setAmount('');
    setDueDate('1');
    setSelectedFullDate(null);
    setNotificationInterval(0);
    setReminderType('monthly');
    setIsAdding(false);
  };

  const confirmDate = () => {
    setSelectedFullDate({ year: dpYear, month: dpMonth, day: dpDay });
    setShowDatePicker(false);
  };

  const maxDay = dpMonth <= 6 ? 31 : dpMonth === 12 ? 30 : 30;
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
        <TouchableOpacity style={styles.addIcon} onPress={() => setIsAdding(true)}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          <View style={styles.addFormHeader}>
            <Text style={styles.addFormTitle}>یادآور جدید</Text>
            <TouchableOpacity onPress={() => setIsAdding(false)}>
              <Feather name="x" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View>
            <Text style={styles.inputLabel}>عنوان پرداختی</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="مثال: اجاره خانه" />
          </View>

          <View style={styles.addFormRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>مبلغ (اختیاری)</Text>
              <TextInput style={[styles.input, { textAlign: 'left' }]} value={amount}
                onChangeText={t => setAmount(t.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                placeholder="2,000,000" keyboardType="numeric" />
            </View>
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

          <View>
            <Text style={styles.inputLabel}>تکرار نوتیفیکیشن در روز موعد</Text>
            <View style={styles.intervalRow}>
              {INTERVALS.map(item => (
                <TouchableOpacity key={item.value}
                  style={[styles.intervalBtn, notificationInterval === item.value && styles.intervalBtnActive]}
                  onPress={() => setNotificationInterval(item.value)}>
                  <Text style={[styles.intervalBtnText, notificationInterval === item.value && styles.intervalBtnTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.saveReminderBtn, !title.trim() && { backgroundColor: '#93c5fd' }]}
            onPress={handleAdd} disabled={!title.trim()}>
            <Text style={styles.saveReminderBtnText}>ثبت یادآور</Text>
          </TouchableOpacity>
        </View>
      )}

      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="bell-off" size={32} color="#d1d5db" />
          <Text style={styles.emptyText}>هیچ یادآوری ثبت نشده است</Text>
        </View>
      ) : (
        reminders.map(r => {
          const due = isReminderDue(r);
          return (
            <View key={r.id} style={[styles.reminderCard, !r.isActive && styles.reminderCardInactive, r.completed && styles.reminderCardCompleted]}>
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
                <TouchableOpacity onPress={() => deleteReminder(r.id)} style={{ padding: 8 }}>
                  <Feather name="trash-2" size={16} color="#d1d5db" />
                </TouchableOpacity>
              </View>

              <View style={styles.reminderMeta}>
                <View style={[styles.reminderBadge, due && !r.completed && styles.reminderBadgeDue]}>
                  <Feather name={due && !r.completed ? 'alert-circle' : 'calendar'} size={14} color={due && !r.completed ? '#ef4444' : '#6b7280'} />
                  <Text style={[styles.reminderBadgeText, due && !r.completed && { color: '#ef4444' }]}>
                    {reminderLabel(r)}
                  </Text>
                </View>
                {r.notificationInterval > 0 && (
                  <View style={styles.reminderBadge}>
                    <Feather name="clock" size={14} color="#2563eb" />
                    <Text style={[styles.reminderBadgeText, { color: '#2563eb' }]}>
                      هر {r.notificationInterval} ساعت
                    </Text>
                  </View>
                )}
                {r.completed && (
                  <View style={[styles.reminderBadge, { backgroundColor: '#d1fae5' }]}>
                    <Feather name="check-circle" size={14} color="#059669" />
                    <Text style={[styles.reminderBadgeText, { color: '#059669' }]}>پرداخت شد</Text>
                  </View>
                )}
              </View>

              <View style={styles.reminderActions}>
                <TouchableOpacity style={[styles.actionBtn, r.completed ? styles.actionBtnUnpaid : styles.actionBtnPaid]}
                  onPress={() => completeReminder(r.id)}>
                  <Feather name={r.completed ? 'x' : 'check'} size={14} color={r.completed ? '#f59e0b' : '#fff'} />
                  <Text style={[styles.actionBtnText, { color: r.completed ? '#f59e0b' : '#fff' }]}>
                    {r.completed ? 'لغو پرداخت' : 'پرداخت شد'}
                  </Text>
                </TouchableOpacity>
                {due && !r.completed && (
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

  addForm: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6', gap: 16},
  addFormHeader: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  addFormTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  inputLabel: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280', marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Vazirmatn_500Medium', borderWidth: 1, borderColor: '#f3f4f6' },
  addFormRow: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', gap: 12},

  typeToggle: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4},
  typeBtn: { fontFamily: 'Vazirmatn_400Regular', flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
  typeBtnActive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff'},
  typeBtnText: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#9ca3af' },
  typeBtnTextActive: { fontFamily: 'Vazirmatn_400Regular', color: '#2563eb'},

  dateField: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  dateFieldText: { fontFamily: 'Vazirmatn_400Regular', flex: 1, fontSize: 14, color: '#1f2937', textAlign: 'center' },

  intervalRow: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  intervalBtn: { fontFamily: 'Vazirmatn_400Regular', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb'},
  intervalBtnActive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#eff6ff', borderColor: '#2563eb'},
  intervalBtnText: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280' },
  intervalBtnTextActive: { fontFamily: 'Vazirmatn_400Regular', color: '#2563eb'},

  saveReminderBtn: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4},
  saveReminderBtnText: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },

  emptyState: { fontFamily: 'Vazirmatn_400Regular', alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e5e7eb', gap: 16, marginTop: 16},
  emptyText: { fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af' },

  reminderCard: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#dbeafe', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  reminderCardInactive: { fontFamily: 'Vazirmatn_400Regular', opacity: 0.6, borderColor: '#f3f4f6'},
  reminderCardCompleted: { fontFamily: 'Vazirmatn_400Regular', borderColor: '#a7f3d0', backgroundColor: '#f0fdf4'},
  reminderTop: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12},
  reminderLeft: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 12},
  toggleBtn: { fontFamily: 'Vazirmatn_400Regular', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  toggleActive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#eff6ff'},
  toggleInactive: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#f3f4f6'},
  reminderTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  reminderAmount: { fontSize: 12, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium', marginTop: 2 },

  reminderMeta: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  reminderBadge: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start'},
  reminderBadgeDue: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fef2f2'},
  reminderBadgeText: { fontSize: 11, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280' },

  reminderActions: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 10},
  actionBtn: { fontFamily: 'Vazirmatn_400Regular', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10},
  actionBtnPaid: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#059669'},
  actionBtnUnpaid: { fontFamily: 'Vazirmatn_400Regular', backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a'},
  actionBtnText: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold' },

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
