import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { gregorianToShamsi, shamsiToGregorian, SHAMSI_MONTH_NAMES, isShamsiLeapYear } from '../utils';

interface ShamsiDatePickerProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function ShamsiDatePicker({ visible, date, onConfirm, onCancel }: ShamsiDatePickerProps) {
  const initial = gregorianToShamsi(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const [dpYear, setDpYear] = useState(initial.year);
  const [dpMonth, setDpMonth] = useState(initial.month);
  const [dpDay, setDpDay] = useState(initial.day);

  useEffect(() => {
    const s = gregorianToShamsi(date.getFullYear(), date.getMonth() + 1, date.getDate());
    setDpYear(s.year);
    setDpMonth(s.month);
    setDpDay(s.day);
  }, [visible]);

  const maxDay = (dpMonth <= 6 ? 31 : dpMonth <= 11 ? 30 : isShamsiLeapYear(dpYear) ? 30 : 29);
  const safeDay = Math.min(dpDay, maxDay);

  const confirmDate = () => {
    const d = shamsiToGregorian(dpYear, dpMonth, safeDay);
    d.setHours(12, 0, 0, 0);
    onConfirm(d);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
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
            <TouchableOpacity style={styles.dpCancel} onPress={onCancel}>
              <Text style={styles.dpCancelText}>انصراف</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpConfirm} onPress={confirmDate}>
              <Text style={styles.dpConfirmText}>تایید</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dpOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dpContainer: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%', alignItems: 'center',
  },
  dpTitle: {
    fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 4,
  },
  dpSubtitle: {
    fontSize: 12, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium', marginBottom: 20,
  },
  dpRow: {
    flexDirection: 'row', gap: 24, marginBottom: 20,
  },
  dpCol: {
    alignItems: 'center', gap: 8,
  },
  dpValue: {
    fontSize: 22, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', minWidth: 60, textAlign: 'center',
  },
  dpLabel: {
    fontSize: 11, color: '#9ca3af', fontFamily: 'Vazirmatn_500Medium',
  },
  dpActions: {
    flexDirection: 'row', gap: 16,
  },
  dpCancel: {
    paddingHorizontal: 28, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f3f4f6',
  },
  dpCancelText: {
    fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280',
  },
  dpConfirm: {
    paddingHorizontal: 28, paddingVertical: 10, borderRadius: 12, backgroundColor: '#2563eb',
  },
  dpConfirmText: {
    fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#fff',
  },
});
