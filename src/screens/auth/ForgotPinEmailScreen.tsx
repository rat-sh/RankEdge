import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';

const ForgotPinEmailScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      navigation.navigate(ROUTES.FORGOT_PIN_OTP, { email: email.trim().toLowerCase() });
    } catch (e: any) {
      Alert.alert('Error', e.message);
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

      <View style={s.body}>
        <Text style={s.title}>Reset PIN</Text>
        <Text style={s.subtitle}>Enter your registered email. We will send you a verification code.</Text>

        <Text style={s.label}>Email Address</Text>
        <TextInput
          style={s.input} placeholder="you@example.com" placeholderTextColor="#4B5563"
          value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none"
        />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSend} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send Code</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 28, paddingTop: 56 },
  back: { marginBottom: 32 },
  backText: { color: '#6B7280', fontSize: 15 },
  body: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 36 },
  label: { fontSize: 13, color: '#9CA3AF', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, color: '#F9FAFB', fontSize: 15, marginBottom: 24, borderWidth: 1, borderColor: '#374151' },
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ForgotPinEmailScreen;
