import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const TeacherHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['teacher_home', user?.id],
    queryFn: async () => {
      const [batchRes, examRes, assignRes, doubtRes] = await Promise.all([
        supabase.from('batches').select('id, name, student_ids').eq('teacher_id', user!.id).eq('status', 'ACTIVE'),
        supabase.from('exams').select('id, title, scheduled_at, is_live').eq('teacher_id', user!.id).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(3),
        supabase.from('assignments').select('id, title, deadline').eq('teacher_id', user!.id).gte('deadline', new Date().toISOString()).order('deadline').limit(3),
        supabase.from('doubts').select('id, content, chapter, created_at').eq('is_resolved', false).limit(5),
      ]);
      const totalStudents = (batchRes.data ?? []).reduce((sum: number, b: any) => sum + (b.student_ids?.length ?? 0), 0);
      return {
        batches: batchRes.data ?? [],
        totalStudents,
        upcomingExams: examRes.data ?? [],
        upcomingAssignments: assignRes.data ?? [],
        unresolvedDoubts: doubtRes.data ?? [],
      };
    },
    enabled: !!user,
  });

  const quickActions = [
    { label: 'Create Exam', route: ROUTES.CREATE_EDIT_EXAM, color: '#3B82F6' },
    { label: 'Add Batch', route: ROUTES.ADD_EDIT_BATCH, color: '#10B981' },
    { label: 'Upload Note', route: ROUTES.UPLOAD_NOTE, color: '#F59E0B' },
    { label: 'Schedule Class', route: ROUTES.SCHEDULE_LIVE_CLASS, color: '#8B5CF6' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good day,</Text>
          <Text style={s.name}>{user?.name ?? 'Teacher'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.TEACHER_PROFILE)} style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'T'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3B82F6" />}
        >
          <View style={s.statsRow}>
            {[
              { label: 'Batches', value: data?.batches.length ?? 0, color: '#3B82F6' },
              { label: 'Students', value: data?.totalStudents ?? 0, color: '#10B981' },
              { label: 'Open Doubts', value: data?.unresolvedDoubts.length ?? 0, color: '#F59E0B' },
            ].map(stat => (
              <View key={stat.label} style={s.statCard}>
                <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickGrid}>
            {quickActions.map(a => (
              <TouchableOpacity key={a.label} style={[s.quickCard, { borderLeftColor: a.color }]} onPress={() => navigation.navigate(a.route)}>
                <Text style={[s.quickLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(data?.upcomingExams.length ?? 0) > 0 && (
            <>
              <Text style={s.sectionTitle}>Upcoming Exams</Text>
              {data!.upcomingExams.map((e: any) => (
                <TouchableOpacity key={e.id} style={s.listCard} onPress={() => navigation.navigate(ROUTES.TEACHER_EXAMS)}>
                  <View>
                    <Text style={s.listTitle}>{e.title}</Text>
                    <Text style={s.listSub}>{e.scheduled_at ? new Date(e.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unscheduled'}</Text>
                  </View>
                  {e.is_live && <View style={s.liveDot}><Text style={s.liveDotText}>LIVE</Text></View>}
                </TouchableOpacity>
              ))}
            </>
          )}

          {(data?.unresolvedDoubts.length ?? 0) > 0 && (
            <>
              <Text style={s.sectionTitle}>Pending Doubts</Text>
              {data!.unresolvedDoubts.slice(0, 3).map((d: any) => (
                <TouchableOpacity key={d.id} style={s.listCard} onPress={() => navigation.navigate(ROUTES.TEACHER_DOUBTS)}>
                  <Text style={s.listTitle} numberOfLines={1}>{d.content}</Text>
                  <Text style={s.listSub}>{d.chapter}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  greeting: { fontSize: 13, color: '#6B7280' },
  name: { fontSize: 22, fontWeight: '800', color: '#F9FAFB' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#3B82F6' },
  content: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickCard: { width: '47%', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, borderLeftWidth: 3 },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  listCard: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#F9FAFB', marginBottom: 2 },
  listSub: { fontSize: 12, color: '#6B7280' },
  liveDot: { backgroundColor: '#064E3B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveDotText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
});

export default TeacherHomeScreen;
