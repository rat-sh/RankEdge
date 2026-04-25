import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const StudentProgressScreen = () => {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['student_progress', user?.id],
    queryFn: async () => {
      const [attemptsRes, submissionsRes, watchRes] = await Promise.all([
        supabase.from('exam_attempts').select('score, correct_count, incorrect_count, unattempted_count, time_taken_seconds, submitted_at').eq('student_id', user!.id).order('submitted_at', { ascending: false }).limit(10),
        supabase.from('submissions').select('grade, status, submitted_at').eq('student_id', user!.id).order('submitted_at', { ascending: false }).limit(10),
        supabase.from('watch_progress').select('progress_percent, updated_at').eq('student_id', user!.id),
      ]);
      const attempts = attemptsRes.data ?? [];
      const avgScore = attempts.length ? Math.round(attempts.reduce((s: number, a: any) => s + (a.score ?? 0), 0) / attempts.length) : 0;
      const avgWatch = (watchRes.data ?? []).length ? Math.round((watchRes.data ?? []).reduce((s: number, w: any) => s + (w.progress_percent ?? 0), 0) / (watchRes.data ?? []).length) : 0;
      return { attempts, submissions: submissionsRes.data ?? [], avgScore, avgWatch, totalExams: attempts.length };
    },
    enabled: !!user,
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}><Text style={s.heading}>My Progress</Text></View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.statsRow}>
            {[
              { label: 'Exams Taken', value: data?.totalExams ?? 0, color: '#3B82F6' },
              { label: 'Avg Score', value: data?.avgScore ?? 0, color: '#10B981' },
              { label: 'Watch %', value: `${data?.avgWatch ?? 0}%`, color: '#F59E0B' },
            ].map(stat => (
              <View key={stat.label} style={s.statCard}>
                <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Recent Exam Attempts</Text>
          {(data?.attempts.length ?? 0) === 0 ? (
            <Text style={s.emptyText}>No exams attempted yet</Text>
          ) : data!.attempts.map((a: any, i: number) => (
            <View key={i} style={s.attemptCard}>
              <View style={s.attemptLeft}>
                <Text style={s.attemptScore}>{a.score ?? 0}</Text>
                <Text style={s.attemptScoreLabel}>score</Text>
              </View>
              <View style={s.attemptRight}>
                <Text style={s.attemptStat}><Text style={s.green}>{a.correct_count ?? 0} correct</Text> · <Text style={s.red}>{a.incorrect_count ?? 0} wrong</Text> · {a.unattempted_count ?? 0} skipped</Text>
                <Text style={s.attemptDate}>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN') : ''}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 10 },
  emptyText: { color: '#4B5563', textAlign: 'center', marginTop: 20 },
  attemptCard: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginBottom: 8, gap: 14, alignItems: 'center' },
  attemptLeft: { alignItems: 'center', width: 56 },
  attemptScore: { fontSize: 24, fontWeight: '800', color: '#10B981' },
  attemptScoreLabel: { fontSize: 11, color: '#6B7280' },
  attemptRight: { flex: 1 },
  attemptStat: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  attemptDate: { fontSize: 11, color: '#6B7280' },
  green: { color: '#10B981', fontWeight: '700' },
  red: { color: '#EF4444', fontWeight: '700' },
});

export default StudentProgressScreen;
