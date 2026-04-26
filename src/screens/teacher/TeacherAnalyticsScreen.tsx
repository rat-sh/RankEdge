import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const TeacherAnalyticsScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher_analytics', user?.id],
    queryFn: async () => {
      const [batchRes, examRes, asgRes, subRes] = await Promise.all([
        supabase.from('batches').select('id, name, student_ids, status').eq('teacher_id', user!.id) as any,
        supabase.from('exams').select('id, title').eq('teacher_id', user!.id) as any,
        supabase.from('assignments').select('id, title').eq('teacher_id', user!.id) as any,
        supabase.from('submissions').select('id, status').eq('status', 'SUBMITTED') as any,
      ]);
      const batches = (batchRes.data ?? []) as any[];
      const totalStudents = batches.reduce((s: number, b: any) => s + (b.student_ids?.length ?? 0), 0);
      const activeBatches = batches.filter((b: any) => b.status === 'ACTIVE').length;
      const ungraded = (subRes.data ?? []).length;
      return { batches, totalStudents, activeBatches, ungraded, totalAssignments: (asgRes.data ?? []).length };
    },
    enabled: !!user,
  });

  const StatCard = ({ label, value, color = '#3B82F6', sub }: { label: string; value: any; color?: string; sub?: string }) => (
    <View style={s.statCard}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub && <Text style={s.statSub}>{sub}</Text>}
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}><Text style={s.heading}>Analytics</Text></View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.grid}>
            <StatCard label="Total Students" value={data?.totalStudents ?? 0} color="#3B82F6" />
            <StatCard label="Active Batches" value={data?.activeBatches ?? 0} color="#10B981" />
            <StatCard label="Assignments" value={data?.totalAssignments ?? 0} color="#F59E0B" />
            <StatCard label="Ungraded" value={data?.ungraded ?? 0} color="#EF4444" sub="submissions" />
          </View>

          <Text style={s.sectionTitle}>Batch Overview</Text>
          {(data?.batches ?? []).map((b: any) => (
            <TouchableOpacity key={b.id} style={s.batchCard} onPress={() => nav.navigate(ROUTES.STUDENT_ANALYTICS_DETAIL, { batchId: b.id })}>
              <View>
                <Text style={s.batchName}>{b.name}</Text>
                <Text style={s.batchStudents}>{b.student_ids?.length ?? 0} students</Text>
              </View>
              <View style={[s.badge, { backgroundColor: b.status === 'ACTIVE' ? '#064E3B' : '#374151' }]}>
                <Text style={[s.badgeText, { color: b.status === 'ACTIVE' ? '#10B981' : '#6B7280' }]}>{b.status}</Text>
              </View>
            </TouchableOpacity>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#1F2937', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  statSub: { fontSize: 10, color: '#4B5563', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#F9FAFB', marginBottom: 10 },
  batchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginBottom: 8 },
  batchName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  batchStudents: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

export default TeacherAnalyticsScreen;
