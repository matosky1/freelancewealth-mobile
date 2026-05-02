import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { COLORS } from '../utils/theme';

export default function ScreenLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1612" translucent={false} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={() => setSidebarOpen(true)}>
            <View style={s.menuLine} />
            <View style={[s.menuLine, { width: 20 }]} />
            <View style={s.menuLine} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{title || route.name}</Text>
          <View style={s.headerRight}>
            <View style={s.headerAvatar}>
              <Text style={s.headerAvatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={s.content}>
        {children}
      </View>

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        navigation={navigation}
        currentRoute={route.name}
        user={user}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F3EC' },
  safe: { backgroundColor: '#1A1612' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1A1612' },
  menuBtn: { padding: 8, gap: 4, marginRight: 12, justifyContent: 'center' },
  menuLine: { width: 24, height: 2, backgroundColor: '#fff', borderRadius: 1, marginVertical: 2 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700' },
  headerRight: { marginLeft: 12 },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { flex: 1 },
});