import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free forever',
    color: '#8A7E72',
    features: [
      '✅ Up to 50 transactions/month',
      '✅ Up to 5 clients',
      '✅ Dashboard & KPIs',
      '✅ Income & expense tracking',
      '✅ Custom tax calculator',
      '✅ Multi-currency (12 currencies)',
      '✅ Recurring expense tracking',
      '✅ Business product inventory',
      '❌ AI Business Analysis',
      '❌ PDF Report downloads',
      '❌ Invoice generation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$5 / month',
    color: COLORS.gold,
    popular: true,
    features: [
      '✅ Unlimited transactions',
      '✅ Unlimited clients',
      '✅ Everything in Free',
      '✅ AI Business Analysis (Claude)',
      '✅ PDF Report downloads',
      '✅ Email reminders for expenses',
      '✅ Business product inventory',
      '❌ Invoice generation',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '$9 / month',
    color: '#1A1612',
    features: [
      '✅ Everything in Pro',
      '✅ Unlimited transactions & clients',
      '✅ Invoice generation & tracking',
      '✅ Business product inventory',
      '✅ AI Business Analysis (Claude)',
      '✅ PDF Report downloads',
      '✅ Email reminders for expenses',
    ],
  },
];

export default function PricingScreen({ navigation }) {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    api.get('/api/billing/status')
      .then(r => setCurrentPlan(r.data.plan || 'free'))
      .catch(() => {});
  }, []);

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return;
    setLoading(planId);
    try {
      const res = await api.post('/api/billing/checkout', { plan: planId });
      await Linking.openURL(res.data.url);
    } catch {
      Alert.alert('Error', 'Failed to start checkout. Please try again.');
    }
    setLoading(null);
  };

  const handleManage = async () => {
    setLoading('portal');
    try {
      const res = await api.post('/api/billing/portal');
      await Linking.openURL(res.data.url);
    } catch {
      Alert.alert('Error', 'Failed to open billing portal.');
    }
    setLoading(null);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Choose Your Plan</Text>
        <Text style={s.sub}>Start free. Upgrade when you're ready.</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const isLoading = loading === plan.id;

          return (
            <View key={plan.id} style={[s.card, plan.popular && s.popularCard]}>
              {plan.popular && (
                <View style={s.popularBadge}>
                  <Text style={s.popularBadgeText}>⭐ Most Popular</Text>
                </View>
              )}

              <View style={s.cardHeader}>
                <Text style={[s.planName, { color: plan.color }]}>{plan.name}</Text>
                <Text style={s.planPrice}>{plan.price}</Text>
              </View>

              <View style={s.features}>
                {plan.features.map((f, i) => (
                  <Text key={i} style={[s.feature, f.startsWith('❌') && s.featureOff]}>{f}</Text>
                ))}
              </View>

              {isCurrent ? (
                <View style={s.currentBadge}>
                  <Text style={s.currentBadgeText}>✓ Current Plan</Text>
                </View>
              ) : plan.id === 'free' ? (
                <View style={s.currentBadge}>
                  <Text style={s.currentBadgeText}>Free Forever</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.upgradeBtn, { backgroundColor: plan.color }]}
                  onPress={() => handleUpgrade(plan.id)}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.upgradeBtnText}>Upgrade to {plan.name} →</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {currentPlan !== 'free' && (
          <TouchableOpacity style={s.manageBtn} onPress={handleManage} disabled={loading === 'portal'}>
            {loading === 'portal'
              ? <ActivityIndicator color={COLORS.gold} />
              : <Text style={s.manageBtnText}>Manage or Cancel Subscription</Text>
            }
          </TouchableOpacity>
        )}

        <Text style={s.note}>Cancel anytime. No hidden fees. All data retained on downgrade.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { backgroundColor: '#1A1612', padding: 24, paddingTop: 12 },
  backText: { color: COLORS.gold, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2DDD6' },
  popularCard: { borderColor: COLORS.gold, borderWidth: 2 },
  popularBadge: { backgroundColor: COLORS.gold, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  popularBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  planName: { fontSize: 20, fontWeight: '900' },
  planPrice: { fontSize: 15, fontWeight: '700', color: '#1A1612' },
  features: { marginBottom: 16 },
  feature: { fontSize: 13, color: '#1A1612', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F0ECE6' },
  featureOff: { color: '#8A7E72' },
  currentBadge: { backgroundColor: '#F7F3EC', borderRadius: 50, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2DDD6' },
  currentBadgeText: { color: '#8A7E72', fontWeight: '600', fontSize: 14 },
  upgradeBtn: { borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  manageBtn: { padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2DDD6', borderRadius: 50, backgroundColor: '#fff', marginBottom: 16 },
  manageBtnText: { color: '#8A7E72', fontSize: 14 },
  note: { textAlign: 'center', fontSize: 12, color: '#8A7E72', marginTop: 8 },
});