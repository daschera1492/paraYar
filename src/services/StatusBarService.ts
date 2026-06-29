import { NativeModules, Platform } from 'react-native';

const { StatusBarModule } = NativeModules;

export function updateStatusBar(data: {
  dateText: string;
  dayNum: string;
  income: string;
  expense: string;
  reminders: string[];
}) {
  if (Platform.OS !== 'android' || !StatusBarModule) return;
  try {
    StatusBarModule.updateStatusBar(
      data.dateText,
      data.dayNum,
      data.income,
      data.expense,
      data.reminders,
    );
  } catch {}
}
