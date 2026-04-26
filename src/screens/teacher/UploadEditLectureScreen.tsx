import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const UploadEditLectureScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { lectureId } = route.params ?? {};
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!lectureId);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isExternal, setIsExternal] = useState(true);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [batchId, setBatchId] = useState('');
  const [examCategory, setExamCategory] = useState('');

  useEffect(() => {
    if (!lectureId) return;
    (async () => {
      const { data } = await (supabase.from('lectures').select('*').eq('id', lectureId).single() as any) as { data: any };
      if (data) { setTitle(data.title); setVideoUrl(data.video_url); setIsExternal(data.is_external); setSubject(data.subject); setChapter(data.chapter); setTopic(data.topic ?? ''); setBatchId(data.batch_id ?? ''); setExamCategory(data.exam_category ?? ''); }
      setLoading(false);
    })();
  }, [lectureId]);

  const handleSave = async () => {
    if (!title.trim() || !videoUrl.trim() || !subject.trim() || !chapter.trim() || !batchId) {
      Alert.alert('Error', 'Title, video URL, subject, chapter, and batch are required'); return;
    }
    setSaving(true);
    try {
      const payload = { teacher_id: user!.id, batch_id: batchId, title: title.trim(), video_url: videoUrl.trim(), is_external: isExternal, subject: subject.trim(), chapter: chapter.trim(), topic: topic.trim() || null, exam_category: examCategory.trim() || null };
      if (lectureId) {
        await (supabase.from('lectures') as any).update(payload).eq('id', lectureId);
      } else {
        await (supabase.from('lectures') as any).insert(payload);
      }
      qc.invalidateQueries({ queryKey: ['teacher_lectures'] });
      qc.invalidateQueries({ queryKey: ['student_lectures'] });
      nav.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#3B82F6" size="large" /></View>;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => nav.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.heading}>{lectureId ? 'Edit Lecture' : 'Upload Lecture'}</Text>

      <Text style={s.label}>Title *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Lecture 5 — Newton's Laws" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Video URL *</Text>
      <TextInput style={s.input} value={videoUrl} onChangeText={setVideoUrl} placeholder="YouTube / Drive / Vimeo link..." placeholderTextColor="#4B5563" autoCapitalize="none" />

      <View style={s.row2}>
        <TouchableOpacity style={[s.typeBtn, isExternal && s.typeBtnActive]} onPress={() => setIsExternal(true)}>
          <Text style={[s.typeBtnText, isExternal && s.typeBtnTextActive]}>🔗 External Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.typeBtn, !isExternal && s.typeBtnActive]} onPress={() => setIsExternal(false)}>
          <Text style={[s.typeBtnText, !isExternal && s.typeBtnTextActive]}>📁 Uploaded File</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Batch ID *</Text>
      <TextInput style={s.input} value={batchId} onChangeText={setBatchId} placeholder="Paste batch UUID" placeholderTextColor="#4B5563" autoCapitalize="none" />

      <Text style={s.label}>Subject *</Text>
      <TextInput style={s.input} value={subject} onChangeText={setSubject} placeholder="e.g. Physics" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Chapter *</Text>
      <TextInput style={s.input} value={chapter} onChangeText={setChapter} placeholder="e.g. Kinematics" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Topic</Text>
      <TextInput style={s.input} value={topic} onChangeText={setTopic} placeholder="e.g. Projectile Motion" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Exam Category</Text>
      <TextInput style={s.input} value={examCategory} onChangeText={setExamCategory} placeholder="e.g. JEE, NEET" placeholderTextColor="#4B5563" />

      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{lectureId ? 'Update Lecture' : 'Upload Lecture'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 20 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 6, marginTop: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 13, color: '#F9FAFB', fontSize: 14, marginBottom: 4, borderWidth: 1, borderColor: '#374151' },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1F2937', alignItems: 'center', borderWidth: 1.5, borderColor: '#374151' },
  typeBtnActive: { borderColor: '#3B82F6', backgroundColor: '#1E3A5F' },
  typeBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  typeBtnTextActive: { color: '#3B82F6' },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default UploadEditLectureScreen;
