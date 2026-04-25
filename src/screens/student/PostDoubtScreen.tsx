import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const PostDoubtScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({ subject: '', chapter: '', content: '' });
  const [batchId, setBatchId] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    (async () => {
      const { data: profile } = await supabase.from('users').select('batch_ids').eq('id', user!.id).single();
      const ids: string[] = (profile as any)?.batch_ids ?? [];
      if (ids.length) {
        const { data } = await supabase.from('batches').select('id, name, subject').in('id', ids);
        setBatches(data ?? []);
        if (data?.length) setBatchId(data[0].id);
      }
    })();
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handlePost = async () => {
    if (!form.subject || !form.chapter || !form.content) { Alert.alert('Error', 'All fields are required'); return; }
    if (!batchId) { Alert.alert('Error', 'Select a batch'); return; }
    setLoading(true);
    try {
      await supabase.from('doubts').insert({ batch_id: batchId, student_id: user!.id, subject: form.subject, chapter: form.chapter, content: form.content });
      qc.invalidateQueries({ queryKey: ['student_doubts'] });
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Post a Doubt</Text>

      {batches.length > 1 && (
        <>
          <Text style={s.label}>Batch</Text>
          <View style={s.chips}>
            {batches.map(b => (
              <TouchableOpacity key={b.id} style={[s.chip, batchId === b.id && s.chipActive]} onPress={() => setBatchId(b.id)}>
                <Text style={[s.chipText, batchId === b.id && s.chipTextActive]}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={s.label}>Subject *</Text>
      <TextInput style={s.input} value={form.subject} onChangeText={v => set('subject', v)} placeholder="e.g. Physics" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Chapter *</Text>
      <TextInput style={s.input} value={form.chapter} onChangeText={v => set('chapter', v)} placeholder="e.g. Laws of Motion" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Your Doubt *</Text>
      <TextInput style={[s.input, s.textArea]} value={form.content} onChangeText={v => set('content', v)} placeholder="Describe your doubt in detail..." placeholderTextColor="#4B5563" multiline numberOfLines={5} textAlignVertical="top" />

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handlePost} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Post Doubt</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 48 },
  back: { marginBottom: 20 },
  backText: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB', marginBottom: 24 },
  label: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, color: '#F9FAFB', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#374151' },
  textArea: { height: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#374151' },
  chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  btn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default PostDoubtScreen;
