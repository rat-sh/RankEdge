import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const EXAM_CATEGORIES = ['JEE Mains', 'JEE Advanced', 'NEET', 'Aptitude', 'Placement', 'Custom'];
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Aptitude', 'DSA', 'Other'];

const AddEditBatchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const batchId = route.params?.batchId as string | undefined;
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', exam_category: '', schedule: '', max_students: '100', fee_amount: '' });

  useEffect(() => {
    if (batchId) {
      supabase.from('batches').select('*').eq('id', batchId).single().then(({ data }) => {
        if (data) setForm({ name: data.name, subject: data.subject, exam_category: data.exam_category, schedule: data.schedule ?? '', max_students: String(data.max_students ?? 100), fee_amount: String(data.fee_amount ?? '') });
      });
    }
  }, [batchId]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.exam_category) { Alert.alert('Error', 'Name, subject and exam category are required'); return; }
    setLoading(true);
    try {
      const payload = { name: form.name.trim(), subject: form.subject, exam_category: form.exam_category, schedule: form.schedule || null, max_students: parseInt(form.max_students) || 100, fee_amount: form.fee_amount ? parseFloat(form.fee_amount) : null, teacher_id: user!.id };
      if (batchId) {
        await supabase.from('batches').update(payload).eq('id', batchId);
      } else {
        await supabase.from('batches').insert(payload);
      }
      qc.invalidateQueries({ queryKey: ['teacher_batches'] });
      qc.invalidateQueries({ queryKey: ['batch_detail', batchId] });
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>{batchId ? 'Edit Batch' : 'Create Batch'}</Text>

      <Text style={s.label}>Batch Name *</Text>
      <TextInput style={s.input} value={form.name} onChangeText={v => set('name', v)} placeholder="e.g. JEE 2025 Batch A" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Subject *</Text>
      <View style={s.chips}>
        {SUBJECTS.map(sub => (
          <TouchableOpacity key={sub} style={[s.chip, form.subject === sub && s.chipActive]} onPress={() => set('subject', sub)}>
            <Text style={[s.chipText, form.subject === sub && s.chipTextActive]}>{sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Exam Category *</Text>
      <View style={s.chips}>
        {EXAM_CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[s.chip, form.exam_category === cat && s.chipActive]} onPress={() => set('exam_category', cat)}>
            <Text style={[s.chipText, form.exam_category === cat && s.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Schedule (optional)</Text>
      <TextInput style={s.input} value={form.schedule} onChangeText={v => set('schedule', v)} placeholder="e.g. Mon/Wed/Fri 6PM" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Max Students</Text>
      <TextInput style={s.input} value={form.max_students} onChangeText={v => set('max_students', v)} keyboardType="numeric" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Monthly Fee (₹, optional)</Text>
      <TextInput style={s.input} value={form.fee_amount} onChangeText={v => set('fee_amount', v)} keyboardType="decimal-pad" placeholder="e.g. 1500" placeholderTextColor="#4B5563" />

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{batchId ? 'Save Changes' : 'Create Batch'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 48 },
  back: { marginBottom: 20 },
  backText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB', marginBottom: 24 },
  label: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, color: '#F9FAFB', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#374151' },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  btn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default AddEditBatchScreen;
