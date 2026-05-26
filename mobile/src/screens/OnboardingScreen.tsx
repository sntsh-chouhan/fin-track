import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { APPS_SCRIPT_TEMPLATE } from '../services/scriptTemplate';

export const OnboardingScreen: React.FC = () => {
  const { setSheetUrl } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a Web App URL');
      return;
    }
    
    // Simple basic URL validation
    if (!urlInput.startsWith('https://script.google.com/')) {
      setErrorMsg('Invalid URL. It must start with https://script.google.com/');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    try {
      const success = await setSheetUrl(urlInput.trim());
      if (!success) {
        setErrorMsg('Could not verify connection. Make sure the deployment is active and accessible by "Anyone".');
      }
    } catch (e) {
      setErrorMsg('Connection failed. Please verify the URL and your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.primary }]}>FinTrack</Text>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { borderColor: colors.border }]}>
              <Text style={[styles.themeBtnText, { color: colors.textSecondary }]}>
                {isDark ? 'Light ☀️' : 'Dark 🌙'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Intro */}
          <View style={styles.introContainer}>
            <Text style={[styles.title, { color: colors.primary }]}>Setup Your Database</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              FinTrack is 100% self-hosted. We use a Google Sheet as your personal secure database.
            </Text>
          </View>

          {/* Guide Steps */}
          <View style={[styles.guideContainer, { borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.primary }]}>Setup Guide</Text>
            
            <View style={styles.step}>
              <Text style={[styles.stepNum, { color: colors.primary }]}>1</Text>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Create a new Google Sheet.
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={[styles.stepNum, { color: colors.primary }]}>2</Text>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Go to <Text style={{ fontWeight: '600' }}>Extensions → Apps Script</Text> in your Sheet menu.
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={[styles.stepNum, { color: colors.primary }]}>3</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepText, { color: colors.text, marginBottom: 8 }]}>
                  Paste our proxy script inside the editor.
                </Text>
                <TouchableOpacity
                  onPress={handleCopyCode}
                  style={[styles.copyBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.copyBtnText, { color: colors.primaryInverse }]}>
                    {copied ? 'Copied! ✓' : 'Copy Script Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.step}>
              <Text style={[styles.stepNum, { color: colors.primary }]}>4</Text>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Click <Text style={{ fontWeight: '600' }}>Deploy → New deployment</Text>. Select <Text style={{ fontWeight: '600' }}>Web App</Text>. Set Execute as <Text style={{ fontWeight: '600' }}>Me</Text> and Who has access to <Text style={{ fontWeight: '600' }}>Anyone</Text>.
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={[styles.stepNum, { color: colors.primary }]}>5</Text>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Copy the Web App URL and paste it below to link your sheet.
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Apps Script Web App URL</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="https://script.google.com/macros/s/.../exec"
              placeholderTextColor={colors.textSecondary}
              value={urlInput}
              onChangeText={(text) => {
                setUrlInput(text);
                setErrorMsg(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {errorMsg && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
            )}

            <TouchableOpacity
              onPress={handleConnect}
              disabled={loading}
              style={[
                styles.connectBtn,
                { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryInverse} />
              ) : (
                <Text style={[styles.connectBtnText, { color: colors.primaryInverse }]}>
                  Connect Database
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  introContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  guideContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '800',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  copyBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 18,
  },
  connectBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
