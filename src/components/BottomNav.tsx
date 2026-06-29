import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ViewName = 'home' | 'accounts' | 'reports' | 'add' | 'transfer' | 'reminders' | 'profile';

interface BottomNavProps {
  currentView: ViewName;
  onChange: (view: ViewName) => void;
  onTransfer?: () => void;
  onMenuPress?: () => void;
}

export default function BottomNav({ currentView, onChange, onTransfer, onMenuPress }: BottomNavProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.tab} onPress={() => onChange('home')}>
          <Feather name="home" size={22} color={currentView === 'home' ? '#2563eb' : '#9ca3af'} />
          <Text style={[styles.label, currentView === 'home' && styles.activeLabel]}>خانه</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => onChange('accounts')}>
          <Feather name="layers" size={22} color={currentView === 'accounts' ? '#2563eb' : '#9ca3af'} />
          <Text style={[styles.label, currentView === 'accounts' && styles.activeLabel]}>حساب‌ها</Text>
        </TouchableOpacity>

        <View style={styles.centerGroup}>
          <TouchableOpacity style={styles.transferBtn} onPress={onTransfer} activeOpacity={0.7}>
            <Feather name="repeat" size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => onChange('add')} activeOpacity={0.8}>
            <Feather name="plus" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.tab} onPress={() => onChange('reports')}>
          <Feather name="pie-chart" size={22} color={currentView === 'reports' ? '#2563eb' : '#9ca3af'} />
          <Text style={[styles.label, currentView === 'reports' && styles.activeLabel]}>گزارش‌ها</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={onMenuPress} activeOpacity={0.7}>
          <Feather name="menu" size={22} color="#9ca3af" />
          <Text style={styles.label}>منو</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10},
    shadowOpacity: 0.05,
    shadowRadius: 40,
    elevation: 10,
    zIndex: 50,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    padding: 6,
    minWidth: 52,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Vazirmatn_500Medium',
    color: '#9ca3af',
  },
  activeLabel: { color: '#2563eb' },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  transferBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
});
