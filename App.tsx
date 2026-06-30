import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet, StatusBar, I18nManager, AppState,
  Animated, Pressable, ScrollView, Modal, BackHandler,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

import { Feather } from '@expo/vector-icons';
import {
  useFonts,
  Vazirmatn_100Thin, Vazirmatn_200ExtraLight, Vazirmatn_300Light,
  Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_600SemiBold,
  Vazirmatn_700Bold, Vazirmatn_800ExtraBold, Vazirmatn_900Black,
} from '@expo-google-fonts/vazirmatn';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FinanceProvider, useFinance } from './src/context/FinanceContext';
import BottomNav from './src/components/BottomNav';
import HomeScreen from './src/screens/HomeScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AddScreen from './src/screens/AddScreen';
import TransferScreen from './src/screens/TransferScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import LockScreen from './src/screens/LockScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { getPendingSms } from './src/services/SmsBridge';
import {
  uploadBackupToDrive, refreshAccessToken, shouldAutoBackup, hashData,
} from './src/services/DriveService';

type ViewName = 'home' | 'accounts' | 'reports' | 'add' | 'transfer' | 'profile' | 'reminders';

type SettingTab = 'profile' | 'budgets' | 'categories' | 'backup' | 'goals' | 'debts' | 'security' | 'reminders' | 'statusbar';

const DRAWER_TABS: { key: SettingTab; label: string; icon: string }[] = [
  { key: 'profile', label: 'پروفایل', icon: 'user' },
  { key: 'budgets', label: 'بودجه', icon: 'pie-chart' },
  { key: 'categories', label: 'دسته‌ها', icon: 'grid' },
  { key: 'goals', label: 'اهداف', icon: 'flag' },
  { key: 'debts', label: 'بدهی‌ها', icon: 'users' },
  { key: 'reminders', label: 'یادآورها', icon: 'bell' },
  { key: 'backup', label: 'پشتیبان', icon: 'database' },
  { key: 'security', label: 'امنیت', icon: 'lock' },
  { key: 'statusbar', label: 'نوار وضعیت', icon: 'smartphone' },
];

