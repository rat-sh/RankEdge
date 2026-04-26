import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

type Assignment = { id: string; title: string; deadline: string; max_marks: number; status?: string; grade?: number | null };

const StudentAssignmentsScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params as { batchId: string };
  const { user } = useAuthStore();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['student_assignments', batchId, user?.id],
    queryFn: async () => {
      const [asgRes, subRes] = await Promise.all([
        supabase.from('assignments').select('id, title, deadline, max_marks, description').eq('batch_id', batchId).order('deadline', { ascending: true }) as any,
        supabase.from('submissions').select('assignment_id, status, grade, is_late').eq('student_id', user!.id) as any,
      ]);
      const assignments = (asgRes.data ?? []) as any[];
      const subs: Record<string, any> = {};
      (subRes.data ?? []).forEach((s: any) => { subs[s.assignment_id] = s; });
      return assignments.map(a => ({ ...a, sub: subs[a.id] ?? null }));
    },
    enabled: !!user,
  });

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Assignments</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList data={data} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No assignments yet</Text>}
          renderItem={({ item }) => {
            const days = daysUntil(item.deadline);
            const overdue = days < 0;
            const sub = item.sub;
            return (
              <View style={s.card}>
                <View style={s.cardTop}>
                  <Text style={s.title}>{item.title}</Text>
                  {sub?.is_late && <Text style={s.late}>LATE</Text>}
                  <View style={[s.pill, { backgroundColor: overdue ? '#7F1D1D' : days <= 1 ? '#78350F' : '#1F2937' }]}>
                    <Text style={[s.pillText, { color: overdue ? '#EF4444' : days <= 1 ? '#F59E0B' : '#6B7280' }]}>
                      {overdue ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`}
                    </Text>
                  </View>
                </View>
                <Text style={s.deadline}>{new Date(item.deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {item.max_marks} marks</Text>
                {sub?.status === 'GRADED' && <Text style={s.grade}>Grade: {sub.grade}/{item.max_marks}</Text>}
                <TouchableOpacity
                  style={[s.actionBtn, sub ? (sub.status === 'GRADED' ? s.actionGraded : s.actionSubmitted) : s.actionOpen]}
                  onPress={() => sub?.status === 'GRADED'
                    ? nav.navigate(ROUTES.VIEW_GRADED_ASSIGNMENT, { submissionId: sub.id, assignmentId: item.id })
                    : nav.navigate(ROUTES.SUBMIT_ASSIGNMENT, { assignmentId: item.id })
                  }
                >
                  <Text style={s.actionBtnText}>
                    {sub?.status === 'GRADED' ? 'View Feedback' : sub ? 'Submitted ✓' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 12 },
  back: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 22, fontWeight: '800', color: '#F9FAFB' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#F9FAFB' },
  late: { fontSize: 10, color: '#F59E0B', fontWeight: '800', backgroundColor: '#78350F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700' },
  deadline: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  grade: { fontSize: 14, color: '#10B981', fontWeight: '700', marginBottom: 8 },
  actionBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionOpen: { backgroundColor: '#10B981' },
  actionSubmitted: { backgroundColor: '#374151' },
  actionGraded: { backgroundColor: '#1E3A5F', borderWidth: 1, borderColor: '#3B82F6' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default StudentAssignmentsScreen;
