import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Other'];

const ScheduleLiveClassScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('Zoom');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
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
    if (!title.trim() || !meetingLink.trim() || !scheduledAt || !selectedBatchId) {
      Alert.alert('Error', 'Title, meeting link, time, and batch are required'); return;
    }
    setSaving(true);
    try {
      await (supabase.from('live_classes') as any).insert({
        teacher_id: user!.id, batch_id: selectedBatchId, title: title.trim(),
        platform, meeting_link: meetingLink.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(duration) || 60,
        status: 'SCHEDULED',
      });
      qc.invalidateQueries({ queryKey: ['teacher_live_classes'] });
      qc.invalidateQueries({ queryKey: ['student_live_classes'] });
      nav.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => nav.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.heading}>Schedule Live Class</Text>

      <Text style={s.label}>Batch *</Text>
      <View style={s.chips}>
        {batches.map((b: any) => (
          <TouchableOpacity key={b.id} style={[s.chip, selectedBatchId === b.id && s.chipActive]} onPress={() => setSelectedBatchId(b.id)}>
            <Text style={[s.chipText, selectedBatchId === b.id && s.chipTextActive]}>{b.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Title *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Doubts Session — Kinematics" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Platform</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PLATFORMS.map(p => (
            <TouchableOpacity key={p} style={[s.chip, platform === p && s.chipActive]} onPress={() => setPlatform(p)}>
              <Text style={[s.chipText, platform === p && s.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={s.label}>Meeting Link *</Text>
      <TextInput style={s.input} value={meetingLink} onChangeText={setMeetingLink} placeholder="Paste Zoom/Meet link..." placeholderTextColor="#4B5563" autoCapitalize="none" />

      <Text style={s.label}>Date & Time (YYYY-MM-DD HH:MM) *</Text>
      <TextInput style={s.input} value={scheduledAt} onChangeText={setScheduledAt} placeholder="2026-05-10 18:00" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Duration (minutes)</Text>
      <TextInput style={s.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor="#4B5563" />

      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Schedule Class</Text>}
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
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default ScheduleLiveClassScreen;
