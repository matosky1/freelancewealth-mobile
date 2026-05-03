import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';
import ScreenLayout from '../components/ScreenLayout';

const getCurrencySymbol = (code) => {
  const map = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', INR: '₹', JPY: '¥', KES: 'KSh', AED: 'د.إ' };
  return map[code] || '$';
};

const fmtAmt = (symbol, amount) =>
  `${symbol}${(parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TaxScreen() {
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);

  const load = async () => {
    const [sum, me] = await Promise.all([
      api.get('/api/dashboard/summary'),
      api.get('/api/auth/me'),
    ]);
    setSummary(sum.data);
    setProfile(me.data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const symbol = getCurrencySymbol(profile?.currency);
  const income = parseFloat(summary?.income) || 0;
  const expenses = parseFloat(summary?.expenses) || 0;
  const net = income - expenses;
  const taxRate = parseFloat(profile?.tax_rate) || 0;
  const taxOwed = net * (taxRate / 100);
  const monthlyReserve = taxOwed / 12;

  return (
    <ScreenLayout title="Tax Estimator">
      <ScrollView>
        <View style={s.subHeader}>
          <Text style={s.subHeaderText}>Based on your {taxRate}% custom tax rate</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>ESTIMATED TAX OWED</Text>
          <Text style={s.bigNum}>{fmtAmt(symbol, taxOwed)}</Text>
          <Text style={s.rateNote}>At {taxRate}% of your net income</Text>
        </View>

        <View style={s.breakdown}>
          <Text style={s.breakdownTitle}>Breakdown</Text>
          {[
            { label: 'Gross income', val: fmtAmt(symbol, income), color: '#4A6741' },
            { label: 'Total expenses', val: `-${fmtAmt(symbol, expenses)}`, color: '#B85C38' },
            { label: 'Net taxable income', val: fmtAmt(symbol, net), color: '#1A1612' },
            { label: `Tax at ${taxRate}%`, val: fmtAmt(symbol, taxOwed), color: '#B85C38', bold: true },
          ].map(row => (
            <View key={row.label} style={s.row}>
              <Text style={[s.rowLabel, row.bold && { fontWeight: '700', color: '#1A1612' }]}>{row.label}</Text>
              <Text style={[s.rowVal, { color: row.color }, row.bold && { fontWeight: '700' }]}>{row.val}</Text>
            </View>
          ))}
        </View>

        <View style={s.reserve}>
          <Text style={s.reserveLabel}>Monthly reserve to set aside</Text>
          <Text style={s.reserveAmt}>{fmtAmt(symbol, monthlyReserve)}</Text>
          <Text style={s.reserveSub}>= Annual tax ÷ 12 months</Text>
        </View>

        {taxRate === 0 && (
          <View style={s.noTax}>
            <Text style={s.noTaxText}>⚙️ Set your tax rate in Profile → Financial Settings to see your tax estimate.</Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  subHeader: { backgroundColor: '#1A1612', paddingHorizontal: 24, paddingBottom: 16 },
  subHeaderText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  card: { backgroundColor: '#1A1612', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  cardTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
  bigNum: { color: '#E8B86D', fontSize: 48, fontWeight: '900', marginTop: 8 },
  rateNote: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  breakdown: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2DDD6' },
  breakdownTitle: { fontWeight: '700', fontSize: 15, marginBottom: 12, color: '#1A1612' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2DDD6' },
  rowLabel: { fontSize: 14, color: '#8A7E72' },
  rowVal: { fontSize: 14, fontWeight: '500' },
  reserve: { backgroundColor: COLORS.gold, margin: 16, marginTop: 0, borderRadius: 16, padding: 24, alignItems: 'center' },
  reserveLabel: { color: 'rgba(26,22,18,0.6)', fontSize: 13 },
  reserveAmt: { color: '#1A1612', fontSize: 40, fontWeight: '900', marginTop: 4 },
  reserveSub: { color: 'rgba(26,22,18,0.5)', fontSize: 12, marginTop: 4 },
  noTax: { margin: 16, marginTop: 0, padding: 16, backgroundColor: 'rgba(200,150,62,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(200,150,62,0.3)' },
  noTaxText: { color: '#8A7E72', fontSize: 13, lineHeight: 20, textAlign: 'center' },
});