const SECTION_TITLES: Record<string, string> = {
  profile: 'پروفایل',
  budgets: 'بودجه',
  categories: 'دسته‌ها',
  goals: 'اهداف',
  debts: 'بدهی‌ها',
  backup: 'پشتیبان',
  security: 'امنیت',
  statusbar: 'نوار وضعیت',
};

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewName>('home');
  const [settingsTab, setSettingsTab] = useState<SettingTab>('profile');
  const [smsData, setSmsData] = useState<{ amount: number; type: 'income' | 'expense'; bankName: string; cardSuffix: string } | null>(null);
  const { isLoaded, appLock, userProfile, driveBackup, setDriveBackup, getBackupData, getDataHash } = useFinance();
  const [userUnlocked, setUserUnlocked] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const isUnlocked = !appLock.enabled || userUnlocked;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastBackPress = useRef(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const prevOnlineRef = useRef(true);
  const drawerAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (drawerOpen) {
      Animated.parallel([
        Animated.timing(drawerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(drawerAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen(prev => !prev), []);

  const handleDrawerSelect = useCallback((tab: SettingTab) => {
    closeDrawer();
    if (tab === 'reminders') {
      setCurrentView('reminders');
    } else {
      setSettingsTab(tab);
      setCurrentView('profile');
    }
  }, [closeDrawer]);

  const needsOnboarding = !isOnboarded && userProfile.name === 'کاربر' && !userProfile.phone && !userProfile.email;

  const runAutoBackup = useCallback(async () => {
    if (!driveBackup.connected || !driveBackup.autoBackup) return;
    const currentHash = getDataHash();
    if (!shouldAutoBackup(driveBackup.lastBackupTimestamp, driveBackup.intervalHours, currentHash, driveBackup.lastDataHash)) return;
    let token = driveBackup.accessToken;
    if (!token) return;
    try {
      const newToken = await refreshAccessToken();
      if (newToken) { token = newToken; setDriveBackup({ ...driveBackup, accessToken: newToken }); }
      const data = getBackupData();
      const jsonStr = JSON.stringify(data, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      const ok = await uploadBackupToDrive(token, jsonStr, `finance_backup_${dateStr}.json`);
      if (ok) {
        setDriveBackup({ ...driveBackup, accessToken: token, lastBackupTimestamp: Date.now(), lastDataHash: currentHash });
      }
    } catch {}
  }, [driveBackup, getBackupData, getDataHash, setDriveBackup]);

  useEffect(() => {
    const checkSms = async () => {
      const pending = await getPendingSms();
      if (pending) {
        setSmsData({
          amount: pending.data.amount,
          type: pending.data.type,
          bankName: pending.data.bankName,
          cardSuffix: pending.data.cardSuffix,
        });
        setCurrentView('add');
      }
    };
    checkSms();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkSms();
        runAutoBackup();
      }
    });
    return () => sub.remove();
  }, [runAutoBackup]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      if (online && !prevOnlineRef.current) {
        runAutoBackup();
      }
      prevOnlineRef.current = online;
    });
    return () => unsub();
  }, [runAutoBackup]);

  const handleViewChange = useCallback((view: ViewName) => {
    setCurrentView(view);
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (currentView !== 'home') {
        setCurrentView('home');
        return true;
      }
      const now = Date.now();
      if (lastBackPress.current && now - lastBackPress.current < 2000) {
        return false;
      }
      lastBackPress.current = now;
      setShowExitToast(true);
      setTimeout(() => setShowExitToast(false), 2000);
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [currentView]);

  const openAddScreen = useCallback(() => {
    setSmsData(null);
    setCurrentView('add');
  }, []);

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>در حال بارگذاری...</Text>
      </View>
    );
  }

  if (needsOnboarding) {
    return <OnboardingScreen onDone={() => setIsOnboarded(true)} />;
  }

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setUserUnlocked(true)} />;
  }

  return (
    <View style={styles.appContainer}>
      <View style={{ flex: 1 }}>
        {currentView === 'home' && <HomeScreen onEdit={openAddScreen} onToggleDrawer={toggleDrawer} />}
        {currentView === 'accounts' && <AccountsScreen />}
        {currentView === 'reports' && <ReportsScreen />}
        {currentView === 'transfer' && <TransferScreen onClose={() => setCurrentView('home')} />}
        {currentView === 'profile' && <SettingsScreen key={settingsTab} initialTab={settingsTab} />}
        {currentView === 'reminders' && <RemindersScreen />}
      </View>

      {currentView === 'add' && (
        <AddScreen onClose={() => { setSmsData(null); setCurrentView('home'); }} initialSmsData={smsData} />
      )}

      {currentView !== 'add' && currentView !== 'transfer' && (
        <BottomNav currentView={currentView} onChange={handleViewChange}
          onTransfer={() => setCurrentView('transfer')} onMenuPress={toggleDrawer} />
      )}

      {showExitToast && (
        <View style={styles.exitToast}>
          <Text style={styles.exitToastText}>برای خروج دوباره فشار دهید</Text>
        </View>
      )}

      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.drawerOverlay, { opacity: overlayAnim }]}>
            <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerAnim }] }]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>منو</Text>
              <Pressable onPress={closeDrawer} style={styles.drawerClose}>
                <Feather name="x" size={22} color="#6b7280" />
              </Pressable>
            </View>
            <ScrollView>
              {DRAWER_TABS.map(tab => (
                <Pressable key={tab.key} style={styles.drawerItem}
                  onPress={() => handleDrawerSelect(tab.key)}>
                  <View style={styles.drawerItemIcon}>
                    <Feather name={tab.icon as any} size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.drawerItemLabel}>{tab.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Vazirmatn_100Thin, Vazirmatn_200ExtraLight, Vazirmatn_300Light,
    Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_600SemiBold,
    Vazirmatn_700Bold, Vazirmatn_800ExtraBold, Vazirmatn_900Black,
  });

  if (fontsLoaded) {
    if (!(Text as any).defaultProps) {
      (Text as any).defaultProps = {};
    }
    (Text as any).defaultProps.style = { fontFamily: 'Vazirmatn_400Regular' };
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>در حال بارگذاری...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView style={styles.safeArea}>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  appContainer: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', gap: 16 },
  loadingText: { fontSize: 14, color: '#6b7280', fontFamily: 'Vazirmatn_500Medium' },
  drawerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  drawerPanel: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
    backgroundColor: '#fff', elevation: 20,
    shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 20,
  },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  drawerTitle: { fontSize: 18, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937' },
  drawerClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  drawerItemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  drawerItemLabel: { flex: 1, fontSize: 15, fontFamily: 'Vazirmatn_700Bold', color: '#374151' },
  exitToast: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    zIndex: 100, elevation: 20,
  },
  exitToastText: { fontSize: 14, fontFamily: 'Vazirmatn_600SemiBold', color: '#fff' },
});
