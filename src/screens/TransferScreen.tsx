import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import CurrencyInput from '../components/CurrencyInput';
import ShamsiDatePicker from '../components/ShamsiDatePicker';
import AccountPicker from '../components/AccountPicker';
import { formatShamsiDate } from '../utils';

interface TransferScreenProps {
  onClose: () => void;
}

export default function TransferScreen({ onClose }: TransferScreenProps) {
  const { accounts, addTransaction } = useFinance();
  const [fromAccountId, setFromAccountId] = useState(accounts.length > 0 ? accounts[0].id : '');
  const [toAccountId, setToAccountId] = useState(accounts.length > 1 ? accounts[1].id : '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleTransfer = () => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('خطا', 'لطفاً مبلغ معتبر وارد کنید.');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      Alert.alert('خطا', 'لطفاً حساب مبدأ و مقصد را انتخاب کنید.');
      return;
    }
    if (fromAccountId === toAccountId) {
      Alert.alert('خطا', 'حساب مبدأ و مقصد نمی‌توانند یکی باشند.');
      return;
    }

    const dateStr = date.toISOString();
    addTransaction({ type: 'expense', amount: amt, categoryId: 'transfer', note: `انتقال به ${accounts.find(a => a.id === toAccountId)?.name || ''}`, date: dateStr, accountId: fromAccountId });
    addTransaction({ type: 'income', amount: amt, categoryId: 'transfer_in', note: `انتقال از ${accounts.find(a => a.id === fromAccountId)?.name || ''}`, date: dateStr, accountId: toAccountId });

    Alert.alert('موفق', 'انتقال با موفقیت انجام شد.', [{ text: 'باشه', onPress: onClose }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>انتقال وجه</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.transferIllustration}>
          <View style={styles.arrowCircle}>
            <Feather name="repeat" size={32} color="#2563eb" />
          </View>
          <Text style={styles.transferDesc}>انتقال پول بین حساب‌های خود</Text>
        </View>

        <AccountPicker label="از حساب" selectedId={fromAccountId}
          onSelect={(id) => { setFromAccountId(id); if (toAccountId === id) setToAccountId(''); }}
          excludeId={toAccountId || undefined} />

        <View style={styles.arrowDown}>
          <Feather name="arrow-down" size={24} color="#9ca3af" />
        </View>

        <AccountPicker label="به حساب" selectedId={toAccountId}
          onSelect={(id) => setToAccountId(id)}
          excludeId={fromAccountId || undefined} />

        <CurrencyInput value={amount} onChangeAmount={setAmount} label="مبلغ انتقال (تومان)"
          placeholder="0" autoFocus={false}
          inputStyle={{ fontSize: 36, textAlign: 'center', color: '#2563eb' }}
          containerStyle={{ alignItems: 'center', marginBottom: 8 }}
          wrapperStyle={{ borderWidth: 0, backgroundColor: 'transparent', height: 56 }}
          suffixStyle={{ fontSize: 16, color: '#9ca3af' }} />

        <TouchableOpacity style={styles.dateField} onPress={() => setShowDatePicker(true)}>
          <Feather name="calendar" size={20} color="#6b7280" />
          <Text style={styles.dateFieldText}>{formatShamsiDate(date)}</Text>
          <Feather name="chevron-down" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.transferBtn, (!amount || !toAccountId) && styles.transferBtnDisabled]}
          onPress={handleTransfer} disabled={!amount || !toAccountId} activeOpacity={0.9}>
          <Feather name="repeat" size={20} color="#fff" />
          <Text style={styles.transferBtnText}>انتقال وجه</Text>
        </TouchableOpacity>
      </View>

      <ShamsiDatePicker visible={showDatePicker} date={date}
        onConfirm={(d) => { setDate(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  body: { flex: 1 },
  bodyContent: { padding: 24, paddingBottom: 120, gap: 24 },
  transferIllustration: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  arrowCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  transferDesc: { fontSize: 14, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium' },

  arrowDown: { alignItems: 'center' },
  dateField: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  dateFieldText: { flex: 1, fontSize: 16, color: '#1f2937', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 24, paddingBottom: 32 },
  transferBtn: { backgroundColor: '#2563eb', borderRadius: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  transferBtnDisabled: { backgroundColor: '#d1d5db' },
  transferBtnText: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },
});
