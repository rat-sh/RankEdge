import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const JoinBatchScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const handleSearch = async () => {
    if (code.trim().length < 6) { Alert.alert('Error', 'Enter a valid join code'); return; }
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('batches').select('id, name, subject, exam_category, student_ids, teacher_id').eq('join_code', code.trim().toUpperCase()).eq('status', 'ACTIVE').single() as any) as { data: any; error: any };
      if (error || !data) { Alert.alert('Not Found', 'No active batch with this code'); setPreview(null); return; }
      setPreview(data);
    } catch { Alert.alert('Error', 'Could not find batch'); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await (supabase as any).rpc('add_student_to_batch', { p_batch_id: preview.id, p_student_id: user!.id });
      qc.invalidateQueries({ queryKey: ['my_teachers'] });
      qc.invalidateQueries({ queryKey: ['student_home'] });
      Alert.alert('Joined!', `You've joined ${preview.name}`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>

      <Text style={s.title}>Join a Batch</Text>
      <Text style={s.subtitle}>Enter the 8-character code from your teacher</Text>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={code}
          onChangeText={v => { setCode(v.toUpperCase()); setPreview(null); }}
          placeholder="e.g. MATH1234"
          placeholderTextColor="#4B5563"
          autoCapitalize="characters"
          maxLength={8}
        />
        <TouchableOpacity style={s.searchBtn} onPress={handleSearch} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.searchBtnText}>Find</Text>}
        </TouchableOpacity>
      </View>

      {preview && (
        <View style={s.previewCard}>
          <Text style={s.previewSubject}>{preview.subject} · {preview.exam_category}</Text>
          <Text style={s.previewName}>{preview.name}</Text>
          <Text style={s.previewStudents}>{preview.student_ids?.length ?? 0} students enrolled</Text>
          <TouchableOpacity style={s.joinBtn} onPress={handleJoin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.joinBtnText}>Join Batch →</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 24, paddingTop: 56 },
  back: { marginBottom: 32 },
  backText: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#F9FAFB', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  input: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 14, color: '#F9FAFB', fontSize: 18, fontWeight: '700', letterSpacing: 2, borderWidth: 1, borderColor: '#374151' },
  searchBtn: { backgroundColor: '#10B981', paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  previewCard: { backgroundColor: '#1F2937', borderRadius: 20, padding: 24 },
  previewSubject: { fontSize: 12, color: '#10B981', fontWeight: '700', marginBottom: 6 },
  previewName: { fontSize: 20, fontWeight: '800', color: '#F9FAFB', marginBottom: 6 },
  previewStudents: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  joinBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default JoinBatchScreen;
