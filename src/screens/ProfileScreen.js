import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Modal, FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');

  const [form, setForm] = useState({
    name: '', full_name: '', phone: '', address: '',
    country: '', currency: 'USD', tax_rate: '0', monthly_budget: '0'
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const [res, billing] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/billing/status').catch(() => ({ data: { plan: 'free' } })),
      ]);
      const u = res.data;
      setForm({
        name: u.name || '',
        full_name: u.full_name || '',
        phone: u.phone || '',
        address: u.address || '',
        country: u.country || '',
        currency: u.currency || 'USD',
        tax_rate: String(u.tax_rate || 0),
        monthly_budget: String(u.monthly_budget || 0),
      });
      setCurrentPlan(billing.data.plan || 'free');
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/auth/me', {
        ...form,
        tax_rate: parseFloat(form.tax_rate) || 0,
        monthly_budget: parseFloat(form.monthly_budget) || 0,
      });
      Alert.alert('✅ Saved', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile');
    }
    setSaving(false);
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === form.currency) || CURRENCIES[0];
  const taxRate = parseFloat(form.tax_rate) || 0;

  const planColors = { free: '#8A7E72', pro: COLORS.gold, business: '#1A1612' };
  const planLabels = { free: 'Free Plan', pro: '⭐ Pro Plan', business: '💼 Business Plan' };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(form.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.headerName}>{form.name || 'Your Name'}</Text>
        <Text style={styles.headerEmail}>{user?.email}</Text>
        <View style={[styles.planBadge, { backgroundColor: planColors[currentPlan] }]}>
          <Text style={styles.planBadgeText}>{planLabels[currentPlan]}</Text>
        </View>
      </View>

      <View style={styles.body}>

        {/* Personal Info */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>Display Name</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder="Display name" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Full Legal Name</Text>
        <TextInput style={styles.input} value={form.full_name} onChangeText={v => setForm({...form, full_name: v})} placeholder="Full name (for invoices)" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={v => setForm({...form, phone: v})} placeholder="+1 234 567 8900" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />

        <Text style={styles.label}>Country</Text>
        <TextInput style={styles.input} value={form.country} onChangeText={v => setForm({...form, country: v})} placeholder="Your country" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Address</Text>
        <TextInput style={[styles.input, styles.textarea]} value={form.address} onChangeText={v => setForm({...form, address: v})} placeholder="Street, City, State, ZIP" placeholderTextColor={COLORS.textMuted} multiline numberOfLines={3} />

        {/* Currency */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Currency</Text>
        <Text style={styles.label}>Your Currency</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowCurrency(true)}>
          <Text style={styles.pickerText}>{selectedCurrency.flag}  {selectedCurrency.code} — {selectedCurrency.name}</Text>
          <Text style={styles.pickerArrow}>▾</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>All amounts shown in {selectedCurrency.symbol} {selectedCurrency.code}</Text>

        {/* Tax */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Tax Settings</Text>
        <Text style={styles.desc}>Enter your own tax rate based on your country's laws. We'll automatically calculate how much to set aside from each payment.</Text>

        <Text style={styles.label}>My Tax Rate (%)</Text>
        <View style={styles.taxRow}>
          <TextInput
            style={styles.taxInput}
            value={form.tax_rate}
            onChangeText={v => setForm({...form, tax_rate: v})}
            placeholder="0"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />
          <View style={styles.taxBadge}>
            <Text style={styles.taxBadgeText}>%</Text>
          </View>
        </View>

        {/* Live Tax Preview */}
        {taxRate > 0 && (
          <View style={styles.taxPreview}>
            <Text style={styles.taxPreviewTitle}>Tax reserve preview</Text>
            {[1000, 5000, 10000].map(amount => (
              <View key={amount} style={styles.taxPreviewRow}>
                <Text style={styles.taxPreviewLabel}>{selectedCurrency.symbol}{amount.toLocaleString()} income</Text>
                <Text style={styles.taxPreviewValue}>{selectedCurrency.symbol}{(amount * taxRate / 100).toFixed(2)} reserved</Text>
              </View>
            ))}
          </View>
        )}

        {/* Monthly Budget */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Monthly Budget</Text>
        <Text style={styles.desc}>Set your monthly spending limit to track expenses against your budget.</Text>

        <Text style={styles.label}>Monthly Budget ({selectedCurrency.symbol})</Text>
        <TextInput
          style={styles.input}
          value={form.monthly_budget}
          onChangeText={v => setForm({...form, monthly_budget: v})}
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
        />

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        {/* Upgrade / Manage Plan */}
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Pricing')}>
          <Text style={styles.upgradeBtnText}>
            {currentPlan === 'free' ? '⭐ Upgrade to Pro' : '⭐ Manage Plan'}
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() =>
          Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
          ])
        }>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Currency Modal */}
      <Modal visible={showCurrency} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, form.currency === item.code && styles.modalItemActive]}
                  onPress={() => { setForm({...form, currency: item.code}); setShowCurrency(false); }}
                >
                  <Text style={styles.modalItemText}>{item.flag}  {item.code} — {item.name}</Text>
                  <Text style={styles.modalItemSymbol}>{item.symbol}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCurrency(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.darkBg, alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  headerName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerEmail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  planBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  planBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { padding: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, marginTop: 12 },
  desc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 16 },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  input: { backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  textarea: { height: 80, textAlignVertical: 'top' },
  picker: { backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { color: '#fff', fontSize: 14 },
  pickerArrow: { color: COLORS.textMuted },
  taxRow: { flexDirection: 'row', alignItems: 'center' },
  taxInput: { flex: 1, backgroundColor: COLORS.card, borderRadius: 10, borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: COLORS.border, borderRightWidth: 0 },
  taxBadge: { backgroundColor: COLORS.gold, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 10, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  taxBadgeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  taxPreview: { marginTop: 16, backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  taxPreviewTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  taxPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  taxPreviewLabel: { fontSize: 13, color: COLORS.textMuted },
  taxPreviewValue: { fontSize: 13, fontWeight: '700', color: COLORS.gold },
  saveBtn: { backgroundColor: COLORS.gold, borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 28, marginBottom: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  upgradeBtn: { backgroundColor: '#1A1612', borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: COLORS.gold },
  upgradeBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  logoutBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginBottom: 40 },
  logoutText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.darkBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemActive: { backgroundColor: 'rgba(200,150,62,0.15)', borderRadius: 8 },
  modalItemText: { color: '#fff', fontSize: 14 },
  modalItemSymbol: { color: COLORS.gold, fontWeight: '700' },
  modalClose: { backgroundColor: COLORS.gold, borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});