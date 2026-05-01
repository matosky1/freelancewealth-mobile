import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    try {
    await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoRow}>
          <Text style={styles.logoWhite}>Freelance</Text>
          <Text style={styles.logoGold}>Wealth</Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.successTitle}>Check your email!</Text>
            <Text style={styles.successText}>
              If an account exists for {email}, we've sent a password reset link.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a reset link.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Send Reset Link →</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoRow: { flexDirection: 'row', marginBottom: 40 },
  logoWhite: { fontSize: 22, fontWeight: '700', color: '#fff' },
  logoGold: { fontSize: 22, fontWeight: '700', color: COLORS.gold },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 28, lineHeight: 20 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14 },
  successBox: { alignItems: 'center' },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 10 },
  successText: { color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});