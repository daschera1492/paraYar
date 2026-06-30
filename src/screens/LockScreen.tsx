import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { appLock, setAppLock } = useFinance();
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'enter' | 'create' | 'confirm'>('enter');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const biometricTried = useRef(false);

  useEffect(() => {
    if (!appLock.enabled) {
      if (!appLock.pin) {
        setMode('create');
        return;
      }
      setMode('enter');
    }
    if (appLock.useBiometric && !biometricTried.current) {
      biometricTried.current = true;
      tryBiometric();
    }
  }, [appLock.enabled, appLock.pin, appLock.useBiometric]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  useEffect(() => {
    if (mode === 'enter' && pin.length >= 4 && pin.length === appLock.pin.length) {
      if (pin === appLock.pin) {
        onUnlock();
      } else {
        setError('PIN اشتباه است');
        setPin('');
      }
    }
  }, [pin, mode, appLock.pin, onUnlock]);

  useEffect(() => {
    if (mode === 'create' && pin.length >= 4) {
      setMode('confirm');
      setError('');
    }
  }, [pin, mode]);

  useEffect(() => {
    if (mode === 'confirm' && confirmPin.length >= 4 && confirmPin.length === pin.length) {
      if (pin === confirmPin) {
        setAppLock({ ...appLock, pin, enabled: true });
        onUnlock();
      } else {
        setError('PINها مطابقت ندارند');
        setConfirmPin('');
        setMode('create');
        setPin('');
      }
    }
  }, [confirmPin, mode]);

  const tryBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (compatible && enrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'ورود به حسابدار شخصی من',
        fallbackLabel: 'ورود با PIN',
      });
      if (result.success) {
        onUnlock();
      }
    }
  };

  const handlePinSubmit = () => {
    if (mode === 'enter') {
      if (pin === appLock.pin) {
        onUnlock();
      } else {
        setError('PIN اشتباه است');
        setPin('');
      }
      return;
    }
    if (mode === 'create') {
      if (pin.length < 4) {
        setError('PIN باید حداقل ۴ رقم باشد');
        return;
      }
      setMode('confirm');
      setError('');
      return;
    }
    if (mode === 'confirm') {
      if (pin === confirmPin) {
        setAppLock({ ...appLock, pin, enabled: true });
        onUnlock();
      } else {
        setError('PINها مطابقت ندارند');
        setConfirmPin('');
        setMode('create');
        setPin('');
      }
    }
  };

  const handleKeyPress = (key: string) => {
    setError('');
    if (mode === 'confirm') {
      if (key === 'backspace') {
        setConfirmPin(prev => prev.slice(0, -1));
      } else if (confirmPin.length < 6) {
        setConfirmPin(prev => prev + key);
      }
    } else {
      if (key === 'backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (pin.length < 6) {
        setPin(prev => prev + key);
      }
    }
  };

  const currentPin = mode === 'confirm' ? confirmPin : pin;
  const pinTitle = mode === 'create' ? 'ایجاد PIN جدید' : mode === 'confirm' ? 'تکرار PIN' : 'ورود با PIN';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="lock" size={48} color="#2563eb" />
      </View>
      <Text style={styles.title}>حسابدار شخصی من</Text>
      <Text style={styles.subtitle}>{pinTitle}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Animated.View style={[styles.pinDots, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.dot, currentPin.length > i && styles.dotFilled]} />
        ))}
      </Animated.View>

      <View style={styles.keypad}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'backspace']].map((row, ri) => (
          <View key={ri} style={styles.keypadRow}>
            {row.map((key, ki) => (
              key === '' ? <View key={ki} style={styles.keypadKey} /> :
              <TouchableOpacity key={ki} style={styles.keypadKey}
                onPress={() => key === 'backspace' ? handleKeyPress('backspace') : handleKeyPress(key)}>
                {key === 'backspace' ? (
                  <Feather name="delete" size={24} color="#1f2937" />
                ) : (
                  <Text style={styles.keypadText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {mode === 'enter' && (
        <TouchableOpacity style={styles.biometricBtn} onPress={tryBiometric}>
          <Feather name="smartphone" size={20} color="#2563eb" />
          <Text style={styles.biometricText}>ورود با اثر انگشت</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  iconContainer: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: {
    fontSize: 22, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937', marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, fontFamily: 'Vazirmatn_500Medium', color: '#6b7280', marginBottom: 24,
  },
  error: {
    fontSize: 12, color: '#ef4444', fontFamily: 'Vazirmatn_500Medium', marginBottom: 16,
  },
  pinDots: {
    flexDirection: 'row', gap: 16, marginBottom: 32,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#e5e7eb',
  },
  dotFilled: {
    backgroundColor: '#2563eb',
  },
  keypad: {
    gap: 12, marginBottom: 24,
  },
  keypadRow: {
    flexDirection: 'row', gap: 12,
  },
  keypadKey: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  keypadText: {
    fontSize: 28, fontFamily: 'Vazirmatn_700Bold', color: '#1f2937',
  },
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, backgroundColor: '#eff6ff',
  },
  biometricText: {
    fontSize: 13, fontFamily: 'Vazirmatn_700Bold', color: '#2563eb',
  },
});
