import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Sub = { id: string; student_id: string; text_content: string | null; submitted_at: string; is_late: boolean; status: string; grade: number | null; feedback: string | null; users: { name: string } | null };

const AssignmentSubmissionsScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { assignmentId } = route.params as { assignmentId: string };
  const qc = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: async () => {
      const [asgRes, subRes] = await Promise.all([
        supabase.from('assignments').select('title, max_marks').eq('id', assignmentId).single() as any,
        supabase.from('submissions').select('id, student_id, text_content, submitted_at, is_late, status, grade, feedback, users(name)').eq('assignment_id', assignmentId).order('submitted_at') as any,
      ]);
      return { assignment: asgRes.data as any, subs: (subRes.data ?? []) as Sub[] };
    },
  });

  const handleGrade = async (subId: string) => {
    if (!grade) { Alert.alert('Error', 'Enter a grade'); return; }
    setSaving(true);
    try {
      await (supabase.from('submissions') as any).update({ grade: parseFloat(grade), feedback: feedback.trim() || null, status: 'GRADED', graded_at: new Date().toISOString() }).eq('id', subId);
      qc.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      setGradingId(null); setGrade(''); setFeedback('');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.heading} numberOfLines={1}>{data?.assignment?.title ?? 'Submissions'}</Text>
          <Text style={s.sub}>{data?.subs?.length ?? 0} submitted · Max: {data?.assignment?.max_marks ?? '–'} marks</Text>
        </View>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={data?.subs}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No submissions yet</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.name}>{(item.users as any)?.name ?? 'Student'}</Text>
                {item.is_late && <Text style={s.latePill}>LATE</Text>}
                <View style={[s.statusPill, { backgroundColor: item.status === 'GRADED' ? '#064E3B' : '#1F2937' }]}>
                  <Text style={[s.statusText, { color: item.status === 'GRADED' ? '#10B981' : '#6B7280' }]}>{item.status}</Text>
                </View>
              </View>
              {item.text_content && <Text style={s.content} numberOfLines={3}>{item.text_content}</Text>}
              <Text style={s.date}>{new Date(item.submitted_at).toLocaleString('en-IN')}</Text>
              {item.grade != null && <Text style={s.gradeShow}>Grade: {item.grade} · {item.feedback}</Text>}
              {gradingId === item.id ? (
                <View style={s.gradeBox}>
                  <TextInput style={s.gradeInput} value={grade} onChangeText={setGrade} keyboardType="decimal-pad" placeholder="Grade" placeholderTextColor="#4B5563" />
                  <TextInput style={[s.gradeInput, { flex: 2 }]} value={feedback} onChangeText={setFeedback} placeholder="Feedback (optional)" placeholderTextColor="#4B5563" />
                  <TouchableOpacity style={s.saveGradeBtn} onPress={() => handleGrade(item.id)} disabled={saving}>
                    <Text style={s.saveGradeText}>{saving ? '...' : 'Save'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setGradingId(null)}><Text style={s.cancelGrade}>✕</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.gradeBtn} onPress={() => { setGradingId(item.id); setGrade(String(item.grade ?? '')); setFeedback(item.feedback ?? ''); }}>
                  <Text style={s.gradeBtnText}>{item.status === 'GRADED' ? 'Edit Grade' : 'Grade'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 12 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: '#F9FAFB' },
  latePill: { fontSize: 10, color: '#F59E0B', fontWeight: '800', backgroundColor: '#78350F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  content: { fontSize: 13, color: '#9CA3AF', marginBottom: 6, lineHeight: 18 },
  date: { fontSize: 11, color: '#4B5563', marginBottom: 8 },
  gradeShow: { fontSize: 12, color: '#10B981', fontWeight: '600', marginBottom: 8 },
  gradeBox: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  gradeInput: { flex: 1, backgroundColor: '#111827', borderRadius: 8, padding: 8, color: '#F9FAFB', fontSize: 13, borderWidth: 1, borderColor: '#374151' },
  saveGradeBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveGradeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelGrade: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  gradeBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  gradeBtnText: { color: '#3B82F6', fontSize: 12, fontWeight: '700' },
});

export default AssignmentSubmissionsScreen;
