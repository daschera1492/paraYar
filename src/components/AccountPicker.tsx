import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatCurrency } from '../utils';
import { useFinance } from '../context/FinanceContext';

interface AccountPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
  excludeId?: string;
  showAll?: boolean;
}

export default function AccountPicker({ selectedId, onSelect, label, excludeId, showAll }: AccountPickerProps) {
  const { accounts, getAccountBalance } = useFinance();
  const [open, setOpen] = useState(false);

  const filtered = excludeId ? accounts.filter(a => a.id !== excludeId) : accounts;

  const selected = selectedId === 'all'
    ? null
    : accounts.find(a => a.id === selectedId);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        {selectedId === 'all' ? (
          <View style={styles.pickerRow}>
            <Text style={styles.pickerText}>همه حساب‌ها</Text>
            <Feather name="chevron-down" size={18} color="#9ca3af" />
          </View>
        ) : selected ? (
            <View style={styles.pickerRow}>
              <View style={[styles.dot, { backgroundColor: selected.color }]} />
              <Text style={styles.pickerText} numberOfLines={1} ellipsizeMode="tail">{selected.name}</Text>
              <Feather name="chevron-down" size={18} color="#9ca3af" />
            </View>
        ) : (
          <Text style={styles.placeholder}>انتخاب حساب...</Text>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.sheetClose}>
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.list}>
              {showAll && (
                <TouchableOpacity style={[styles.card, selectedId === 'all' && styles.cardSelected]}
                  onPress={() => { onSelect('all'); setOpen(false); }}>
                  <Text style={[styles.cardName, { flex: 1 }]}>همه حساب‌ها</Text>
                  {selectedId === 'all' && (
                    <Feather name="check-circle" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
              {filtered.map(acct => {
                const balance = getAccountBalance(acct.id);
                return (
                  <TouchableOpacity key={acct.id}
                    style={[styles.card, selectedId === acct.id && styles.cardSelected]}
                    onPress={() => { onSelect(acct.id); setOpen(false); }}>
                    <View style={[styles.cardDot, { backgroundColor: acct.color }]} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{acct.name}</Text>
                      <Text style={styles.cardBalance}>{formatCurrency(balance)}</Text>
                    </View>
                    {selectedId === acct.id && (
                      <Feather name="check-circle" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', paddingHorizontal: 4 },
  pickerBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pickerText: { flex: 1, fontSize: 14, fontFamily: 'Vazirmatn_600SemiBold', color: '#1f2937' },
  placeholder: { fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af' },
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fafafa', borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardSelected: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  cardDot: { width: 14, height: 14, borderRadius: 7 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontFamily: 'Vazirmatn_600SemiBold', color: '#1f2937' },
  cardBalance: { fontSize: 12, fontFamily: 'Vazirmatn_500Medium', color: '#6b7280', marginTop: 2 },
});
