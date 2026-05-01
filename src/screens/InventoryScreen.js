import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet, RefreshControl, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const getCurrencySymbol = (code) => {
  const map = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', INR: '₹', JPY: '¥', KES: 'KSh', AED: 'AED ' };
  return map[code] || '$';
};

const CATEGORIES_PRODUCT = ['Electronics', 'Clothing', 'Food & Beverage', 'Health & Beauty', 'Home & Garden', 'Art & Crafts', 'Books', 'Tools', 'Other'];
const CATEGORIES_SERVICE = ['Design', 'Development', 'Consulting', 'Writing', 'Photography', 'Video', 'Marketing', 'Coaching', 'Other'];
const UNITS = ['unit', 'piece', 'kg', 'g', 'litre', 'box', 'pack', 'pair', 'set'];

const emptyForm = { name: '', description: '', category: '', type: 'product', cost_price: '', selling_price: '', hourly_rate: '', quantity: '', unit: 'unit' };

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('all');
  const [symbol, setSymbol] = useState('$');

  const load = async () => {
    const [p, me] = await Promise.all([api.get('/api/products'), api.get('/api/auth/me')]);
    setItems(p.data);
    setSymbol(getCurrencySymbol(me.data.currency));
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const fmt = (n) => `${symbol}${(parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, description: item.description || '', category: item.category || '', type: item.type, cost_price: String(item.cost_price || ''), selling_price: String(item.selling_price || ''), hourly_rate: String(item.hourly_rate || ''), quantity: String(item.quantity || ''), unit: item.unit || 'unit' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { Alert.alert('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, cost_price: parseFloat(form.cost_price) || 0, selling_price: parseFloat(form.selling_price) || 0, hourly_rate: parseFloat(form.hourly_rate) || 0, quantity: parseInt(form.quantity) || 0 };
      if (editId) await api.patch(`/api/products/${editId}`, payload);
      else await api.post('/api/products', payload);
      setShowModal(false);
      load();
    } catch { Alert.alert('Error', 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = (item) => {
    Alert.alert('Delete', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/api/products/${item.id}`); load(); } }
    ]);
  };

  const filtered = items.filter(i => tab === 'all' || i.type === tab);
  const totalValue = items.filter(i => i.type === 'product').reduce((s, i) => s + (parseFloat(i.selling_price) * parseInt(i.quantity || 0)), 0);
  const categories = form.type === 'service' ? CATEGORIES_SERVICE : CATEGORIES_PRODUCT;
  const margin = form.type === 'product' && form.cost_price && form.selling_price ? parseFloat(form.selling_price) - parseFloat(form.cost_price) : 0;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Inventory</Text>
          <Text style={s.sub}>{items.length} items · {fmt(totalValue)} value</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {[['all', 'All'], ['product', '📦 Products'], ['service', '⚡ Services']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key)}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.empty}>No items yet. Tap + Add to get started!</Text>}
        renderItem={({ item }) => {
          const margin = item.type === 'product' ? parseFloat(item.selling_price) - parseFloat(item.cost_price) : 0;
          const marginPct = item.cost_price > 0 ? ((margin / parseFloat(item.cost_price)) * 100).toFixed(1) : 0;
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.cardIcon}>{item.type === 'service' ? '⚡' : '📦'}</Text>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{item.name}</Text>
                  {item.category ? <Text style={s.cardCat}>{item.category}</Text> : null}
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}><Text>✏️</Text></TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}><Text>🗑</Text></TouchableOpacity>
                </View>
              </View>
              {item.description ? <Text style={s.cardDesc}>{item.description}</Text> : null}
              <View style={s.cardStats}>
                {item.type === 'product' ? (
                  <>
                    <View style={s.stat}><Text style={s.statLabel}>Cost</Text><Text style={s.statValue}>{fmt(item.cost_price)}</Text></View>
                    <View style={s.stat}><Text style={s.statLabel}>Price</Text><Text style={s.statValue}>{fmt(item.selling_price)}</Text></View>
                    <View style={s.stat}><Text style={s.statLabel}>Margin</Text><Text style={[s.statValue, { color: margin >= 0 ? '#4A6741' : '#B85C38' }]}>{marginPct}%</Text></View>
                    <View style={s.stat}><Text style={s.statLabel}>Stock</Text><Text style={s.statValue}>{item.quantity} {item.unit}</Text></View>
                  </>
                ) : (
                  <>
                    {item.hourly_rate > 0 && <View style={s.stat}><Text style={s.statLabel}>Hourly</Text><Text style={s.statValue}>{fmt(item.hourly_rate)}/hr</Text></View>}
                    {item.selling_price > 0 && <View style={s.stat}><Text style={s.statLabel}>Fixed</Text><Text style={s.statValue}>{fmt(item.selling_price)}</Text></View>}
                  </>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>{editId ? 'Edit Item' : 'Add New Item'}</Text>

              {/* Type toggle */}
              <View style={s.typeToggle}>
                <TouchableOpacity style={[s.typeBtn, form.type === 'product' && s.typeBtnActive]} onPress={() => setForm({...form, type: 'product', category: ''})}>
                  <Text style={[s.typeBtnText, form.type === 'product' && s.typeBtnTextActive]}>📦 Product</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.typeBtn, form.type === 'service' && s.typeBtnActive]} onPress={() => setForm({...form, type: 'service', category: ''})}>
                  <Text style={[s.typeBtnText, form.type === 'service' && s.typeBtnTextActive]}>⚡ Service</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.inputLabel}>Name *</Text>
              <TextInput style={s.input} value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder={form.type === 'service' ? 'e.g. Logo Design Package' : 'e.g. Wireless Headphones'} placeholderTextColor={COLORS.textMuted} />

              <Text style={s.inputLabel}>Description</Text>
              <TextInput style={[s.input, s.textarea]} value={form.description} onChangeText={v => setForm({...form, description: v})} placeholder="Describe this item..." placeholderTextColor={COLORS.textMuted} multiline numberOfLines={2} />

              <Text style={s.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map(c => (
                  <TouchableOpacity key={c} style={[s.chip, form.category === c && s.chipActive]} onPress={() => setForm({...form, category: c})}>
                    <Text style={[s.chipText, form.category === c && s.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {form.type === 'product' ? (
                <>
                  <Text style={s.inputLabel}>Cost Price (what you pay)</Text>
                  <TextInput style={s.input} value={form.cost_price} onChangeText={v => setForm({...form, cost_price: v})} placeholder="0.00" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />

                  <Text style={s.inputLabel}>Selling Price (what you charge)</Text>
                  <TextInput style={s.input} value={form.selling_price} onChangeText={v => setForm({...form, selling_price: v})} placeholder="0.00" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />

                  {form.cost_price && form.selling_price && (
                    <View style={s.marginPreview}>
                      <Text style={s.marginPreviewText}>Profit margin: </Text>
                      <Text style={[s.marginPreviewValue, { color: margin >= 0 ? '#4A6741' : '#B85C38' }]}>{fmt(margin)} per unit</Text>
                    </View>
                  )}

                  <Text style={s.inputLabel}>Quantity in Stock</Text>
                  <TextInput style={s.input} value={form.quantity} onChangeText={v => setForm({...form, quantity: v})} placeholder="0" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />

                  <Text style={s.inputLabel}>Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {UNITS.map(u => (
                      <TouchableOpacity key={u} style={[s.chip, form.unit === u && s.chipActive]} onPress={() => setForm({...form, unit: u})}>
                        <Text style={[s.chipText, form.unit === u && s.chipTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <>
                  <Text style={s.inputLabel}>Hourly Rate</Text>
                  <TextInput style={s.input} value={form.hourly_rate} onChangeText={v => setForm({...form, hourly_rate: v})} placeholder="0.00" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />

                  <Text style={s.inputLabel}>Fixed Price (per project)</Text>
                  <TextInput style={s.input} value={form.selling_price} onChangeText={v => setForm({...form, selling_price: v})} placeholder="0.00" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
                </>
              )}

              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{editId ? 'Save Changes' : 'Add Item'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
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
  tabs: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#1A1612' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  tabActive: { backgroundColor: '#fff', borderColor: '#fff' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#1A1612', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#8A7E72', padding: 40, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2DDD6' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  cardIcon: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1612' },
  cardCat: { fontSize: 11, color: '#8A7E72', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardActions: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: 'rgba(200,150,62,0.1)', borderRadius: 8, padding: 7 },
  deleteBtn: { backgroundColor: 'rgba(184,92,56,0.1)', borderRadius: 8, padding: 7 },
  cardDesc: { fontSize: 12, color: '#8A7E72', marginBottom: 10, lineHeight: 18 },
  cardStats: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0ECE6' },
  stat: {},
  statLabel: { fontSize: 9, color: '#8A7E72', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1A1612', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1612', marginBottom: 20, textAlign: 'center' },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#E2DDD6', alignItems: 'center', backgroundColor: '#F7F3EC' },
  typeBtnActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(200,150,62,0.08)' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#8A7E72' },
  typeBtnTextActive: { color: COLORS.gold },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#8A7E72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F7F3EC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#1A1612', fontSize: 14, borderWidth: 1, borderColor: '#E2DDD6' },
  textarea: { height: 70, textAlignVertical: 'top' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2DDD6', marginRight: 8, backgroundColor: '#F7F3EC' },
  chipActive: { backgroundColor: '#1A1612', borderColor: '#1A1612' },
  chipText: { fontSize: 12, color: '#8A7E72' },
  chipTextActive: { color: '#fff' },
  marginPreview: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(200,150,62,0.08)', borderRadius: 8, marginVertical: 8 },
  marginPreviewText: { fontSize: 13, color: '#8A7E72' },
  marginPreviewValue: { fontSize: 13, fontWeight: '700' },
  saveBtn: { backgroundColor: '#1A1612', borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  cancelBtnText: { color: '#8A7E72', fontSize: 14 },
});