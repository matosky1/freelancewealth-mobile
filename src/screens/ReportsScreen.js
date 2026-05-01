import { useState, useCallback } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getCurrencySymbol = (code) => {
  const map = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', INR: '₹', JPY: '¥', KES: 'KSh', AED: 'AED ' };
  return map[code] || '$';
};

const fmt = (symbol, n) => `${symbol}${(parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expenses)), 1);

  return (
    <View style={chart.container}>
      <View style={chart.bars}>
        {data.map((d, i) => (
          <View key={i} style={chart.barGroup}>
            <View style={chart.barPair}>
              <View style={[chart.bar, chart.incomeBar, { height: Math.max((d.income / maxVal) * 100, 2) }]} />
              <View style={[chart.bar, chart.expenseBar, { height: Math.max((d.expenses / maxVal) * 100, 2) }]} />
            </View>
            <Text style={chart.label}>{MONTHS[i].slice(0, 1)}</Text>
          </View>
        ))}
      </View>
      <View style={chart.legend}>
        <View style={chart.legendItem}><View style={[chart.dot, { backgroundColor: '#4A6741' }]} /><Text style={chart.legendText}>Income</Text></View>
        <View style={chart.legendItem}><View style={[chart.dot, { backgroundColor: '#B85C38' }]} /><Text style={chart.legendText}>Expenses</Text></View>
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const [monthly, setMonthly] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [symbol, setSymbol] = useState('$');
  const [year, setYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    const [m, s, c, me] = await Promise.all([
      api.get(`/api/reports/monthly?year=${year}`),
      api.get(`/api/reports/summary?year=${year}`),
      api.get(`/api/reports/categories?year=${year}`),
      api.get('/api/auth/me'),
    ]);
    setMonthly(m.data);
    setSummary(s.data);
    setCategories(c.data);
    setSymbol(getCurrencySymbol(me.data.currency));
  };

  useFocusEffect(useCallback(() => { load(); }, [year]));

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      // Open PDF in browser — mobile can't download directly
      const token = (await api.get('/api/auth/me')).config?.headers?.Authorization?.replace('Bearer ', '');
      const baseURL = api.defaults.baseURL;
      const url = `${baseURL}/api/reports/pdf?year=${year}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open PDF. Please try from the web app.');
    }
    setDownloading(false);
  };

  const incomeCategories = categories.filter(c => c.type === 'income').slice(0, 5);
  const expenseCategories = categories.filter(c => c.type === 'expense').slice(0, 5);
  const totalIncome = parseFloat(summary?.total_income || 0);
  const totalExpenses = parseFloat(summary?.total_expenses || 0);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Reports</Text>
            <Text style={s.sub}>Financial overview</Text>
          </View>
          <View style={s.yearRow}>
            <TouchableOpacity onPress={() => setYear(y => y - 1)} style={s.yearBtn}>
              <Text style={s.yearBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={s.yearText}>{year}</Text>
            <TouchableOpacity onPress={() => setYear(y => y + 1)} style={s.yearBtn}>
              <Text style={s.yearBtnText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Download PDF button */}
        <TouchableOpacity style={s.pdfBtn} onPress={downloadPDF} disabled={downloading}>
          <Text style={s.pdfBtnText}>{downloading ? 'Opening...' : '📄 Download PDF Report'}</Text>
        </TouchableOpacity>

        {/* Year summary */}
        <View style={s.summaryGrid}>
          {[
            { label: 'Total Income', value: fmt(symbol, summary?.total_income), color: '#4A6741' },
            { label: 'Total Expenses', value: fmt(symbol, summary?.total_expenses), color: '#B85C38' },
            { label: 'Net Profit', value: fmt(symbol, summary?.net_profit), color: '#fff' },
            { label: 'Tax Owed', value: fmt(symbol, summary?.tax_owed), color: COLORS.goldLight },
          ].map(item => (
            <View key={item.label} style={s.summaryCard}>
              <Text style={s.summaryLabel}>{item.label}</Text>
              <Text style={[s.summaryValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Monthly Overview</Text>
          {monthly.length > 0 && <BarChart data={monthly} />}
        </View>

        {/* Income categories */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Top Income Categories</Text>
          {incomeCategories.length === 0
            ? <Text style={s.empty}>No income data</Text>
            : incomeCategories.map((c, i) => (
              <View key={i} style={s.catRow}>
                <Text style={s.catName} numberOfLines={1}>{c.category}</Text>
                <View style={s.catBar}>
                  <View style={[s.catBarFill, { width: `${Math.min((parseFloat(c.total) / totalIncome) * 100, 100)}%`, backgroundColor: '#4A6741' }]} />
                </View>
                <Text style={s.catAmt}>{fmt(symbol, c.total)}</Text>
              </View>
            ))
          }
        </View>

        {/* Expense categories */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Top Expense Categories</Text>
          {expenseCategories.length === 0
            ? <Text style={s.empty}>No expense data</Text>
            : expenseCategories.map((c, i) => (
              <View key={i} style={s.catRow}>
                <Text style={s.catName} numberOfLines={1}>{c.category}</Text>
                <View style={s.catBar}>
                  <View style={[s.catBarFill, { width: `${Math.min((parseFloat(c.total) / totalExpenses) * 100, 100)}%`, backgroundColor: '#B85C38' }]} />
                </View>
                <Text style={[s.catAmt, { color: '#B85C38' }]}>{fmt(symbol, c.total)}</Text>
              </View>
            ))
          }
        </View>

        {/* Top clients */}
        {summary?.top_clients?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Top Clients</Text>
            {summary.top_clients.map((c, i) => (
              <View key={i} style={s.clientRow}>
                <View style={s.clientRank}><Text style={s.clientRankText}>{i + 1}</Text></View>
                <Text style={s.clientName}>{c.name}</Text>
                <Text style={s.clientAmt}>{fmt(symbol, c.total)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const chart = StyleSheet.create({
  container: { marginTop: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, marginBottom: 8 },
  barGroup: { flex: 1, alignItems: 'center' },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  bar: { width: 6, borderRadius: 3 },
  incomeBar: { backgroundColor: '#4A6741' },
  expenseBar: { backgroundColor: '#B85C38' },
  label: { fontSize: 9, color: '#8A7E72', marginTop: 4 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#8A7E72' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { backgroundColor: '#1A1612', padding: 24, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yearBtn: { padding: 8 },
  yearBtnText: { color: COLORS.gold, fontSize: 22, fontWeight: '700' },
  yearText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pdfBtn: { margin: 16, marginBottom: 0, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2DDD6', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pdfBtnText: { color: '#1A1612', fontWeight: '600', fontSize: 14 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, backgroundColor: '#1A1612' },
  summaryCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  summaryLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '900' },
  card: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E2DDD6' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1612', marginBottom: 16 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  catName: { width: 80, fontSize: 12, color: '#1A1612', fontWeight: '500' },
  catBar: { flex: 1, height: 8, backgroundColor: '#F0ECE6', borderRadius: 4, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 4 },
  catAmt: { width: 60, fontSize: 12, fontWeight: '700', color: '#4A6741', textAlign: 'right' },
  clientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0ECE6', gap: 12 },
  clientRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  clientRankText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  clientName: { flex: 1, fontSize: 14, color: '#1A1612', fontWeight: '500' },
  clientAmt: { fontSize: 14, fontWeight: '700', color: '#1A1612' },
  empty: { textAlign: 'center', color: '#8A7E72', padding: 16, fontSize: 13 },
});