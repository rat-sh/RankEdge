import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '@/constants';

const StudentProfileScreen = () => {
  const { user, clearAuth } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); clearAuth(); } },
    ]);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.avatarBox}>
        <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text></View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <View style={s.rolePill}><Text style={s.roleText}>STUDENT</Text></View>
      </View>
      {[
        { label: 'My Attendance', route: ROUTES.MY_ATTENDANCE },
        { label: 'Payment History', route: ROUTES.PAYMENT_HISTORY },
        { label: 'Interview Tracker', route: ROUTES.INTERVIEW_TRACKER },
        { label: 'Calendar', route: ROUTES.STUDENT_CALENDAR },
      ].map(item => (
        <TouchableOpacity key={item.label} style={s.menuItem} onPress={() => navigation.navigate(item.route)}>
          <Text style={s.menuLabel}>{item.label}</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 48 },
  avatarBox: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#064E3B', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#10B981' },
  name: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  rolePill: { backgroundColor: '#064E3B', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: '#10B981', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 8 },
  menuLabel: { fontSize: 15, color: '#F9FAFB', fontWeight: '600' },
  menuArrow: { fontSize: 20, color: '#6B7280' },
  logoutBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: '#7F1D1D', alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
});

export default StudentProfileScreen;
