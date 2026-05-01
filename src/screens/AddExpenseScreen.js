import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const CATEGORIES = ['Software', 'Office', 'Travel', 'Equipment', 'Marketing', 'Food', 'Utilities', 'Rent', 'Insurance', 'Other'];

const FREQUENCIES = [
  { key: 'one-time', label: 'One-time' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'bi-weekly', label: 'Bi-weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Software');
  const [frequency, setFrequency] = useState('one-time');
  const [recurringDay, setRecurringDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const isRecurring = frequency !== 'one-time';

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
        type: 'expense',
        amount: parseFloat(amount),
        description: desc,
        category,
        date: today,
        frequency,
        recurring_day: isRecurring ? recurringDay : null,
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
        <Text style={styles.barTitle}>Log Expense</Text>
        <TouchableOpacity onPress={save} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.gold} />
            : <Text style={styles.saveBtn}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>

        {/* Expense badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>🧾 Expense</Text>
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
          placeholder="e.g. Adobe Creative Cloud"
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
        <Text style={styles.label}>How often is this expense?</Text>
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

        {/* Recurring day picker — only for recurring expenses */}
        {isRecurring && (
          <View style={styles.recurringBox}>
            <Text style={styles.recurringTitle}>
              {frequency === 'monthly' || frequency === 'yearly'
                ? '📅 Which day of the month does this occur?'
                : frequency === 'weekly' || frequency === 'bi-weekly'
                ? '📅 Which day does this repeat? (1=Mon, 7=Sun)'
                : '📅 Recurring day'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {DAYS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, recurringDay === d && styles.dayBtnActive]}
                  onPress={() => setRecurringDay(d)}
                >
                  <Text style={[styles.dayText, recurringDay === d && styles.dayTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.recurringNote}>
              This expense will recur on day {recurringDay} {frequency === 'weekly' || frequency === 'bi-weekly' ? 'of the week' : 'of the month'}
            </Text>
          </View>
        )}

        {/* Annual cost estimate */}
        {amount && parseFloat(amount) > 0 && frequency !== 'one-time' && (
          <View style={styles.estimate}>
            <Text style={styles.estimateLabel}>Annual cost estimate</Text>
            <Text style={styles.estimateValue}>${getAnnualEstimate()}</Text>
            <Text style={styles.estimateSub}>Based on {frequency} payments of ${parseFloat(amount).toFixed(2)}</Text>
          </View>
        )}

        <Text style={styles.dateLabel}>Date logged: {today}</Text>
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
  typeBadge: { backgroundColor: 'rgba(184,92,56,0.1)', borderRadius: 50, paddingHorizontal: 20, paddingVertical: 10, alignSelf: 'flex-start', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(184,92,56,0.3)' },
  typeBadgeText: { color: '#B85C38', fontWeight: '700', fontSize: 14 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#8A7E72', fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2DDD6', borderRadius: 12, padding: 14, fontSize: 15, color: '#1A1612', marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, borderColor: '#E2DDD6', marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#1A1612', borderColor: '#1A1612' },
  chipText: { fontSize: 13, color: '#8A7E72', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  freqBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50, borderWidth: 1.5, borderColor: '#E2DDD6', backgroundColor: '#fff' },
  freqActive: { backgroundColor: '#B85C38', borderColor: '#B85C38' },
  freqText: { fontSize: 14, color: '#8A7E72', fontWeight: '500' },
  freqTextActive: { color: '#fff', fontWeight: '700' },
  recurringBox: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#E2DDD6' },
  recurringTitle: { fontSize: 14, fontWeight: '600', color: '#1A1612' },
  dayBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2DDD6', alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: '#F7F3EC' },
  dayBtnActive: { backgroundColor: '#B85C38', borderColor: '#B85C38' },
  dayText: { fontSize: 13, color: '#8A7E72', fontWeight: '500' },
  dayTextActive: { color: '#fff', fontWeight: '700' },
  recurringNote: { fontSize: 12, color: '#8A7E72', marginTop: 12 },
  estimate: { backgroundColor: 'rgba(184,92,56,0.07)', borderRadius: 14, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(184,92,56,0.2)', alignItems: 'center' },
  estimateLabel: { fontSize: 11, color: '#B85C38', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  estimateValue: { fontSize: 36, fontWeight: '900', color: '#B85C38', marginTop: 4 },
  estimateSub: { fontSize: 12, color: '#8A7E72', marginTop: 4 },
  dateLabel: { fontSize: 12, color: 'rgba(0,0,0,0.35)', marginBottom: 20 },
});