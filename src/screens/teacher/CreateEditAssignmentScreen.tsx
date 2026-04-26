import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

const CreateEditAssignmentScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { assignmentId } = route.params ?? {};
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [acceptsFile, setAcceptsFile] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const { data: batches = [] } = useQuery({
    queryKey: ['teacher_batches_simple', user?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('batches').select('id, name').eq('teacher_id', user!.id).eq('status', 'ACTIVE') as any) as { data: any[] };
      if (data?.length && !selectedBatchId) setSelectedBatchId(data[0].id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleSave = async () => {
    if (!title.trim() || !deadline || !selectedBatchId) { Alert.alert('Error', 'Title, deadline and batch are required'); return; }
    setSaving(true);
    try {
      const payload = {
        teacher_id: user!.id, batch_id: selectedBatchId, title: title.trim(),
        description: description.trim() || null, deadline: new Date(deadline).toISOString(),
        max_marks: parseInt(maxMarks) || 100, accepts_file_upload: acceptsFile,
      };
      if (assignmentId) {
        await (supabase.from('assignments') as any).update(payload).eq('id', assignmentId);
      } else {
        await (supabase.from('assignments') as any).insert(payload);
      }
      qc.invalidateQueries({ queryKey: ['teacher_assignments'] });
      nav.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => nav.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.heading}>{assignmentId ? 'Edit Assignment' : 'Create Assignment'}</Text>

      <Text style={s.label}>Batch *</Text>
      <View style={s.chips}>
        {batches.map((b: any) => (
          <TouchableOpacity key={b.id} style={[s.chip, selectedBatchId === b.id && s.chipActive]} onPress={() => setSelectedBatchId(b.id)}>
            <Text style={[s.chipText, selectedBatchId === b.id && s.chipTextActive]}>{b.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Title *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Chapter 5 Practice Set" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Description</Text>
      <TextInput style={[s.input, { height: 90 }]} value={description} onChangeText={setDescription} placeholder="Assignment instructions..." placeholderTextColor="#4B5563" multiline textAlignVertical="top" />

      <Text style={s.label}>Deadline (YYYY-MM-DD HH:MM) *</Text>
      <TextInput style={s.input} value={deadline} onChangeText={setDeadline} placeholder="2026-05-01 23:59" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Max Marks</Text>
      <TextInput style={s.input} value={maxMarks} onChangeText={setMaxMarks} keyboardType="numeric" placeholderTextColor="#4B5563" />

      <TouchableOpacity style={s.toggleRow} onPress={() => setAcceptsFile(v => !v)}>
        <Text style={s.toggleLabel}>Accept File Upload</Text>
        <View style={[s.toggle, acceptsFile && s.toggleOn]}><View style={[s.toggleThumb, acceptsFile && s.toggleThumbOn]} /></View>
      </TouchableOpacity>

      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{assignmentId ? 'Update' : 'Create Assignment'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 20 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 6, marginTop: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 13, color: '#F9FAFB', fontSize: 14, marginBottom: 4, borderWidth: 1, borderColor: '#374151' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937', borderWidth: 1.5, borderColor: '#374151' },
  chipActive: { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' },
  chipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  chipTextActive: { color: '#3B82F6' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginTop: 10 },
  toggleLabel: { fontSize: 15, color: '#F9FAFB', fontWeight: '500' },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#374151', justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: '#3B82F6' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default CreateEditAssignmentScreen;
