import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/constants';

type AttemptRow = {
  id: string;
  student_id: string;
  score: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  time_taken_seconds: number | null;
  rank: number | null;
  submitted_at: string;
  users: { name: string; email: string } | null;
};

const ExamResultsOverviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { examId } = route.params as { examId: string };
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['exam_results_overview', examId],
    queryFn: async () => {
      const [examRes, attemptsRes] = await Promise.all([
        supabase.from('exams').select('title, is_results_released, duration_minutes').eq('id', examId).single() as any,
        supabase
          .from('exam_attempts')
          .select('id, student_id, score, correct_count, incorrect_count, unattempted_count, time_taken_seconds, rank, submitted_at, users(name, email)')
          .eq('exam_id', examId)
          .order('score', { ascending: false }) as any,
      ]);
      const exam = examRes.data as { title: string; is_results_released: boolean; duration_minutes: number } | null;
      const rows = ((attemptsRes.data ?? []) as unknown) as AttemptRow[];
      const avg = rows.length ? Math.round(rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length) : 0;
      const topScore = rows[0]?.score ?? 0;
      return { exam, attempts: rows, avg, topScore };
    },
    enabled: !!user,
  });

  const handleReleaseResults = async () => {
    Alert.alert('Release Results?', 'Students will be able to see their scores.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release',
        onPress: async () => {
          try {
            await (supabase.from('exams') as any).update({ is_results_released: true }).eq('id', examId);
            qc.invalidateQueries({ queryKey: ['exam_results_overview', examId] });
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (isLoading) return (
    <View style={s.center}><ActivityIndicator color="#3B82F6" size="large" /></View>
  );

  const { exam, attempts = [], avg, topScore } = data ?? {};

  const renderAttempt = ({ item, index }: { item: AttemptRow; index: number }) => {
    const pct = topScore ? Math.round((item.score / topScore) * 100) : 0;
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
    return (
      <TouchableOpacity
        style={s.row}
        onPress={() => navigation.navigate(ROUTES.STUDENT_EXAM_RESULT, { examId, studentId: item.student_id })}
      >
        <Text style={s.rank}>{medal ?? `#${index + 1}`}</Text>
        <View style={s.rowInfo}>
          <Text style={s.studentName}>{item.users?.name ?? 'Unknown'}</Text>
          <Text style={s.studentEmail}>{item.users?.email ?? ''}</Text>
        </View>
        <View style={s.scoreCol}>
          <Text style={[s.score, { color: pct >= 60 ? '#10B981' : '#EF4444' }]}>{item.score}</Text>
          <Text style={s.scoreSub}>{item.correct_count}✓ {item.incorrect_count}✗</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={s.heading} numberOfLines={1}>{exam?.title ?? 'Exam Results'}</Text>
          <Text style={s.subheading}>{attempts.length} submissions</Text>
        </View>
        {!exam?.is_results_released && (
          <TouchableOpacity style={s.releaseBtn} onPress={handleReleaseResults}>
            <Text style={s.releaseBtnText}>Release</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{attempts.length}</Text>
          <Text style={s.summaryLabel}>Submitted</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, { color: '#3B82F6' }]}>{avg}</Text>
          <Text style={s.summaryLabel}>Avg Score</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, { color: '#F59E0B' }]}>{topScore}</Text>
          <Text style={s.summaryLabel}>Top Score</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, { color: exam?.is_results_released ? '#10B981' : '#6B7280' }]}>
            {exam?.is_results_released ? '✓' : '–'}
          </Text>
          <Text style={s.summaryLabel}>Released</Text>
        </View>
      </View>

      <FlatList
        data={attempts}
        keyExtractor={i => i.id}
        renderItem={renderAttempt}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>No submissions yet</Text>}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#F9FAFB', fontSize: 18, fontWeight: '700' },
  headerText: { flex: 1 },
  heading: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  subheading: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  releaseBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  releaseBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#10B981', marginBottom: 2 },
  summaryLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 6 },
  empty: { color: '#4B5563', textAlign: 'center', marginTop: 60, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, gap: 12 },
  rank: { fontSize: 16, fontWeight: '800', color: '#9CA3AF', width: 30, textAlign: 'center' },
  rowInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  studentEmail: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  scoreCol: { alignItems: 'flex-end' },
  score: { fontSize: 20, fontWeight: '800' },
  scoreSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
});

export default ExamResultsOverviewScreen;
