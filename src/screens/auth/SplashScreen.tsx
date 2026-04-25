import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { ROUTES } from '@/constants';

const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        navigation.replace(user.role === 'TEACHER' ? ROUTES.TEACHER_ROOT : ROUTES.STUDENT_ROOT);
      } else {
        navigation.replace(ROUTES.LANDING);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <View style={s.logoBox}>
        <Text style={s.logo}>R</Text>
      </View>
      <Text style={s.brand}>RankEdge</Text>
      <Text style={s.tagline}>Teach. Learn. Rank.</Text>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  logoBox: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: '#4F81BD', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, shadowColor: '#4F81BD', shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  logo: { fontSize: 48, fontWeight: '900', color: '#fff' },
  brand: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  tagline: { fontSize: 14, color: '#8899BB', marginTop: 8, letterSpacing: 1 },
});

export default SplashScreen;
