import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = 280;

const NAV_ITEMS = [
  { name: 'Dashboard', icon: '📊', label: 'Dashboard' },
  { name: 'Income',    icon: '💰', label: 'Income' },
  { name: 'Expenses',  icon: '🧾', label: 'Expenses' },
  { name: 'Tax',       icon: '🧮', label: 'Tax Estimator' },
  { name: 'Clients',   icon: '👥', label: 'Clients' },
  { name: 'Inventory', icon: '📦', label: 'Inventory' },
  { name: 'Invoices',  icon: '📋', label: 'Invoices' },
  { name: 'Reports',   icon: '📈', label: 'Reports' },
  { name: 'AI',        icon: '✦',  label: 'AI Analysis' },
];

const BOTTOM_ITEMS = [
  { name: 'Profile',  icon: '👤', label: 'Profile' },
  { name: 'Pricing',  icon: '⭐', label: 'Upgrade Plan' },
];

export function useDrawer() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

export default function Sidebar({ open, setOpen, navigation, currentRoute, user }) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, { toValue: -DRAWER_WIDTH, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [open]);

  const navigate = (screenName) => {
    setOpen(false);
    setTimeout(() => navigation.navigate(screenName), 50);
  };

  if (!open) return null;

  return (
    <View style={s.overlay}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <Animated.View style={[s.backdrop, { opacity }]} />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View style={[s.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Brand */}
          <View style={s.brand}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={s.brandText}>
              <Text style={s.brandName}>Freelance<Text style={s.brandGold}>Wealth</Text></Text>
              <Text style={s.brandEmail} numberOfLines={1}>{user?.email || ''}</Text>
            </View>
            <TouchableOpacity onPress={() => setOpen(false)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Nav label */}
          <Text style={s.navLabel}>Overview</Text>

          {/* Nav items */}
          <View style={s.nav}>
            {NAV_ITEMS.map(item => {
              const isActive = currentRoute === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[s.navItem, isActive && s.navItemActive]}
                  onPress={() => navigate(item.name)}
                >
                  <Text style={s.navIcon}>{item.icon}</Text>
                  <Text style={[s.navLabel2, isActive && s.navLabelActive]}>{item.label}</Text>
                  {isActive && <View style={s.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom items */}
          <View style={s.bottomSection}>
            <Text style={s.navLabel}>Account</Text>
            {BOTTOM_ITEMS.map(item => {
              const isActive = currentRoute === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[s.navItem, isActive && s.navItemActive, item.name === 'Pricing' && s.upgradeItem]}
                  onPress={() => navigate(item.name)}
                >
                  <Text style={s.navIcon}>{item.icon}</Text>
                  <Text style={[s.navLabel2, isActive && s.navLabelActive, item.name === 'Pricing' && s.upgradeLabel]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Know your money. Own your future.</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: '#1A1612', shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20 },

  brand: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  brandText: { flex: 1 },
  brandName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  brandGold: { color: COLORS.gold },
  brandEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 4 },
  closeBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 16 },

  navLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 20, marginBottom: 4, marginTop: 8 },

  nav: { paddingHorizontal: 12 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  navItemActive: { backgroundColor: 'rgba(200,150,62,0.15)' },
  navIcon: { fontSize: 16, width: 28 },
  navLabel2: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  navLabelActive: { color: COLORS.gold, fontWeight: '700' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },

  bottomSection: { paddingHorizontal: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 8 },
  upgradeItem: { backgroundColor: 'rgba(200,150,62,0.08)', borderWidth: 1, borderColor: 'rgba(200,150,62,0.2)' },
  upgradeLabel: { color: COLORS.gold, fontWeight: '600' },

  footer: { padding: 20, marginTop: 'auto' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontStyle: 'italic' },
});