import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const StudentExamResultScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { examId, studentId } = route.params as { examId: string; studentId: string };

  const { data, isLoading } = useQuery({
    queryKey: ['student_exam_result_detail', examId, studentId],
    queryFn: async () => {
      const [attemptRes, examRes, studentRes] = await Promise.all([
        supabase.from('exam_attempts').select('*').eq('exam_id', examId).eq('student_id', studentId).single() as any,
        supabase.from('exams').select('title, duration_minutes').eq('id', examId).single() as any,
        supabase.from('users').select('name').eq('id', studentId).single() as any,
      ]);
      return { attempt: attemptRes.data as any, exam: examRes.data as any, student: studentRes.data as any };
    },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>{data?.student?.name ?? 'Student'} — Result</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.examTitle}>{data?.exam?.title}</Text>
          <View style={s.scoreCard}>
            <Text style={s.score}>{data?.attempt?.score ?? 0}</Text>
            <Text style={s.scoreLabel}>Total Score</Text>
          </View>
          <View style={s.statsGrid}>
            {[
              { label: 'Correct', value: data?.attempt?.correct_count ?? 0, color: '#10B981' },
              { label: 'Incorrect', value: data?.attempt?.incorrect_count ?? 0, color: '#EF4444' },
              { label: 'Skipped', value: data?.attempt?.unattempted_count ?? 0, color: '#6B7280' },
              { label: 'Rank', value: data?.attempt?.rank ? `#${data.attempt.rank}` : '—', color: '#F59E0B' },
            ].map(st => (
              <View key={st.label} style={s.statCard}>
                <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
          {data?.attempt?.time_taken_seconds != null && (
            <Text style={s.timeTaken}>
              Time taken: {Math.floor(data.attempt.time_taken_seconds / 60)}m {data.attempt.time_taken_seconds % 60}s
            </Text>
          )}
          <Text style={s.submitted}>
            Submitted: {data?.attempt?.submitted_at ? new Date(data.attempt.submitted_at).toLocaleString('en-IN') : '—'}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  examTitle: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  scoreCard: { backgroundColor: '#1E3A5F', borderRadius: 20, padding: 32, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#3B82F6' },
  score: { fontSize: 56, fontWeight: '900', color: '#3B82F6', marginBottom: 8 },
  scoreLabel: { fontSize: 14, color: '#93C5FD', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#1F2937', borderRadius: 14, padding: 16, alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  timeTaken: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 8 },
  submitted: { fontSize: 13, color: '#4B5563', textAlign: 'center' },
});

export default StudentExamResultScreen;
