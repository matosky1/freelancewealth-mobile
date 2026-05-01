import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const getCurrencySymbol = (code) => {
  const map = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', INR: '₹', JPY: '¥', KES: 'KSh', AED: 'د.إ' };
  return map[code] || '$';
};

export default function ExpensesScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userCurrency, setUserCurrency] = useState('$');

  const load = async () => {
    const [txns, me] = await Promise.all([
      api.get('/api/transactions?type=expense'),
      api.get('/api/auth/me'),
    ]);
    setItems(txns.data);
    setUserCurrency(getCurrencySymbol(me.data.currency));
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/transactions/${id}`);
            setItems(prev => prev.filter(i => i.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const total = items.reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Expenses</Text>
        <Text style={s.total}>{userCurrency}{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        <Text style={s.sub}>Deductible: {userCurrency}0.00</Text>
      </View>
      <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddExpense')}>
        <Text style={s.addBtnText}>+ Log Expense</Text>
      </TouchableOpacity>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={s.desc}>{item.description}</Text>
              <Text style={s.meta}>{item.category} · {item.date?.slice(0, 10)}</Text>
            </View>
            <View style={s.rowRight}>
              <Text style={s.amt}>-{userCurrency}{parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Text style={s.deleteText}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No expenses logged yet.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { backgroundColor: '#1A1612', padding: 24, paddingTop: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  total: { color: '#E8B86D', fontSize: 40, fontWeight: '900', marginTop: 8 },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  addBtn: { margin: 16, marginBottom: 0, backgroundColor: '#B85C38', borderRadius: 50, padding: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2DDD6' },
  rowLeft: { flex: 1, marginRight: 12 },
  desc: { fontWeight: '600', fontSize: 14, color: '#1A1612' },
  meta: { fontSize: 12, color: '#8A7E72', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 8 },
  amt: { fontWeight: '700', fontSize: 15, color: '#B85C38' },
  deleteBtn: { backgroundColor: 'rgba(184,92,56,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  deleteText: { fontSize: 14 },
  empty: { textAlign: 'center', color: '#8A7E72', padding: 40, fontSize: 14 },
});