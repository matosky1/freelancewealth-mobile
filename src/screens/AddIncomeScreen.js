import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const CATEGORIES = ['Design', 'Development', 'Writing', 'Consulting', 'Marketing', 'Photography', 'Video', 'Other'];

const FREQUENCIES = [
  { key: 'one-time', label: 'One-time' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'bi-weekly', label: 'Bi-weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function AddIncomeScreen() {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Design');
  const [frequency, setFrequency] = useState('one-time');
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const getAnnualEstimate = () => {
    const amt = parseFloat(amount) || 0;
    const multipliers = { 'one-time': 1, daily: 365, weekly: 52, 'bi-weekly': 26, monthly: 12, yearly: 1 };
    return (amt * multipliers[frequency]).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const save = async () => {
    if (!amount || !desc) {
      Alert.alert('Missing fields', 'Please enter amount and description');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/transactions', {
        type: 'income',
        amount: parseFloat(amount),
        description: desc,
        category,
        date: today,
        frequency,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav bar */}
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.barTitle}>Log Income</Text>
        <TouchableOpacity onPress={save} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.gold} />
            : <Text style={styles.saveBtn}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>

        {/* Income badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>💰 Income</Text>
        </View>

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="rgba(0,0,0,0.3)"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={desc}
          onChangeText={setDesc}
          placeholder="e.g. Acme Corp — Website design"
          placeholderTextColor="rgba(0,0,0,0.3)"
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Frequency */}
        <Text style={styles.label}>How often do you earn this?</Text>
        <View style={styles.freqGrid}>
          {FREQUENCIES.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.freqBtn, frequency === f.key && styles.freqActive]}
              onPress={() => setFrequency(f.key)}
            >
              <Text style={[styles.freqText, frequency === f.key && styles.freqTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Annual estimate */}
        {amount && parseFloat(amount) > 0 && frequency !== 'one-time' && (
          <View style={styles.estimate}>
            <Text style={styles.estimateLabel}>Annual estimate</Text>
            <Text style={styles.estimateValue}>${getAnnualEstimate()}</Text>
            <Text style={styles.estimateSub}>Based on {frequency} payments of ${parseFloat(amount).toFixed(2)}</Text>
          </View>
        )}

        <Text style={styles.dateLabel}>Date: {today}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2DDD6' },
  barTitle: { fontWeight: '700', fontSize: 16, color: '#1A1612' },
  cancel: { fontSize: 15, color: '#8A7E72' },
  saveBtn: { fontSize: 15, color: COLORS.gold, fontWeight: '700' },
  scroll: { flex: 1 },
  typeBadge: { backgroundColor: 'rgba(74,103,65,0.1)', borderRadius: 50, paddingHorizontal: 20, paddingVertical: 10, alignSelf: 'flex-start', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(74,103,65,0.3)' },
  typeBadgeText: { color: '#4A6741', fontWeight: '700', fontSize: 14 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#8A7E72', fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2DDD6', borderRadius: 12, padding: 14, fontSize: 15, color: '#1A1612', marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, borderColor: '#E2DDD6', marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#1A1612', borderColor: '#1A1612' },
  chipText: { fontSize: 13, color: '#8A7E72', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  freqBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50, borderWidth: 1.5, borderColor: '#E2DDD6', backgroundColor: '#fff' },
  freqActive: { backgroundColor: '#4A6741', borderColor: '#4A6741' },
  freqText: { fontSize: 14, color: '#8A7E72', fontWeight: '500' },
  freqTextActive: { color: '#fff', fontWeight: '700' },
  estimate: { backgroundColor: 'rgba(74,103,65,0.08)', borderRadius: 14, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(74,103,65,0.2)', alignItems: 'center' },
  estimateLabel: { fontSize: 11, color: '#4A6741', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  estimateValue: { fontSize: 36, fontWeight: '900', color: '#4A6741', marginTop: 4 },
  estimateSub: { fontSize: 12, color: '#8A7E72', marginTop: 4 },
  dateLabel: { fontSize: 12, color: 'rgba(0,0,0,0.35)', marginBottom: 20 },
});