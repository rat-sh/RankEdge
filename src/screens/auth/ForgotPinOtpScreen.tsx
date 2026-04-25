import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';

const ForgotPinOtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = String(route.params?.email ?? '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<any[]>([]);

  const handleChange = (val: string, i: number) => {
    const next = [...otp];
    next[i] = val.replace(/\D/g, '').slice(0, 1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Error', 'Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
      if (error) throw error;
      navigation.navigate(ROUTES.FORGOT_PIN_NEW);
    } catch (e: any) {
      Alert.alert('Invalid Code', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={s.title}>Check your email</Text>
      <Text style={s.subtitle}>We sent a 6-digit code to{'\n'}<Text style={s.email}>{email}</Text></Text>

      <View style={s.otpRow}>
        {otp.map((val, i) => (
          <TextInput
            key={i} ref={r => { refs.current[i] = r; }}
            style={s.otpBox} value={val}
            onChangeText={v => handleChange(v, i)}
            keyboardType="numeric" maxLength={1} textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleVerify} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify Code</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.resendRow} onPress={() => supabase.auth.resetPasswordForEmail(email)}>
        <Text style={s.resendText}>Didn't receive it? </Text>
        <Text style={s.resendLink}>Resend</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 28, paddingTop: 56 },
  back: { marginBottom: 32 },
  backText: { color: '#6B7280', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 36 },
  email: { color: '#9CA3AF', fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 32, justifyContent: 'center' },
  otpBox: { width: 46, height: 54, backgroundColor: '#1F2937', borderRadius: 10, borderWidth: 1, borderColor: '#374151', color: '#F9FAFB', fontSize: 22, fontWeight: '700' },
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 20 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center' },
  resendText: { color: '#6B7280', fontSize: 14 },
  resendLink: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
});

export default ForgotPinOtpScreen;
