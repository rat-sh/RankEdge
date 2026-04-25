import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { hashPin } from '@/services/auth';
import { ROUTES, PIN_LENGTH } from '@/constants';

const EXAM_CATEGORIES = ['JEE Mains', 'JEE Advanced', 'NEET', 'Aptitude', 'Placement', 'Custom'];

const SignUpStudentScreen = () => {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', pin: '', confirmPin: '' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSignUp = async () => {
    if (!form.name || !form.email || !form.pin) { Alert.alert('Error', 'Name, email and PIN are required'); return; }
    if (form.pin.length !== PIN_LENGTH) { Alert.alert('Error', 'PIN must be 5 digits'); return; }
    if (form.pin !== form.confirmPin) { Alert.alert('Error', 'PINs do not match'); return; }

    setLoading(true);
    try {
      const pinHash = hashPin(form.pin);
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: `${pinHash}_rke_v1`,
      });
      if (error) throw error;
      await supabase.from('users').insert({
        id: data.user!.id, name: form.name.trim(), email: form.email.trim().toLowerCase(),
        phone: form.phone || null, role: 'STUDENT', pin_hash: pinHash,
        subject_list: selectedCategory ? [selectedCategory] : [], city: form.city || null,
      });
      Alert.alert('Success', 'Account created! Please log in.', [{ text: 'OK', onPress: () => navigation.replace(ROUTES.LOGIN) }]);
    } catch (e: any) {
      Alert.alert('Sign Up Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>

      <Text style={s.title}>Create Student Account</Text>
      <Text style={s.subtitle}>Start your exam preparation journey</Text>

      {[
        { key: 'name', placeholder: 'Full Name *', keyboard: 'default' },
        { key: 'email', placeholder: 'Email Address *', keyboard: 'email-address' },
        { key: 'phone', placeholder: 'Phone Number (optional)', keyboard: 'phone-pad' },
        { key: 'city', placeholder: 'City (optional)', keyboard: 'default' },
      ].map(f => (
        <TextInput key={f.key} style={s.input} placeholder={f.placeholder} placeholderTextColor="#556"
          value={(form as any)[f.key]} onChangeText={v => set(f.key, v)}
          keyboardType={f.keyboard as any} autoCapitalize={f.key === 'email' ? 'none' : 'words'}
        />
      ))}

      <Text style={s.sectionLabel}>Exam Category (optional)</Text>
      <View style={s.chips}>
        {EXAM_CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[s.chip, selectedCategory === cat && s.chipSelected]} onPress={() => setSelectedCategory(cat)}>
            <Text style={[s.chipText, selectedCategory === cat && s.chipTextSelected]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionLabel}>Set 5-Digit PIN *</Text>
      <TextInput style={s.input} placeholder="5-digit PIN" placeholderTextColor="#556"
        value={form.pin} onChangeText={v => set('pin', v.replace(/\D/g, '').slice(0, 5))}
        keyboardType="numeric" secureTextEntry maxLength={5}
      />
      <TextInput style={s.input} placeholder="Confirm PIN" placeholderTextColor="#556"
        value={form.confirmPin} onChangeText={v => set('confirmPin', v.replace(/\D/g, '').slice(0, 5))}
        keyboardType="numeric" secureTextEntry maxLength={5}
      />

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)} style={s.loginRow}>
        <Text style={s.loginText}>Already have an account? </Text>
        <Text style={s.loginLink}>Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A2E' },
  content: { padding: 28, paddingTop: 60, paddingBottom: 48 },
  back: { marginBottom: 24 },
  backText: { color: '#2E7D32', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8899BB', marginBottom: 28 },
  input: { backgroundColor: '#1B3A2A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, marginBottom: 14 },
  sectionLabel: { color: '#8899BB', fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#334433' },
  chipSelected: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { color: '#8899BB', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  btn: { backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#8899BB', fontSize: 14 },
  loginLink: { color: '#2E7D32', fontSize: 14, fontWeight: '700' },
});

export default SignUpStudentScreen;
