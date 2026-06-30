import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

type Period = 'month' | '3months' | '6months' | 'year';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'month', label: 'این ماه' },
  { key: '3months', label: '۳ ماهه' },
  { key: '6months', label: '۶ ماهه' },
  { key: 'year', label: 'امسال' },
];

interface PeriodPickerProps {
  selected: Period;
  onSelect: (period: Period) => void;
}

export default function PeriodPicker({ selected, onSelect }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const activeItem = PERIOD_OPTIONS.find(o => o.key === selected);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>دوره</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <View style={styles.pickerRow}>
          <Text style={styles.pickerText}>{activeItem?.label || 'انتخاب'}</Text>
          <Feather name="chevron-down" size={18} color="#9ca3af" />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>دوره</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.sheetClose}>
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.list}>
              {PERIOD_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.key}
                  style={[styles.card, selected === opt.key && styles.cardSelected]}
                  onPress={() => { onSelect(opt.key); setOpen(false); }}>
                  <Text style={[styles.cardText, selected === opt.key && styles.cardTextSelected]}>{opt.label}</Text>
                  {selected === opt.key && (
                    <Feather name="check-circle" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 6 },
  label: { fontSize: 13, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', paddingHorizontal: 4 },
  pickerBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { flex: 1, fontSize: 14, fontFamily: 'Vazirmatn_600SemiBold', color: '#1f2937' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: '#fff', borderRadius: 24, maxHeight: '70%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 30, elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  sheetTitle: { fontSize: 16, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  sheetClose: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fafafa', borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardSelected: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  cardText: { fontSize: 14, fontFamily: 'Vazirmatn_600SemiBold', color: '#1f2937' },
  cardTextSelected: { color: '#2563eb' },
});
