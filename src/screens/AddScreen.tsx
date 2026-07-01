import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, Platform, PermissionsAndroid,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { parseBankSMS, gregorianToShamsi, formatShamsiDate } from '../utils';
import CurrencyInput from '../components/CurrencyInput';
import ShamsiDatePicker from '../components/ShamsiDatePicker';

const iconMap: Record<string, any> = {
  'credit-card': 'credit-card', monitor: 'monitor', gift: 'gift', coffee: 'coffee',
  truck: 'truck', 'shopping-bag': 'shopping-bag', home: 'home', 'file-text': 'file-text',
  film: 'film', activity: 'activity', zap: 'zap', repeat: 'repeat',
};

interface AddScreenProps {
  onClose: () => void;
  initialSmsData?: { amount: number; type: TransactionType; bankName: string; cardSuffix: string } | null;
}

export default function AddScreen({ onClose, initialSmsData }: AddScreenProps) {
  const { addTransaction, updateTransaction, transactions, editingTransactionId, setEditingTransactionId, categories, accounts, addRecurring } = useFinance();

  const editingTx = editingTransactionId ? transactions.find(t => t.id === editingTransactionId) : null;

  const [type, setType] = useState<TransactionType>(editingTx?.type || 'expense');
  const [amount, setAmount] = useState<string>(editingTx ? String(editingTx.amount) : '');
  const [categoryId, setCategoryId] = useState<string>(editingTx?.categoryId || '');
  const [note, setNote] = useState<string>(editingTx?.note || '');
  const [accountId, setAccountId] = useState<string>(editingTx?.accountId || (accounts.length > 0 ? accounts[0].id : ''));
  const [smsText, setSmsText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any>(null);
  const [showSmsArea, setShowSmsArea] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [intervalValue, setIntervalValue] = useState('1');

  const initialDate = editingTx ? new Date(editingTx.date) : new Date();
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [txDate, setTxDate] = useState<Date>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (initialSmsData) {
      setAmount(String(initialSmsData.amount));
      setType(initialSmsData.type);
      setNote(`${initialSmsData.bankName}${initialSmsData.cardSuffix ? ` - کارت ${initialSmsData.cardSuffix}` : ''}`);
      const valid = categories.filter(c => c.type === initialSmsData.type);
      if (valid.length > 0) setCategoryId(valid[0].id);
    }
  }, [initialSmsData]);

  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setAmount(String(editingTx.amount));
      setCategoryId(editingTx.categoryId);
      setNote(editingTx.note);
      setTxDate(new Date(editingTx.date));
      if (editingTx.accountId) setAccountId(editingTx.accountId);
    }
  }, [editingTx]);

  const handleClose = () => {
    setEditingTransactionId(null);
    onClose();
  };

  const requestSmsPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'دسترسی به پیامک',
          message: 'برای شناسایی خودکار پیامک‌های بانکی، لطفاً اجازه دسترسی به پیامک‌ها را بدهید.',
          buttonPositive: 'اجازه',
          buttonNegative: 'رد',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const handlePasteSMS = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      setSmsText(text);
      const parsed = parseBankSMS(text);
      setParsedPreview(parsed);
      if (parsed) {
        setShowSmsArea(true);
      } else {
        Alert.alert('خطا', 'پیامک بانکی معتبری در حافظه یافت نشد یا قابل تشخیص نیست.');
      }
    } catch {
      Alert.alert('خطا', 'دسترسی به کلیپ‌بورد امکان‌پذیر نیست.');
      setShowSmsArea(true);
    }
  };

  const handleOpenSmsSection = () => {
    setShowSmsArea(!showSmsArea);
    if (!showSmsArea) {
      requestSmsPermission();
    }
  };

  const pickReceipt = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('دسترسی', 'لطفاً دسترسی به گالری را فعال کنید.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('دسترسی', 'لطفاً دسترسی به دوربین را فعال کنید.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || !categoryId) return;

    const dateStr = txDate.toISOString();
    const txData = { type, amount: amt, categoryId, note, date: dateStr, accountId };

    if (isRecurring && !editingTx) {
      addRecurring({
        amount: amt, type, categoryId, note,
        accountId,
        frequency,
        intervalValue: Number(intervalValue) || 1,
        startDate: dateStr,
        isActive: true,
      });
    } else if (editingTx) {
      updateTransaction(editingTx.id, txData);
    } else {
      addTransaction(txData);
    }
    handleClose();
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingTx ? 'ویرایش تراکنش' : 'تراکنش جدید'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          <View style={styles.typeToggle}>
            <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
              onPress={() => setType('expense')}>
              <Text style={[styles.typeBtnText, type === 'expense' && { color: '#e11d48' }]}>هزینه (پرداختی)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
              onPress={() => setType('income')}>
              <Text style={[styles.typeBtnText, type === 'income' && { color: '#059669' }]}>درآمد (دریافتی)</Text>
            </TouchableOpacity>
          </View>

          {!editingTx && (
            <View style={styles.smsWidget}>
              <View style={styles.smsHeader}>
                <View style={styles.smsHeaderLeft}>
                  <View style={styles.smsIconBox}>
                    <Feather name="zap" size={16} color="#4f46e5" />
                  </View>
                  <Text style={styles.smsTitle}>پردازشگر خودکار پیامک بانکی</Text>
                </View>
                <TouchableOpacity onPress={handleOpenSmsSection}>
                  <Text style={styles.smsToggle}>{showSmsArea ? 'بستن' : 'باز کردن'}</Text>
                </TouchableOpacity>
              </View>

              {showSmsArea && (
                <View style={styles.smsBody}>
                  <Text style={styles.smsDesc}>متن پیامک واریز یا برداشت بانک خود را در کادر زیر کپی کنید:</Text>
                  <View style={styles.smsInputRow}>
                    <TextInput style={styles.smsInput} multiline numberOfLines={3}
                      value={smsText} onChangeText={t => { setSmsText(t); setParsedPreview(parseBankSMS(t)); }}
                      placeholder="متن پیامک بانکی را اینجا جایگذاری کنید..." textAlignVertical="top" />
                    {!smsText && (
                      <TouchableOpacity style={styles.pasteBtn} onPress={handlePasteSMS}>
                        <Feather name="clipboard" size={14} color="#4f46e5" />
                        <Text style={styles.pasteBtnText}>جایگذاری از حافظه</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {parsedPreview && (
                    <View style={styles.parsedPreview}>
                      <View style={styles.parsedHeader}>
                        <View style={styles.parsedBank}>
                          <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                          <Text style={styles.parsedBankName}>{parsedPreview.bankName}</Text>
                        </View>
                        <Text style={[styles.parsedType, { backgroundColor: parsedPreview.type === 'income' ? '#d1fae5' : '#ffe4e6', color: parsedPreview.type === 'income' ? '#047857' : '#be123c' }]}>
                          {parsedPreview.type === 'income' ? 'واریز' : 'برداشت'}
                        </Text>
                      </View>
                      <View style={styles.parsedDetails}>
                        <View>
                          <Text style={styles.parsedLabel}>مبلغ:</Text>
                          <Text style={styles.parsedValue}>{Number(parsedPreview.amount).toLocaleString('fa-IR')} تومان</Text>
                        </View>
                        {parsedPreview.cardSuffix ? (
                          <View>
                            <Text style={styles.parsedLabel}>کارت:</Text>
                            <Text style={styles.parsedValue}>**** {parsedPreview.cardSuffix}</Text>
                          </View>
                        ) : null}
                      </View>
                      <TouchableOpacity style={styles.applyBtn} onPress={() => {
                        setAmount(String(parsedPreview.amount));
                        setType(parsedPreview.type);
                        setNote(`${parsedPreview.bankName} - کارت ${parsedPreview.cardSuffix}`);
                        const valid = categories.filter(c => c.type === parsedPreview.type);
                        if (valid.length > 0) setCategoryId(valid[0].id);
                        setSmsText('');
                        setParsedPreview(null);
                        setShowSmsArea(false);
                      }}>
                        <Feather name="check" size={14} color="#fff" />
                        <Text style={styles.applyBtnText}>تایید و پر کردن خودکار فرم</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {smsText && !parsedPreview && (
                    <View style={styles.noParse}>
                      <Feather name="x" size={14} color="#92400e" />
                      <Text style={styles.noParseText}>پیامک بانکی شناسایی نشد.</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          <CurrencyInput value={amount} onChangeAmount={setAmount} label="مبلغ (تومان)"
            placeholder="0" autoFocus
            inputStyle={{ fontSize: 48, textAlign: 'center', color: type === 'expense' ? '#f43f5e' : '#10b981' }}
            containerStyle={{ alignItems: 'center', marginBottom: 8 }}
            wrapperStyle={{ borderWidth: 0, backgroundColor: 'transparent', height: 64 }}
            suffixStyle={{ fontSize: 18, color: '#9ca3af' }} />

          {accounts.length > 1 && (
            <View style={styles.accountSection}>
              <Text style={styles.sectionLabel}>حساب</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountList}>
                {accounts.map(acct => (
                  <TouchableOpacity key={acct.id} style={[styles.accountChip, accountId === acct.id && { backgroundColor: acct.color + '20', borderColor: acct.color }]}
                    onPress={() => setAccountId(acct.id)}>
                    <Text style={[styles.accountChipText, accountId === acct.id && { color: acct.color }]}>{acct.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.dateField} onPress={openDatePicker}>
            <Feather name="calendar" size={20} color="#6b7280" />
            <Text style={styles.dateFieldText}>{formatShamsiDate(txDate)}</Text>
            <Feather name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.categorySection}>
            <Text style={styles.sectionLabel}>دسته‌بندی</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map(cat => {
                const iconName = iconMap[cat.icon] || 'credit-card';
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => setCategoryId(cat.id)} activeOpacity={0.7}>
                    <View style={[styles.categoryIcon, isSelected && { backgroundColor: cat.color }, !isSelected && styles.categoryIconInactive]}>
                      <Feather name={iconName} size={24} color={isSelected ? '#fff' : '#9ca3af'} />
                    </View>
                    <Text style={[styles.categoryName, isSelected && { color: '#1f2937', fontFamily: 'Vazirmatn_700Bold' }]} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
              {filteredCategories.length === 0 && (
                <Text style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>
                  دسته‌بندی‌ای برای این نوع وجود ندارد
                </Text>
              )}
            </View>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.sectionLabel}>توضیحات (اختیاری)</Text>
            <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="مثلاً: خرید از فروشگاه رفاه..." />
          </View>

          <View style={styles.receiptSection}>
            <Text style={styles.sectionLabel}>رسید / عکس</Text>
            <View style={styles.receiptRow}>
              <TouchableOpacity style={styles.receiptBtn} onPress={pickReceipt}>
                <Feather name="image" size={20} color="#4f46e5" />
                <Text style={styles.receiptBtnText}>از گالری</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.receiptBtn} onPress={takePhoto}>
                <Feather name="camera" size={20} color="#4f46e5" />
                <Text style={styles.receiptBtnText}>دوربین</Text>
              </TouchableOpacity>
              {receiptUri && (
                <TouchableOpacity style={styles.receiptRemoveBtn} onPress={() => setReceiptUri(null)}>
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            {receiptUri && (
              <View style={styles.receiptPreview}>
                <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
              </View>
            )}
          </View>

          {!editingTx && (
            <View style={styles.recurringSection}>
              <TouchableOpacity style={styles.recurringToggle} onPress={() => setIsRecurring(!isRecurring)}>
                <View style={[styles.checkbox, isRecurring && styles.checkboxActive]}>
                  {isRecurring && <Feather name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.recurringLabel}>تراکنش دوره‌ای (مکرر)</Text>
              </TouchableOpacity>

              {isRecurring && (
                <View style={styles.recurringOptions}>
                  <View style={styles.freqRow}>
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(f => (
                      <TouchableOpacity key={f} style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                        onPress={() => setFrequency(f)}>
                        <Text style={[styles.freqBtnText, frequency === f && styles.freqBtnTextActive]}>
                          {f === 'daily' ? 'روزانه' : f === 'weekly' ? 'هفتگی' : f === 'monthly' ? 'ماهانه' : 'سالیانه'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.intervalRow}>
                    <Text style={styles.intervalLabel}>هر</Text>
                    <TextInput style={styles.intervalInput} value={intervalValue}
                      onChangeText={t => setIntervalValue(t.replace(/\D/g, ''))} keyboardType="numeric" />
                    <Text style={styles.intervalLabel}>
                      {frequency === 'daily' ? 'روز' : frequency === 'weekly' ? 'هفته' : frequency === 'monthly' ? 'ماه' : 'سال'} یکبار
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.saveBtn, (!amount || !categoryId) && styles.saveBtnDisabled]}
            onPress={handleSave} disabled={!amount || !categoryId} activeOpacity={0.9}>
            <Text style={styles.saveBtnText}>
              {editingTx ? 'ذخیره تغییرات' : isRecurring ? 'ثبت تراکنش مکرر' : 'ثبت تراکنش'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ShamsiDatePicker visible={showDatePicker} date={txDate}
        onConfirm={(d) => { setTxDate(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f8fafc', zIndex: 100},
  container: { flex: 1},
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  backBtn: { padding: 8},
  headerTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  body: { flex: 1},
  bodyContent: { padding: 24, paddingBottom: 120, gap: 32},

  typeToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 6},
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center'},
  typeBtnActiveExpense: { backgroundColor: '#fff'},
  typeBtnActiveIncome: { backgroundColor: '#fff'},
  typeBtnText: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#6b7280' },

  smsWidget: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f3f4f6'},
  smsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  smsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8},
  smsIconBox: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center'},
  smsTitle: { fontSize: 14, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  smsToggle: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#4f46e5' },
  smsBody: { marginTop: 16, gap: 16},
  smsDesc: { fontSize: 12, color: '#6b7280', lineHeight: 20},
  smsInputRow: { position: 'relative'},
  smsInput: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, fontSize: 12, borderWidth: 1, borderColor: '#e5e7eb', minHeight: 80, textAlignVertical: 'top'},
  pasteBtn: { position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e0e7ff'},
  pasteBtnText: { fontSize: 11, fontFamily: 'Vazirmatn_700Bold', color: '#4f46e5' },

  parsedPreview: { backgroundColor: '#ecfdf5', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#a7f3d0', gap: 12},
  parsedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  parsedBank: { flexDirection: 'row', alignItems: 'center', gap: 8},
  dot: { width: 8, height: 8, borderRadius: 4},
  parsedBankName: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#064e3b' },
  parsedType: { fontSize: 10, fontFamily: 'Vazirmatn_700Bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden' },
  parsedDetails: { flexDirection: 'row', gap: 24},
  parsedLabel: { fontSize: 10, color: '#6b7280', marginBottom: 2},
  parsedValue: { fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  applyBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  applyBtnText: { fontSize: 12, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },
  noParse: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a'},
  noParseText: { fontSize: 11, color: '#92400e', fontFamily: 'Vazirmatn_500Medium' },

  sectionLabel: { fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#9ca3af', alignSelf: 'flex-start' },

  accountSection: { gap: 8 },
  accountList: { gap: 8, paddingVertical: 4 },
  accountChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  accountChipText: { fontSize: 13, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280' },

  categorySection: { gap: 12},
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16},
  categoryItem: { width: '22%', alignItems: 'center', gap: 6},
  categoryIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  categoryIconInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3f4f6'},
  categoryName: { fontSize: 10, fontFamily: 'Vazirmatn_500Medium', color: '#6b7280', textAlign: 'center' },

  noteSection: { gap: 8},
  noteInput: { backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 14, borderWidth: 1, borderColor: '#e5e7eb'},

  receiptSection: { gap: 8 },
  receiptRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef2ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  receiptBtnText: { fontSize: 12, fontFamily: 'Vazirmatn_600SemiBold', color: '#4f46e5' },
  receiptRemoveBtn: { padding: 8 },
  receiptPreview: { marginTop: 4, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  receiptImage: { width: '100%', height: 200, resizeMode: 'cover' },

  dateField: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  dateFieldText: { flex: 1, fontSize: 16, color: '#1f2937', textAlign: 'center' },

  recurringSection: { gap: 12 },
  recurringToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  recurringLabel: { fontSize: 14, fontFamily: 'Vazirmatn_600SemiBold', color: '#1f2937' },
  recurringOptions: { gap: 12, paddingRight: 36 },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  freqBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563eb' },
  freqBtnText: { fontSize: 11, fontFamily: 'Vazirmatn_600SemiBold', color: '#6b7280' },
  freqBtnTextActive: { color: '#2563eb' },
  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intervalLabel: { fontSize: 13, fontFamily: 'Vazirmatn_500Medium', color: '#6b7280' },
  intervalInput: { width: 48, textAlign: 'center', paddingVertical: 6, borderRadius: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, fontFamily: 'Vazirmatn_700Bold' },

  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 24, paddingBottom: 32, backgroundColor: 'transparent'},
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 24, paddingVertical: 16, alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnDisabled: { backgroundColor: '#d1d5db'},
  saveBtnText: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#fff' },
});
