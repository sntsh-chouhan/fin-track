import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Vibration,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const LockScreen: React.FC = () => {
  const { passcode, setPasscodeState, setIsLocked } = useApp();
  const { colors, toggleTheme, isDark } = useTheme();

  // Screen states: 'verify' (entering PIN to unlock), 'setup' (entering first time PIN), 'confirm' (re-entering PIN to confirm setup)
  const [mode, setMode] = useState<'verify' | 'setup' | 'confirm'>('verify');
  const [pin, setPin] = useState<string>('');
  const [setupPin, setSetupPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animations
  const shakeAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!passcode) {
      setMode('setup');
    } else {
      setMode('verify');
    }
  }, [passcode]);

  const triggerShake = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (num: string) => {
    setErrorMsg(null);
    if (pin.length >= 4) return;
    
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      // Small timeout for visual confirmation of the last dot
      setTimeout(() => {
        handlePinSubmit(newPin);
      }, 200);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handlePinSubmit = async (enteredPin: string) => {
    if (mode === 'verify') {
      if (enteredPin === passcode) {
        setIsLocked(false);
      } else {
        triggerShake();
        setErrorMsg('Incorrect Passcode');
        setPin('');
      }
    } else if (mode === 'setup') {
      setSetupPin(enteredPin);
      setPin('');
      setMode('confirm');
    } else if (mode === 'confirm') {
      if (enteredPin === setupPin) {
        await setPasscodeState(enteredPin);
        setIsLocked(false);
      } else {
        triggerShake();
        setErrorMsg('Passcodes do not match. Try again.');
        setPin('');
        setMode('setup');
      }
    }
  };

  const getTitleText = () => {
    switch (mode) {
      case 'setup':
        return 'Create a Passcode';
      case 'confirm':
        return 'Confirm your Passcode';
      case 'verify':
      default:
        return 'Enter Passcode to Unlock';
    }
  };

  const renderKey = (val: string) => {
    return (
      <TouchableOpacity
        key={val}
        onPress={() => handleKeyPress(val)}
        style={[styles.key, { backgroundColor: colors.keypadBg }]}
      >
        <Text style={[styles.keyText, { color: colors.text }]}>{val}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Theme toggle in corner */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { borderColor: colors.border }]}>
          <Text style={[styles.themeBtnText, { color: colors.textSecondary }]}>
            {isDark ? 'Light ☀️' : 'Dark 🌙'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Ionicons name="lock-closed" size={32} color={colors.primary} style={styles.lockIcon} />
        
        <Text style={[styles.title, { color: colors.primary }]}>{getTitleText()}</Text>
        
        {errorMsg ? (
          <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>
        ) : (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === 'setup' ? 'Protect your personal finance data locally.' : ' '}
          </Text>
        )}

        {/* Pin Dots */}
        <Animated.View 
          style={[
            styles.dotsContainer, 
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  borderColor: colors.primary,
                  backgroundColor: pin.length > index ? colors.primary : 'transparent',
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Keypad */}
        <View style={styles.keypad}>
          <View style={styles.row}>
            {['1', '2', '3'].map(renderKey)}
          </View>
          <View style={styles.row}>
            {['4', '5', '6'].map(renderKey)}
          </View>
          <View style={styles.row}>
            {['7', '8', '9'].map(renderKey)}
          </View>
          <View style={styles.row}>
            {/* Left corner blank or back icon */}
            <View style={[styles.key, { backgroundColor: 'transparent' }]} />
            {renderKey('0')}
            <TouchableOpacity
              onPress={handleBackspace}
              style={[styles.key, { backgroundColor: colors.keypadBg }]}
            >
              <Ionicons name="backspace" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  lockIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    height: 20,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
    height: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 48,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 12,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  key: {
    width: 75,
    height: 75,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
  },
});
