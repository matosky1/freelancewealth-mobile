import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet, RefreshControl, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', INR: '₹', JPY: '¥', KES: 'KSh', AED: 'AED ' };
const STATUS_COLORS = { draft: '#8A7E72', sent: '#C8963E', paid: '#4A6741', overdue: '#B85C38' };
const STATUS_LIST = ['draft', 'sent', 'paid', 'overdue'];
const emptyItem = { description: '', quantity: '1', unit_price: '' };

export default function InvoicesScreen() {
  const navigation = useNavigation();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState('free');
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(null);

  const [form, setForm] = useState({
    client_id: '', recipient_name: '', recipient_email: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '', notes: '', tax_rate: '0', currency: 'USD',
    items: [{ ...emptyItem }]
  });

  const load = async () => {
    try {
      const [inv, cli, me, billing] = await Promise.all([
        api.get('/api/invoices').catch(() => ({ data: [] })),
        api.get('/api/clients'),
        api.get('/api/auth/me'),
        api.get('/api/billing/status').catch(() => ({ data: { plan: 'free' } })),
      ]);
      setInvoices(inv.data);
      setClients(cli.data);
      setProfile(me.data);
      setPlan(billing.data.plan || 'free');
      setForm(f => ({ ...f, tax_rate: String(me.data.tax_rate || 0), currency: me.data.currency || 'USD' }));
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const symbol = CURRENCY_SYMBOLS[form.currency] || '$';
  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
  const taxAmount = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const total = subtotal + taxAmount;
  const fmt = (sym, n) => `${sym}${(parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const openNew = () => {
    setEditInvoice(null);
    setForm({ client_id: '', recipient_name: '', recipient_email: '', issue_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '', tax_rate: String(profile?.tax_rate || 0), currency: profile?.currency || 'USD', items: [{ ...emptyItem }] });
    setShowForm(true);
  };

  const openEdit = async (inv) => {
    try {
      const res = await api.get(`/api/invoices/${inv.id}`);
      const full = res.data;
      setEditInvoice(full);
      setForm({
        client_id: full.client_id || '', recipient_name: full.recipient_name || '', recipient_email: full.recipient_email || '',
        issue_date: full.issue_date?.slice(0, 10) || '', due_date: full.due_date?.slice(0, 10) || '',
        notes: full.notes || '', tax_rate: String(full.tax_rate || 0), currency: full.currency || 'USD',
        items: full.items.map(i => ({ description: i.description, quantity: String(i.quantity), unit_price: String(i.unit_price) }))
      });
      setShowForm(true);
    } catch { Alert.alert('Error', 'Failed to load invoice'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const selectClient = (client) => {
    setForm(f => ({
      ...f,
      client_id: client ? client.id : '',
      recipient_name: client ? client.name : f.recipient_name,
      recipient_email: client ? (client.email || f.recipient_email) : f.recipient_email,
    }));
  };

  const save = async () => {
    if (!form.items.some(i => i.description)) { Alert.alert('Error', 'Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tax_rate: parseFloat(form.tax_rate) || 0, items: form.items.filter(i => i.description).map(i => ({ ...i, quantity: parseFloat(i.quantity) || 1, unit_price: parseFloat(i.unit_price) || 0 })) };
      if (editInvoice) await api.patch(`/api/invoices/${editInvoice.id}`, payload);
      else await api.post('/api/invoices', payload);
      setShowForm(false);
      load();
      Alert.alert('✅ Saved', editInvoice ? 'Invoice updated!' : 'Invoice created!');
    } catch { Alert.alert('Error', 'Failed to save invoice'); }
    setSaving(false);
  };

  const sendInvoice = async (inv) => {
    const toEmail = inv.recipient_email || inv.client_email;
    const toName = inv.recipient_name || inv.client_name || 'customer';
    if (!toEmail) { Alert.alert('Error', 'No recipient email found. Please add a recipient email.'); return; }
    Alert.alert('Send Invoice', `Send ${inv.invoice_number} to ${toName} (${toEmail})?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setSending(inv.id);
        try {
          await api.post(`/api/invoices/${inv.id}/send`);
          Alert.alert('✅ Sent', `Invoice sent to ${toEmail}!`);
          load();
        } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to send'); }
        setSending(null);
      }}
    ]);
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/api/invoices/${id}/status`, { status });
    setShowStatusModal(null);
    load();
  };

  const deleteInvoice = (inv) => {
    Alert.alert('Delete', `Delete ${inv.invoice_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/api/invoices/${inv.id}`); load(); } }
    ]);
  };

  if (plan !== 'business') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>Invoices</Text>
          <Text style={s.sub}>Business plan feature</Text>
        </View>
        <View style={s.upgradeWall}>
          <Text style={s.upgradeIcon}>🧾</Text>
          <Text style={s.upgradeTitle}>Invoice Generation</Text>
          <Text style={s.upgradeDesc}>Create and send professional invoices to any customer email.</Text>
          <View style={s.upgradeFeatures}>
            {['Professional PDF invoices', 'Send to any email address', 'Auto tax calculation', 'Track draft/sent/paid/overdue', 'Auto invoice numbering'].map((f, i) => (
              <Text key={i} style={s.upgradeFeature}>✅ {f}</Text>
            ))}
          </View>
          <TouchableOpacity style={s.upgradeBtn} onPress={() => navigation.navigate('Pricing')}>
            <Text style={s.upgradeBtnText}>Upgrade to Business — $19/month →</Text>
          </TouchableOpacity>
          <Text style={s.upgradeNote}>Cancel anytime. No hidden fees.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.total), 0);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Invoices</Text>
          <Text style={s.sub}>{invoices.length} invoices · {symbol}{totalCollected.toFixed(2)} collected</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Text style={s.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🧾</Text>
            <Text style={s.emptyText}>No invoices yet. Tap + New to create one!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sym = CURRENCY_SYMBOLS[item.currency] || '$';
          const recipientName = item.recipient_name || item.client_name || 'No recipient';
          const recipientEmail = item.recipient_email || item.client_email || '';
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.cardLeft}>
                  <Text style={s.invoiceNum}>{item.invoice_number}</Text>
                  <Text style={s.invoiceClient}>{recipientName}</Text>
                  {recipientEmail ? <Text style={s.invoiceEmail}>{recipientEmail}</Text> : null}
                  {item.due_date && <Text style={s.invoiceDate}>Due {new Date(item.due_date).toLocaleDateString()}</Text>}
                </View>
                <View style={s.cardRight}>
                  <Text style={s.invoiceTotal}>{sym}{parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                  <TouchableOpacity style={[s.statusBadge, { borderColor: STATUS_COLORS[item.status] }]} onPress={() => setShowStatusModal(item)}>
                    <Text style={[s.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status.toUpperCase()}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(item)}>
                  <Text style={s.actionBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => sendInvoice(item)} disabled={sending === item.id}>
                  <Text style={s.actionBtnText}>{sending === item.id ? '...' : '📧 Send'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => deleteInvoice(item)}>
                  <Text style={s.actionBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Invoice Form Modal */}
      <Modal visible={showForm} animationType="slide">
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalNav}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>{editInvoice ? 'Edit Invoice' : 'New Invoice'}</Text>
            <TouchableOpacity onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.gold} /> : <Text style={s.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            {/* Client selector */}
            <Text style={s.label}>Client (optional — auto-fills name & email)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity style={[s.chip, !form.client_id && s.chipActive]} onPress={() => selectClient(null)}>
                <Text style={[s.chipText, !form.client_id && s.chipTextActive]}>None</Text>
              </TouchableOpacity>
              {clients.map(c => (
                <TouchableOpacity key={c.id} style={[s.chip, form.client_id === c.id && s.chipActive]} onPress={() => selectClient(c)}>
                  <Text style={[s.chipText, form.client_id === c.id && s.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Recipient Name *</Text>
            <TextInput style={s.input} value={form.recipient_name} onChangeText={v => setForm({...form, recipient_name: v})} placeholder="Customer full name" placeholderTextColor={COLORS.textMuted} />

            <Text style={s.label}>Recipient Email *</Text>
            <TextInput style={s.input} value={form.recipient_email} onChangeText={v => setForm({...form, recipient_email: v})} placeholder="customer@email.com" placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" />

            <Text style={s.label}>Issue Date</Text>
            <TextInput style={s.input} value={form.issue_date} onChangeText={v => setForm({...form, issue_date: v})} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />

            <Text style={s.label}>Due Date</Text>
            <TextInput style={s.input} value={form.due_date} onChangeText={v => setForm({...form, due_date: v})} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />

            <Text style={[s.label, { marginTop: 8 }]}>Line Items</Text>
            {form.items.map((item, i) => (
              <View key={i} style={s.itemCard}>
                <TextInput style={s.input} value={item.description} onChangeText={v => updateItem(i, 'description', v)} placeholder="Description" placeholderTextColor={COLORS.textMuted} />
                <View style={s.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.inputLabel}>Qty</Text>
                    <TextInput style={s.input} value={item.quantity} onChangeText={v => updateItem(i, 'quantity', v)} placeholder="1" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={s.inputLabel}>Unit Price</Text>
                    <TextInput style={s.input} value={item.unit_price} onChangeText={v => updateItem(i, 'unit_price', v)} placeholder="0.00" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={s.inputLabel}>Amount</Text>
                    <View style={[s.input, { justifyContent: 'center' }]}>
                      <Text style={{ color: '#1A1612', fontWeight: '700' }}>{fmt(symbol, (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}</Text>
                    </View>
                  </View>
                </View>
                {form.items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(i)} style={s.removeBtn}>
                    <Text style={s.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={s.addItemBtn} onPress={addItem}>
              <Text style={s.addItemBtnText}>+ Add Line Item</Text>
            </TouchableOpacity>

            <View style={s.totalsCard}>
              <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalValue}>{fmt(symbol, subtotal)}</Text></View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Tax Rate (%)</Text>
                <TextInput style={s.taxInput} value={form.tax_rate} onChangeText={v => setForm({...form, tax_rate: v})} keyboardType="decimal-pad" />
              </View>
              {parseFloat(form.tax_rate) > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Tax</Text><Text style={s.totalValue}>{fmt(symbol, taxAmount)}</Text></View>}
              <View style={[s.totalRow, s.totalFinal]}><Text style={s.totalFinalLabel}>Total</Text><Text style={s.totalFinalValue}>{fmt(symbol, total)}</Text></View>
            </View>

            <Text style={s.label}>Notes</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => setForm({...form, notes: v})} placeholder="Payment terms, bank details..." placeholderTextColor={COLORS.textMuted} multiline />
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Status Modal */}
      <Modal visible={!!showStatusModal} animationType="slide" transparent>
        <View style={s.statusOverlay}>
          <View style={s.statusModal}>
            <Text style={s.statusModalTitle}>Update Status</Text>
            {STATUS_LIST.map(status => (
              <TouchableOpacity key={status} style={s.statusOption} onPress={() => updateStatus(showStatusModal?.id, status)}>
                <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                <Text style={s.statusOptionText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                {showStatusModal?.status === status && <Text style={s.statusCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.statusClose} onPress={() => setShowStatusModal(null)}>
              <Text style={s.statusCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { backgroundColor: '#1A1612', padding: 24, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.gold, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  upgradeWall: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  upgradeIcon: { fontSize: 56, marginBottom: 16 },
  upgradeTitle: { fontSize: 22, fontWeight: '900', color: '#1A1612', textAlign: 'center', marginBottom: 12 },
  upgradeDesc: { fontSize: 14, color: '#8A7E72', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  upgradeFeatures: { alignSelf: 'stretch', marginBottom: 32 },
  upgradeFeature: { fontSize: 14, color: '#1A1612', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E2DDD6' },
  upgradeBtn: { backgroundColor: COLORS.gold, borderRadius: 50, paddingVertical: 16, paddingHorizontal: 24, marginBottom: 12 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  upgradeNote: { fontSize: 12, color: '#8A7E72' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2DDD6' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardLeft: { flex: 1 },
  invoiceNum: { fontSize: 15, fontWeight: '700', color: '#1A1612' },
  invoiceClient: { fontSize: 13, color: '#8A7E72', marginTop: 2 },
  invoiceEmail: { fontSize: 12, color: '#8A7E72', marginTop: 1 },
  invoiceDate: { fontSize: 12, color: '#8A7E72', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  invoiceTotal: { fontSize: 18, fontWeight: '900', color: '#1A1612' },
  statusBadge: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#F0ECE6', paddingTop: 12 },
  actionBtn: { flex: 1, backgroundColor: '#F7F3EC', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2DDD6' },
  actionBtnDanger: { flex: 0, paddingHorizontal: 16 },
  actionBtnText: { fontSize: 13, color: '#1A1612', fontWeight: '500' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#8A7E72', marginBottom: 20 },

  modalSafe: { flex: 1, backgroundColor: '#F7F3EC' },
  modalNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2DDD6' },
  modalCancel: { fontSize: 15, color: '#8A7E72' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1612' },
  modalSave: { fontSize: 15, color: COLORS.gold, fontWeight: '700' },
  modalBody: { flex: 1, padding: 16 },

  label: { fontSize: 11, fontWeight: '600', color: '#8A7E72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  inputLabel: { fontSize: 10, color: '#8A7E72', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#1A1612', fontSize: 14, borderWidth: 1, borderColor: '#E2DDD6', marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2DDD6', marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#1A1612', borderColor: '#1A1612' },
  chipText: { fontSize: 13, color: '#8A7E72' },
  chipTextActive: { color: '#fff' },

  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2DDD6' },
  itemRow: { flexDirection: 'row' },
  removeBtn: { marginTop: 4, alignItems: 'center' },
  removeBtnText: { fontSize: 12, color: '#B85C38' },
  addItemBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E2DDD6', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  addItemBtnText: { fontSize: 14, color: '#8A7E72' },

  totalsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2DDD6' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0ECE6' },
  totalLabel: { fontSize: 14, color: '#8A7E72' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#1A1612' },
  taxInput: { width: 70, textAlign: 'right', backgroundColor: '#F7F3EC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#E2DDD6', fontSize: 14, color: '#1A1612' },
  totalFinal: { borderBottomWidth: 0, marginTop: 4 },
  totalFinalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1612' },
  totalFinalValue: { fontSize: 18, fontWeight: '900', color: COLORS.gold },

  statusOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  statusModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  statusModalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1612', marginBottom: 16, textAlign: 'center' },
  statusOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0ECE6', gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusOptionText: { flex: 1, fontSize: 15, color: '#1A1612', fontWeight: '500' },
  statusCheck: { fontSize: 16, color: COLORS.gold, fontWeight: '700' },
  statusClose: { marginTop: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F7F3EC', borderRadius: 12 },
  statusCloseText: { fontSize: 15, color: '#8A7E72' },
});