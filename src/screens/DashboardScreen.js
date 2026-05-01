import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';
import ScreenLayout from '../components/ScreenLayout';

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', INR: '₹', JPY: '¥', KES: 'KSh', AED: 'AED ' };

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [d, t, me] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get('/api/transactions?limit=10'),
        api.get('/api/auth/me'),
      ]);
      setData(d.data);
      setTransactions(t.data || []);
      setProfile(me.data);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const symbol = CURRENCY_SYMBOLS[profile?.currency] || '$';
  const fmt = (n) => `${symbol}${(parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const kpis = [
    { label: 'Total Income', value: fmt(data?.total_income), color: COLORS.sage },
    { label: 'Total Expenses', value: fmt(data?.total_expenses), color: COLORS.rust },
    { label: 'Net Profit', value: fmt(data?.net_profit), color: '#fff' },
    { label: 'Tax Reserved', value: fmt(data?.tax_reserved), color: COLORS.gold },
  ];

  return (
    <ScreenLayout title="Dashboard">
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
      >
        {/* KPI Cards */}
        <View style={s.kpiGrid}>
          {kpis.map((k, i) => (
            <View key={i} style={s.kpiCard}>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={s.quickActions}>
          <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('AddIncome')}>
            <Text style={s.quickBtnIcon}>💰</Text>
            <Text style={s.quickBtnText}>Add Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('AddExpense')}>
            <Text style={s.quickBtnIcon}>🧾</Text>
            <Text style={s.quickBtnText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('Invoices')}>
            <Text style={s.quickBtnIcon}>📋</Text>
            <Text style={s.quickBtnText}>New Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Recent transactions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={s.empty}>No transactions yet</Text>
          ) : (
            transactions.slice(0, 8).map((t, i) => (
              <View key={i} style={s.txnRow}>
                <View style={s.txnLeft}>
                  <Text style={s.txnIcon}>{t.type === 'income' ? '💰' : '🧾'}</Text>
                  <View>
                    <Text style={s.txnDesc}>{t.description || t.category}</Text>
                    <Text style={s.txnDate}>{new Date(t.date).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={[s.txnAmount, { color: t.type === 'income' ? COLORS.sage : COLORS.rust }]}>
                  {t.type === 'income' ? '+' : '-'}{symbol}{parseFloat(t.amount).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  kpiCard: { flex: 1, minWidth: '45%', backgroundColor: '#1A1612', borderRadius: 14, padding: 16 },
  kpiLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  kpiValue: { fontSize: 18, fontWeight: '900' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  quickBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2DDD6' },
  quickBtnIcon: { fontSize: 22, marginBottom: 4 },
  quickBtnText: { fontSize: 11, color: '#1A1612', fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2DDD6' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1612', marginBottom: 12 },
  empty: { color: '#8A7E72', fontSize: 13, textAlign: 'center', padding: 16 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0ECE6' },
  txnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  txnIcon: { fontSize: 18 },
  txnDesc: { fontSize: 13, fontWeight: '600', color: '#1A1612' },
  txnDate: { fontSize: 11, color: '#8A7E72', marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
});