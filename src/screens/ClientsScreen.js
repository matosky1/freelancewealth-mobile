import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet, RefreshControl, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const getCurrencySymbol = (code) => {
  const map = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', INR: '₹', JPY: '¥', KES: 'KSh', AED: 'د.إ' };
  return map[code] || '$';
};

const emptyForm = { name: '', email: '', phone: '', address: '', notes: '' };

export default function ClientsScreen() {
  const [clients, setClients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [symbol, setSymbol] = useState('$');

  const load = async () => {
    const [c, me] = await Promise.all([
      api.get('/api/clients'),
      api.get('/api/auth/me'),
    ]);
    setClients(c.data);
    setSymbol(getCurrencySymbol(me.data.currency));
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openAdd = () => { setEditClient(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (client) => { setEditClient(client); setForm({ name: client.name, email: client.email || '', phone: client.phone || '', address: client.address || '', notes: client.notes || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) { Alert.alert('Error', 'Client name is required'); return; }
    setSaving(true);
    try {
      if (editClient) {
        await api.patch(`/api/clients/${editClient.id}`, form);
      } else {
        await api.post('/api/clients', form);
      }
      setShowModal(false);
      load();
    } catch {
      Alert.alert('Error', 'Failed to save client');
    }
    setSaving(false);
  };

  const handleDelete = (client) => {
    Alert.alert('Delete Client', `Delete ${client.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/api/clients/${client.id}`);
        load();
      }}
    ]);
  };

  const totalRevenue = clients.reduce((s, c) => s + parseFloat(c.total_income || 0), 0);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Clients</Text>
        <Text style={s.total}>{clients.length} clients · {symbol}{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} total</Text>
      </View>

      <TouchableOpacity style={s.addBtn} onPress={openAdd}>
        <Text style={s.addBtnText}>+ Add Client</Text>
      </TouchableOpacity>

      <FlatList
        data={clients}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.empty}>No clients yet. Add your first client!</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{item.name}</Text>
                {item.email ? <Text style={s.cardSub}>{item.email}</Text> : null}
                {item.phone ? <Text style={s.cardSub}>{item.phone}</Text> : null}
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
                  <Text style={s.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={s.deleteBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.cardStats}>
              <View style={s.stat}>
                <Text style={s.statLabel}>Total Revenue</Text>
                <Text style={s.statValue}>{symbol}{parseFloat(item.total_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statLabel}>Invoices</Text>
                <Text style={s.statValue}>{item.invoice_count || 0}</Text>
              </View>
            </View>
            {item.notes ? <Text style={s.notes}>{item.notes}</Text> : null}
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{editClient ? 'Edit Client' : 'New Client'}</Text>
            <Text style={s.inputLabel}>Name *</Text>
            <TextInput style={s.input} value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder="Client name" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.inputLabel}>Email</Text>
            <TextInput style={s.input} value={form.email} onChangeText={v => setForm({...form, email: v})} placeholder="email@example.com" placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.inputLabel}>Phone</Text>
            <TextInput style={s.input} value={form.phone} onChangeText={v => setForm({...form, phone: v})} placeholder="+1 234 567 8900" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />
            <Text style={s.inputLabel}>Address</Text>
            <TextInput style={s.input} value={form.address} onChangeText={v => setForm({...form, address: v})} placeholder="Address" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.inputLabel}>Notes</Text>
            <TextInput style={[s.input, s.textarea]} value={form.notes} onChangeText={v => setForm({...form, notes: v})} placeholder="Any notes about this client" placeholderTextColor={COLORS.textMuted} multiline numberOfLines={3} />
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{editClient ? 'Save Changes' : 'Add Client'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { backgroundColor: '#1A1612', padding: 24, paddingTop: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  total: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  addBtn: { margin: 16, marginBottom: 0, backgroundColor: COLORS.gold, borderRadius: 50, padding: 14, alignItems: 'center' },
  addBtnText: { color: '#1A1612', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: '#8A7E72', padding: 40, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2DDD6' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  cardInfo: { flex: 1 },
  cardName: { fontWeight: '700', fontSize: 15, color: '#1A1612' },
  cardSub: { fontSize: 12, color: '#8A7E72', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: 'rgba(200,150,62,0.1)', borderRadius: 8, padding: 8 },
  editBtnText: { fontSize: 14 },
  deleteBtn: { backgroundColor: 'rgba(184,92,56,0.1)', borderRadius: 8, padding: 8 },
  deleteBtnText: { fontSize: 14 },
  cardStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0ECE6', paddingTop: 12, gap: 24 },
  stat: {},
  statLabel: { fontSize: 10, color: '#8A7E72', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1A1612', marginTop: 2 },
  notes: { fontSize: 12, color: '#8A7E72', marginTop: 8, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1612', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#8A7E72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F7F3EC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#1A1612', fontSize: 14, borderWidth: 1, borderColor: '#E2DDD6' },
  textarea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#1A1612', borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#8A7E72', fontSize: 15 },
});