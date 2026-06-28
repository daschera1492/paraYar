import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar, I18nManager, AppState } from 'react-native';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
import {
  useFonts,
  Vazirmatn_100Thin,
  Vazirmatn_200ExtraLight,
  Vazirmatn_300Light,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
  Vazirmatn_800ExtraBold,
  Vazirmatn_900Black,
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

type ViewName = 'home' | 'accounts' | 'reports' | 'add' | 'transfer' | 'settings' | 'reminders';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewName>('home');
  const [settingsKey, setSettingsKey] = useState(0);
  const [smsData, setSmsData] = useState<{ amount: number; type: 'income' | 'expense'; bankName: string; cardSuffix: string } | null>(null);
  const { isLoaded, appLock, userProfile } = useFinance();
  const [userUnlocked, setUserUnlocked] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const isUnlocked = !appLock.enabled || userUnlocked;

  const needsOnboarding = !isOnboarded && userProfile.name === 'کاربر' && !userProfile.phone && !userProfile.email;

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
      if (state === 'active') checkSms();
    });
    return () => sub.remove();
  }, []);

  const handleViewChange = useCallback((view: ViewName) => {
    if (view === 'settings' && currentView === 'settings') {
      setSettingsKey(prev => prev + 1);
    }
    setCurrentView(view);
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
      <View style={styles.contentArea}>
        {currentView === 'home' && <HomeScreen onEdit={openAddScreen} />}
        {currentView === 'accounts' && <AccountsScreen />}
        {currentView === 'reports' && <ReportsScreen />}
        {currentView === 'transfer' && <TransferScreen onClose={() => setCurrentView('home')} />}
        {currentView === 'settings' && <SettingsScreen key={settingsKey} onNavigateTo={(view) => setCurrentView(view as ViewName)} />}
        {currentView === 'reminders' && <RemindersScreen />}
      </View>

      {currentView === 'add' && (
        <AddScreen onClose={() => { setSmsData(null); setCurrentView('home'); }} initialSmsData={smsData} />
      )}

      {currentView !== 'add' && currentView !== 'transfer' && (
        <BottomNav currentView={currentView} onChange={handleViewChange} onTransfer={() => setCurrentView('transfer')} />
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Vazirmatn_100Thin,
    Vazirmatn_200ExtraLight,
    Vazirmatn_300Light,
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
    Vazirmatn_800ExtraBold,
    Vazirmatn_900Black,
  });

  if (fontsLoaded) {
    (Text as any).defaultProps = (Text as any).defaultProps || {};
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Vazirmatn_500Medium',
  },
});
