import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '@/constants';

const { width } = Dimensions.get('window');

const LandingScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      <View style={s.header}>
        <View style={s.logoBox}><Text style={s.logoText}>R</Text></View>
        <Text style={s.brand}>RankEdge</Text>
        <Text style={s.sub}>Private education platform for{'\n'}serious teachers & students</Text>
      </View>

      <View style={s.cards}>
        <TouchableOpacity style={[s.card, s.teacherCard]} onPress={() => navigation.navigate(ROUTES.SIGN_UP_TEACHER)} activeOpacity={0.85}>
          <Text style={s.cardIcon}>👨‍🏫</Text>
          <Text style={s.cardTitle}>I'm a Teacher</Text>
          <Text style={s.cardDesc}>Create batches, upload content{'\n'}& track student progress</Text>
          <View style={s.cardBtn}><Text style={s.cardBtnText}>Get Started →</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={[s.card, s.studentCard]} onPress={() => navigation.navigate(ROUTES.SIGN_UP_STUDENT)} activeOpacity={0.85}>
          <Text style={s.cardIcon}>🎓</Text>
          <Text style={s.cardTitle}>I'm a Student</Text>
          <Text style={s.cardDesc}>Join batches, attempt exams{'\n'}& access study material</Text>
          <View style={[s.cardBtn, s.studentBtn]}><Text style={s.cardBtnText}>Get Started →</Text></View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)} style={s.loginRow}>
        <Text style={s.loginText}>Already have an account? </Text>
        <Text style={s.loginLink}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 24 },
  header: { alignItems: 'center' },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#4F81BD', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  brand: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
  sub: { fontSize: 14, color: '#8899BB', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  cards: { width: '100%', gap: 16 },
  card: { borderRadius: 20, padding: 24, width: '100%' },
  teacherCard: { backgroundColor: '#1E3A5F' },
  studentCard: { backgroundColor: '#1B3A2A' },
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#AABBCC', lineHeight: 20, marginBottom: 16 },
  cardBtn: { backgroundColor: '#4F81BD', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-start' },
  studentBtn: { backgroundColor: '#2E7D32' },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  loginRow: { flexDirection: 'row', alignItems: 'center' },
  loginText: { color: '#8899BB', fontSize: 14 },
  loginLink: { color: '#4F81BD', fontSize: 14, fontWeight: '700' },
});

export default LandingScreen;
