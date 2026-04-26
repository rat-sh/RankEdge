import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const SubmitAssignmentScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { assignmentId } = route.params as { assignmentId: string };
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [textContent, setTextContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: assignment } = useQuery({
    queryKey: ['assignment_detail', assignmentId],
    queryFn: async () => {
      const { data } = await (supabase.from('assignments').select('title, description, deadline, max_marks, accepts_file_upload').eq('id', assignmentId).single() as any) as { data: any };
      return data;
    },
  });

  const isLate = assignment ? new Date(assignment.deadline) < new Date() : false;

  const handleSubmit = async () => {
    if (!textContent.trim() && !fileUrl.trim()) { Alert.alert('Error', 'Submit text or a file URL'); return; }
    setSaving(true);
    try {
      await (supabase.from('submissions') as any).upsert({
        assignment_id: assignmentId, student_id: user!.id,
        text_content: textContent.trim() || null,
        file_url: fileUrl.trim() || null,
        submitted_at: new Date().toISOString(),
        is_late: isLate,
        status: 'SUBMITTED',
      });
      qc.invalidateQueries({ queryKey: ['student_assignments'] });
      Alert.alert(isLate ? 'Submitted (Late)' : 'Submitted!', 'Your assignment has been submitted.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => nav.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.heading}>Submit Assignment</Text>

      {assignment && (
        <View style={s.asgCard}>
          <Text style={s.asgTitle}>{assignment.title}</Text>
          {assignment.description && <Text style={s.asgDesc}>{assignment.description}</Text>}
          <Text style={[s.asgDeadline, isLate && { color: '#EF4444' }]}>
            Deadline: {new Date(assignment.deadline).toLocaleString('en-IN')} {isLate ? '(LATE)' : ''}
          </Text>
          <Text style={s.asgMarks}>Max marks: {assignment.max_marks}</Text>
        </View>
      )}

      <Text style={s.label}>Text Answer</Text>
      <TextInput style={[s.input, { height: 140 }]} value={textContent} onChangeText={setTextContent} placeholder="Type your answer here..." placeholderTextColor="#4B5563" multiline textAlignVertical="top" />

      {assignment?.accepts_file_upload && (
        <>
          <Text style={s.label}>File URL (optional)</Text>
          <TextInput style={s.input} value={fileUrl} onChangeText={setFileUrl} placeholder="Paste Google Drive / PDF link..." placeholderTextColor="#4B5563" autoCapitalize="none" />
        </>
      )}

      {isLate && (
        <View style={s.lateWarning}>
          <Text style={s.lateWarningText}>⚠️ This submission will be marked as LATE</Text>
        </View>
      )}

      <TouchableOpacity style={[s.submitBtn, saving && { opacity: 0.6 }, isLate && { backgroundColor: '#F59E0B' }]} onPress={handleSubmit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>{isLate ? 'Submit (Late)' : 'Submit Assignment'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 16 },
  asgCard: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  asgTitle: { fontSize: 16, fontWeight: '700', color: '#F9FAFB', marginBottom: 6 },
  asgDesc: { fontSize: 13, color: '#9CA3AF', marginBottom: 6, lineHeight: 18 },
  asgDeadline: { fontSize: 12, color: '#F59E0B', marginBottom: 4 },
  asgMarks: { fontSize: 12, color: '#6B7280' },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 13, color: '#F9FAFB', fontSize: 14, borderWidth: 1, borderColor: '#374151', marginBottom: 4 },
  lateWarning: { backgroundColor: '#78350F', borderRadius: 10, padding: 12, marginTop: 10 },
  lateWarningText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default SubmitAssignmentScreen;
