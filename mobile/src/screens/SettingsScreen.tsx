import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { APPS_SCRIPT_TEMPLATE } from '../services/scriptTemplate';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen: React.FC<{ onLaunchPasscodeSetup: () => void }> = ({
  onLaunchPasscodeSetup,
}) => {
  const { sheetUrl, disconnectSheet, passcode, setPasscodeState, currencySymbol, setCurrencySymbol } = useApp();
  const { colors, toggleTheme, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Database',
      'Are you sure you want to disconnect from this Google Sheet? Your local cache will be cleared, but your data on Google Sheets remains safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectSheet();
          },
        },
      ]
    );
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasscodeToggle = async (value: boolean) => {
    if (value) {
      // Prompt user to set a passcode (open LockScreen in setup mode)
      onLaunchPasscodeSetup();
    } else {
      // Confirm remove passcode
      Alert.alert(
        'Disable Passcode',
        'Are you sure you want to disable the passcode? Anyone will be able to view your financial data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await setPasscodeState(null);
            },
          },
        ]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Theme Toggle Section */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="moon-outline" size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDark ? colors.primaryInverse : '#f4f3f4'}
          />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="cash-outline" size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>Currency Symbol</Text>
          </View>
          <TextInput
            style={[
              styles.currencyInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={currencySymbol}
            onChangeText={setCurrencySymbol}
            maxLength={3}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Security Section */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Security</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>App Passcode Lock</Text>
          </View>
          <Switch
            value={!!passcode}
            onValueChange={handlePasscodeToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={!!passcode ? colors.primaryInverse : '#f4f3f4'}
          />
        </View>
        {passcode && (
          <Text style={[styles.securityHint, { color: colors.textSecondary }]}>
            Your financial data is protected by a 4-digit PIN. App locks immediately when backgrounded.
          </Text>
        )}
      </View>

      {/* Database Connection */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Database Connection</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.settingHeader, { color: colors.text }]}>Connected Endpoint</Text>
        <Text
          style={[styles.endpointUrl, { backgroundColor: colors.inputBg, color: colors.textSecondary }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {sheetUrl}
        </Text>

        <TouchableOpacity
          onPress={handleCopyCode}
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="copy-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            {copied ? 'Copied script! ✓' : 'Copy Apps Script Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDisconnect}
          style={[styles.dangerBtn, { borderColor: colors.danger }]}
        >
          <Ionicons name="log-out-outline" size={16} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={[styles.dangerBtnText, { color: colors.danger }]}>
            Disconnect Google Sheet
          </Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.aboutContainer}>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>FinTrack v1.0.0 (MVP)</Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          Your financial data belongs only to you.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  securityHint: {
    fontSize: 12,
    marginTop: 10,
    lineHeight: 16,
  },
  settingHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  endpointUrl: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
    lineHeight: 16,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aboutContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  aboutText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    marginVertical: 14,
  },
  currencyInput: {
    width: 60,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
});
