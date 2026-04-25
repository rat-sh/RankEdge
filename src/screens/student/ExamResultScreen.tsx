import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const ExamResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { examId } = route.params;
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['exam_result', examId, user?.id],
    queryFn: async () => {
      const [attemptRes, examRes] = await Promise.all([
        supabase.from('exam_attempts').select('*').eq('exam_id', examId).eq('student_id', user!.id).single() as any,
        supabase.from('exams').select('*').eq('id', examId).single() as any,
      ]);
      const attempt = attemptRes.data as { score: number; correct_count: number; incorrect_count: number; unattempted_count: number; rank: number | null; time_taken_seconds: number | null } | null;
      const exam = examRes.data as { title: string; duration_minutes: number; is_results_released: boolean } | null;
      return { attempt, exam };
    },
    enabled: !!user,
  });

  if (isLoading) return (
    <View style={s.center}><ActivityIndicator color="#10B981" size="large" /></View>
  );

  const { attempt, exam } = data ?? {};
  const percentage = exam ? Math.round(((attempt?.score ?? 0) / Math.max(exam.duration_minutes, 1)) * 100) : 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.scoreCard}>
          <Text style={s.resultTitle}>Exam Result</Text>
          <Text style={s.examTitle}>{exam?.title}</Text>
          <View style={s.scoreCircle}>
            <Text style={s.scoreValue}>{attempt?.score ?? 0}</Text>
            <Text style={s.scoreLabel}>Score</Text>
          </View>
        </View>

        <View style={s.statsGrid}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{attempt?.correct_count ?? 0}</Text>
            <Text style={s.statLabel}>Correct</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: '#EF4444' }]}>{attempt?.incorrect_count ?? 0}</Text>
            <Text style={s.statLabel}>Incorrect</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: '#6B7280' }]}>{attempt?.unattempted_count ?? 0}</Text>
            <Text style={s.statLabel}>Skipped</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: '#3B82F6' }]}>#{attempt?.rank ?? '--'}</Text>
            <Text style={s.statLabel}>Rank</Text>
          </View>
        </View>

        {attempt?.time_taken_seconds && (
          <View style={s.timeBox}>
            <Text style={s.timeLabel}>Time Taken</Text>
            <Text style={s.timeValue}>
              {Math.floor(attempt.time_taken_seconds / 60)}m {attempt.time_taken_seconds % 60}s
            </Text>
          </View>
        )}

        {!exam?.is_results_released && (
          <View style={s.pendingBox}>
            <Text style={s.pendingText}>Detailed answers will be visible once teacher releases results.</Text>
          </View>
        )}

        <TouchableOpacity style={s.doneBtn} onPress={() => navigation.popToTop()}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingTop: 60 },
  scoreCard: { backgroundColor: '#1F2937', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  examTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB', marginBottom: 24, textAlign: 'center' },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#064E3B', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#10B981' },
  scoreValue: { fontSize: 32, fontWeight: '900', color: '#10B981' },
  scoreLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1F2937', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#10B981', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  timeBox: { backgroundColor: '#1F2937', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timeLabel: { fontSize: 14, color: '#6B7280' },
  timeValue: { fontSize: 16, fontWeight: '700', color: '#F9FAFB' },
  pendingBox: { backgroundColor: '#78350F', borderRadius: 14, padding: 16, marginBottom: 24 },
  pendingText: { color: '#F59E0B', fontSize: 14, lineHeight: 20 },
  doneBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default ExamResultScreen;
