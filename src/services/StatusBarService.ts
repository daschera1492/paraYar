import { NativeModules, Platform } from 'react-native';

const { StatusBarModule } = NativeModules;

export function updateStatusBar(data: {
  dateText: string;
  dayNum: string;
  income: string;
  expense: string;
  reminders: string[];
  showDayNumber?: boolean;
}) {
  if (Platform.OS !== 'android' || !StatusBarModule) return;
  try {
    StatusBarModule.updateStatusBar(
      data.dateText,
      data.showDayNumber ? data.dayNum : '',
      data.income,
      data.expense,
      data.reminders,
    );
  } catch {}
}

export function startStatusBarService() {
  if (Platform.OS !== 'android' || !StatusBarModule) return;
  try { StatusBarModule.startForegroundService(); } catch {}
}

export function stopStatusBarService() {
  if (Platform.OS !== 'android' || !StatusBarModule) return;
  try { StatusBarModule.stopForegroundService(); } catch {}
}
