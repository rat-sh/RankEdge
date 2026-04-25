import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { loginWithPin } from '@/services/auth';
import { supabase } from '@/lib/supabase/client';
import { ROUTES, MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES } from '@/constants';

const PIN_LENGTH = 5;

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { setUser, incrementFailedAttempts, lockAccount, failedAttempts, lockedUntil } = useAuthStore();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const isLocked = lockedUntil && Date.now() < lockedUntil;
  const lockMinsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 60000) : 0;

  const handleLogin = async () => {
    if (!email.trim() || pin.length !== PIN_LENGTH) {
      Alert.alert('Error', 'Enter email and 5-digit PIN');
      return;
    }
    if (isLocked) {
      Alert.alert('Account Locked', `Try again in ${lockMinsLeft} minute(s)`);
      return;
    }
    setLoading(true);
    try {
      const data = await loginWithPin(email.trim().toLowerCase(), pin);
      const { data: profile } = await (supabase.from('users').select('*').eq('id', data.user!.id).single() as any) as { data: { id: string; name: string; email: string; role: 'TEACHER' | 'STUDENT'; avatar_url: string | null; batch_ids: string[] } | null };
      if (!profile) throw new Error('Profile not found');
      setUser({ id: profile.id, name: profile.name, email: profile.email, role: profile.role, avatarUrl: profile.avatar_url ?? undefined, batchIds: profile.batch_ids });
      navigation.replace(profile.role === 'TEACHER' ? ROUTES.TEACHER_ROOT : ROUTES.STUDENT_ROOT);
    } catch (e: any) {
      incrementFailedAttempts();
      if (failedAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        lockAccount(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        Alert.alert('Account Locked', `Too many attempts. Locked for ${LOCKOUT_MINUTES} minutes.`);
      } else {
        Alert.alert('Login Failed', `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - failedAttempts - 1} attempt(s) left.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < PIN_LENGTH) setPin(p => p + digit);
  };
  const handleBackspace = () => setPin(p => p.slice(0, -1));

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.title}>Welcome Back</Text>
      <Text style={s.subtitle}>Login to your RankEdge account</Text>

      {isLocked && (
        <View style={s.lockBanner}>
          <Text style={s.lockText}>🔒 Account locked for {lockMinsLeft} min(s)</Text>
        </View>
      )}

      <TextInput
        style={s.input} placeholder="Email address" placeholderTextColor="#556"
        value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none"
      />

      <Text style={s.pinLabel}>Enter your 5-digit PIN</Text>
      <View style={s.pinDots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[s.dot, pin.length > i && s.dotFilled]} />
        ))}
      </View>

      <View style={s.numpad}>
        {keys.map((k, i) => (
          k === '' ? <View key={i} style={s.keyEmpty} /> :
          <TouchableOpacity key={i} style={s.key} onPress={() => k === '⌫' ? handleBackspace() : handlePinPress(k)} activeOpacity={0.7}>
            <Text style={s.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Log In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate(ROUTES.FORGOT_PIN_EMAIL)} style={s.forgotRow}>
        <Text style={s.forgotText}>Forgot PIN?</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A2E', paddingHorizontal: 28, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { color: '#4F81BD', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8899BB', marginBottom: 28 },
  lockBanner: { backgroundColor: '#C62828', borderRadius: 10, padding: 12, marginBottom: 16 },
  lockText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  input: { backgroundColor: '#22304A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, marginBottom: 24 },
  pinLabel: { color: '#8899BB', fontSize: 13, marginBottom: 14, textAlign: 'center' },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 28 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#4F81BD', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#4F81BD' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 28 },
  key: { width: 72, height: 56, borderRadius: 12, backgroundColor: '#22304A', alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { width: 72, height: 56 },
  keyText: { fontSize: 22, color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: '#4F81BD', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  forgotRow: { alignItems: 'center' },
  forgotText: { color: '#4F81BD', fontSize: 14, fontWeight: '600' },
});

export default LoginScreen;
