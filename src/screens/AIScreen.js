import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const SUGGESTED = [
  "How is my business performing this month?",
  "What are my biggest expenses?",
  "Am I on track financially this year?",
  "How much should I save for taxes?",
  "Which income category earns me the most?",
  "Give me tips to improve my cashflow",
];

const GREETING = { role: 'assistant', content: "👋 Hi! I'm your FreelanceWealth AI advisor. I can analyze your income, expenses, taxes and give you personalized business insights. What would you like to know?" };

export default function AIScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [plan, setPlan] = useState('free');
  const scrollRef = useRef(null);

  useFocusEffect(useCallback(() => {
    const init = async () => {
      try {
        const billing = await api.get('/api/billing/status');
        const userPlan = billing.data.plan || 'free';
        setPlan(userPlan);

        if (userPlan === 'free') { setLoadingHistory(false); return; }

        const history = await api.get('/api/ai/history');
        if (history.data.length > 0) {
          setMessages([GREETING, ...history.data]);
        }
      } catch {}
      setLoadingHistory(false);
    };
    init();
  }, []));

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.post('/api/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      if (err.response?.data?.error === 'upgrade_required') {
        Alert.alert(
          '⭐ Pro Feature',
          'AI Analysis requires a Pro or Business plan.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'See Pricing', onPress: () => navigation.navigate('Pricing') }
          ]
        );
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again." }]);
      }
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const clearHistory = () => {
    Alert.alert('Clear History', 'Delete all chat history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        await api.delete('/api/ai/history');
        setMessages([GREETING]);
      }}
    ]);
  };

  // Free plan upgrade wall
  if (plan === 'free' && !loadingHistory) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>AI Analysis</Text>
          <Text style={s.sub}>Powered by Claude</Text>
        </View>
        <View style={s.upgradeWall}>
          <Text style={s.upgradeIcon}>✦</Text>
          <Text style={s.upgradeTitle}>AI Analysis is a Pro Feature</Text>
          <Text style={s.upgradeDesc}>Get personalized financial insights powered by Claude AI with your real data.</Text>
          <View style={s.upgradeFeatures}>
            {['Ask anything about your finances', 'Personalized advice with real data', 'Chat history saved', 'Tax optimization tips', 'Cashflow predictions'].map((f, i) => (
              <Text key={i} style={s.upgradeFeature}>✅ {f}</Text>
            ))}
          </View>
          <TouchableOpacity style={s.upgradeBtn} onPress={() => navigation.navigate('Pricing')}>
            <Text style={s.upgradeBtnText}>Upgrade to Pro — $9/month →</Text>
          </TouchableOpacity>
          <Text style={s.upgradeNote}>Cancel anytime. No hidden fees.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>AI Analysis</Text>
          <Text style={s.sub}>Powered by Claude</Text>
        </View>
        <TouchableOpacity onPress={clearHistory}>
          <Text style={s.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} style={s.messages} contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
          {loadingHistory ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : (
            <>
              {messages.map((m, i) => (
                <View key={i} style={[s.bubble, m.role === 'user' ? s.userBubble : s.aiBubble]}>
                  {m.role === 'assistant' && <View style={s.aiAvatar}><Text style={s.aiAvatarText}>✦</Text></View>}
                  <View style={[s.bubbleInner, m.role === 'user' ? s.userBubbleInner : s.aiBubbleInner]}>
                    <Text style={[s.bubbleText, m.role === 'user' ? s.userText : s.aiText]}>{m.content}</Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={[s.bubble, s.aiBubble]}>
                  <View style={s.aiAvatar}><Text style={s.aiAvatarText}>✦</Text></View>
                  <View style={[s.aiBubbleInner, { paddingVertical: 16, paddingHorizontal: 20 }]}>
                    <ActivityIndicator color={COLORS.gold} size="small" />
                  </View>
                </View>
              )}

              {messages.length === 1 && !loading && (
                <View style={s.suggestions}>
                  <Text style={s.suggestionsTitle}>Try asking:</Text>
                  {SUGGESTED.map((q, i) => (
                    <TouchableOpacity key={i} style={s.suggestionBtn} onPress={() => sendMessage(q)}>
                      <Text style={s.suggestionText}>{q}</Text>
                      <Text style={s.suggestionArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your finances..."
            placeholderTextColor="#8A7E72"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={s.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { backgroundColor: '#1A1612', padding: 24, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  clearBtn: { color: COLORS.gold, fontSize: 13, fontWeight: '600' },

  upgradeWall: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  upgradeIcon: { fontSize: 56, color: COLORS.gold, marginBottom: 16 },
  upgradeTitle: { fontSize: 22, fontWeight: '900', color: '#1A1612', textAlign: 'center', marginBottom: 12 },
  upgradeDesc: { fontSize: 14, color: '#8A7E72', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  upgradeFeatures: { alignSelf: 'stretch', marginBottom: 32 },
  upgradeFeature: { fontSize: 14, color: '#1A1612', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E2DDD6' },
  upgradeBtn: { backgroundColor: COLORS.gold, borderRadius: 50, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 12 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  upgradeNote: { fontSize: 12, color: '#8A7E72' },

  messages: { flex: 1 },
  bubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2, flexShrink: 0 },
  aiAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bubbleInner: { maxWidth: '80%', borderRadius: 18, padding: 12 },
  userBubbleInner: { backgroundColor: '#1A1612', borderBottomRightRadius: 4 },
  aiBubbleInner: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2DDD6' },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#1A1612' },

  suggestions: { marginTop: 8 },
  suggestionsTitle: { fontSize: 11, color: '#8A7E72', marginBottom: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestionBtn: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2DDD6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suggestionText: { fontSize: 13, color: '#1A1612', flex: 1 },
  suggestionArrow: { fontSize: 13, color: COLORS.gold, marginLeft: 8 },

  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2DDD6', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, backgroundColor: '#F7F3EC', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1A1612', maxHeight: 100, borderWidth: 1, borderColor: '#E2DDD6' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1612', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#C0BAB2' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
});