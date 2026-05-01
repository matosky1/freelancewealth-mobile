import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const CATEGORIES = ['Design', 'Development', 'Writing', 'Consulting', 'Marketing', 'Software', 'Office', 'Travel', 'Equipment', 'Other'];

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Design');
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const save = async () => {
    if (!amount || !desc) { Alert.alert('Missing fields', 'Please enter amount and description'); return; }
    setLoading(true);
    try {
      await api.post('/api/transactions', { type, amount: parseFloat(amount), description: desc, category, date: today });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.barTitle}>Add Transaction</Text>
        <TouchableOpacity onPress={save} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.gold} /> : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>
        {/* Type toggle */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.toggle}>
          <TouchableOpacity style={[styles.toggleOpt, type === 'income' && styles.toggleActive]} onPress={() => setType('income')}>
            <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]}>💰 Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleOpt, type === 'expense' && styles.toggleActiveExp]} onPress={() => setType('expense')}>
            <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]}>🧾 Expense</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="rgba(0,0,0,0.3)"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={desc}
          onChangeText={setDesc}
          placeholder="e.g. Acme Corp — Website design"
          placeholderTextColor="rgba(0,0,0,0.3)"
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: 'rgba(0,0,0,0.4)' }]}>Date: {today}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  bar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2DDD6'
  },
  barTitle: { fontWeight: '700', fontSize: 16, color: '#1A1612' },
  cancel: { fontSize: 15, color: '#8A7E72' },
  saveBtn: { fontSize: 15, color: COLORS.gold, fontWeight: '700' },
  scroll: { flex: 1 },
  label: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
    color: '#8A7E72', fontWeight: '600', marginBottom: 8, marginTop: 4
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2DDD6',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1612',
    marginBottom: 16,
  },
  toggle: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  toggleOpt: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2DDD6',
    alignItems: 'center', backgroundColor: '#fff'
  },
  toggleActive: { backgroundColor: '#4A6741', borderColor: '#4A6741' },
  toggleActiveExp: { backgroundColor: '#B85C38', borderColor: '#B85C38' },
  toggleText: { fontWeight: '600', color: '#8A7E72' },
  toggleTextActive: { color: '#fff' },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30,
    borderWidth: 1.5, borderColor: '#E2DDD6',
    marginRight: 8, backgroundColor: '#fff'
  },
  catActive: { backgroundColor: '#1A1612', borderColor: '#1A1612' },
  catText: { fontSize: 13, color: '#8A7E72', fontWeight: '500' },
  catTextActive: { color: '#fff' },
});