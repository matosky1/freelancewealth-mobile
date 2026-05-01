import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

export default function ResetPasswordScreen({ navigation, route }) {
  const token = route?.params?.token || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (!token) { Alert.alert('Error', 'Invalid reset link. Please request a new one.'); return; }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid or expired reset link. Please request a new one.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.inner}>
        <View style={s.logoRow}>
          <Text style={s.logoWhite}>Freelance</Text>
          <Text style={s.logoGold}>Wealth</Text>
        </View>

        {done ? (
          <View style={s.successBox}>
            <Text style={s.successIcon}>✅</Text>
            <Text style={s.successTitle}>Password Reset!</Text>
            <Text style={s.successText}>Your password has been updated successfully.</Text>
            <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
              <Text style={s.btnText}>Sign In Now →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.title}>Set New Password</Text>
            <Text style={s.subtitle}>Enter a new password for your account.</Text>

            <Text style={s.label}>New Password</Text>
            <View style={s.passwordContainer}>
              <TextInput
                style={s.passwordInput}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Confirm Password</Text>
            <TextInput
              style={s.input}
              placeholder="Repeat your password"
              placeholderTextColor={COLORS.textMuted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity style={s.btn} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Reset Password →</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.linkText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoRow: { flexDirection: 'row', marginBottom: 36 },
  logoWhite: { fontSize: 22, fontWeight: '700', color: '#fff' },
  logoGold: { fontSize: 22, fontWeight: '700', color: COLORS.gold },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 28, lineHeight: 20 },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  eyeIcon: { fontSize: 18 },
  btn: { backgroundColor: COLORS.gold, borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14 },
  successBox: { alignItems: 'center' },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 10 },
  successText: { color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});