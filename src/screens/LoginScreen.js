import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoWhite}>Freelance</Text>
          <Text style={styles.logoGold}>Wealth</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password with show/hide */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotContainer}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign In →</Text>
          }
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoRow: { flexDirection: 'row', marginBottom: 32 },
  logoWhite: { fontSize: 22, fontWeight: '700', color: '#fff' },
  logoGold: { fontSize: 22, fontWeight: '700', color: COLORS.gold },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 28 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeIcon: { fontSize: 18 },
  forgotContainer: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: COLORS.gold, fontSize: 13 },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14 },
  linkBold: { color: COLORS.gold, fontWeight: '600' },
});