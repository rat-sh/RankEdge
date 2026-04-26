import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const FILE_TYPES = ['PDF', 'DOCX', 'Image'];

const UploadNoteScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [isPinned, setIsPinned] = useState(false);
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
    if (!title.trim() || !subject.trim() || !chapter.trim()) { Alert.alert('Error', 'Title, subject, chapter required'); return; }
    setSaving(true);
    try {
      await (supabase.from('notes') as any).insert({
        teacher_id: user!.id, batch_id: selectedBatchId || null,
        title: title.trim(), file_url: fileUrl.trim() || 'pending',
        file_type: fileType.toLowerCase(), subject: subject.trim(),
        chapter: chapter.trim(), topic: topic.trim() || null,
        is_pinned: isPinned, visible_to_all: !selectedBatchId,
      });
      qc.invalidateQueries({ queryKey: ['teacher_notes'] });
      qc.invalidateQueries({ queryKey: ['student_notes'] });
      nav.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => nav.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.heading}>Upload Note</Text>

      <Text style={s.label}>Batch (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[s.chip, !selectedBatchId && s.chipActive]} onPress={() => setSelectedBatchId('')}>
            <Text style={[s.chipText, !selectedBatchId && s.chipTextActive]}>All Students</Text>
          </TouchableOpacity>
          {batches.map((b: any) => (
            <TouchableOpacity key={b.id} style={[s.chip, selectedBatchId === b.id && s.chipActive]} onPress={() => setSelectedBatchId(b.id)}>
              <Text style={[s.chipText, selectedBatchId === b.id && s.chipTextActive]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={s.label}>Title *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Chapter 3 Summary" placeholderTextColor="#4B5563" />

      <Text style={s.label}>File URL / Link</Text>
      <TextInput style={s.input} value={fileUrl} onChangeText={setFileUrl} placeholder="Paste Google Drive / PDF URL..." placeholderTextColor="#4B5563" autoCapitalize="none" />

      <Text style={s.label}>File Type</Text>
      <View style={s.chips}>
        {FILE_TYPES.map(t => (
          <TouchableOpacity key={t} style={[s.chip, fileType === t && s.chipActive]} onPress={() => setFileType(t)}>
            <Text style={[s.chipText, fileType === t && s.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Subject *</Text>
      <TextInput style={s.input} value={subject} onChangeText={setSubject} placeholder="e.g. Physics" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Chapter *</Text>
      <TextInput style={s.input} value={chapter} onChangeText={setChapter} placeholder="e.g. Laws of Motion" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Topic</Text>
      <TextInput style={s.input} value={topic} onChangeText={setTopic} placeholder="e.g. Newton's 3rd Law" placeholderTextColor="#4B5563" />

      <TouchableOpacity style={s.toggleRow} onPress={() => setIsPinned(v => !v)}>
        <Text style={s.toggleLabel}>Pin to top</Text>
        <View style={[s.toggle, isPinned && s.toggleOn]}><View style={[s.toggleThumb, isPinned && s.toggleThumbOn]} /></View>
      </TouchableOpacity>

      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Upload Note</Text>}
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

export default UploadNoteScreen;
