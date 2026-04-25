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

const StudentHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['student_home', user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase.from('users').select('batch_ids').eq('id', user!.id).single();
      const batchIds: string[] = (profile as any)?.batch_ids ?? [];
      if (!batchIds.length) return { exams: [], assignments: [], liveClasses: [], batchCount: 0 };

      const now = new Date().toISOString();
      const [examsRes, assignRes, classRes] = await Promise.all([
        supabase.from('exams').select('id, title, scheduled_at, is_live, duration_minutes').overlaps('batch_ids', batchIds).gte('scheduled_at', now).order('scheduled_at').limit(3),
        supabase.from('assignments').select('id, title, deadline, batch_id').in('batch_id', batchIds).gte('deadline', now).order('deadline').limit(3),
        supabase.from('live_classes').select('id, title, scheduled_at, status, platform, meeting_link').in('batch_id', batchIds).in('status', ['SCHEDULED', 'LIVE']).order('scheduled_at').limit(3),
      ]);
      return {
        exams: examsRes.data ?? [],
        assignments: assignRes.data ?? [],
        liveClasses: classRes.data ?? [],
        batchCount: batchIds.length,
      };
    },
    enabled: !!user,
  });

  const quickLinks = [
    { label: 'Exams', route: ROUTES.STUDENT_EXAMS, color: '#EF4444' },
    { label: 'Notes', route: ROUTES.NOTES_BROWSER, color: '#3B82F6' },
    { label: 'Doubts', route: ROUTES.STUDENT_DOUBTS, color: '#F59E0B' },
    { label: 'Attendance', route: ROUTES.MY_ATTENDANCE, color: '#10B981' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Welcome back,</Text>
          <Text style={s.name}>{user?.name ?? 'Student'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.STUDENT_PROFILE)} style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'S'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#10B981" />}>

          {data?.batchCount === 0 && (
            <TouchableOpacity style={s.joinBanner} onPress={() => navigation.navigate(ROUTES.JOIN_BATCH)}>
              <Text style={s.joinBannerTitle}>Join a Batch</Text>
              <Text style={s.joinBannerSub}>Enter your teacher's join code to get started →</Text>
            </TouchableOpacity>
          )}

          <View style={s.quickGrid}>
            {quickLinks.map(q => (
              <TouchableOpacity key={q.label} style={[s.quickCard, { borderLeftColor: q.color }]} onPress={() => navigation.navigate(q.route)}>
                <Text style={[s.quickLabel, { color: q.color }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(data?.liveClasses.some((c: any) => c.status === 'LIVE')) && (
            <View style={s.liveBanner}>
              <Text style={s.liveBannerDot}>●</Text>
              <Text style={s.liveBannerText}>A class is LIVE right now!</Text>
              <TouchableOpacity onPress={() => navigation.navigate(ROUTES.STUDENT_LIVE_CLASSES)}>
                <Text style={s.liveBannerJoin}>Join →</Text>
              </TouchableOpacity>
            </View>
          )}

          {(data?.exams.length ?? 0) > 0 && (
            <>
              <Text style={s.sectionTitle}>Upcoming Exams</Text>
              {data!.exams.map((e: any) => (
                <TouchableOpacity key={e.id} style={s.listCard} onPress={() => navigation.navigate(ROUTES.STUDENT_EXAMS)}>
                  <View style={s.listCardLeft}>
                    <Text style={s.listTitle}>{e.title}</Text>
                    <Text style={s.listSub}>{e.scheduled_at ? new Date(e.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unscheduled'} · {e.duration_minutes} min</Text>
                  </View>
                  {e.is_live && <View style={s.livePill}><Text style={s.livePillText}>LIVE</Text></View>}
                </TouchableOpacity>
              ))}
            </>
          )}

          {(data?.assignments.length ?? 0) > 0 && (
            <>
              <Text style={s.sectionTitle}>Upcoming Deadlines</Text>
              {data!.assignments.map((a: any) => (
                <TouchableOpacity key={a.id} style={s.listCard} onPress={() => navigation.navigate(ROUTES.STUDENT_ASSIGNMENTS)}>
                  <Text style={s.listTitle}>{a.title}</Text>
                  <Text style={s.listSub}>Due: {new Date(a.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#064E3B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#10B981' },
  content: { padding: 16, paddingBottom: 40 },
  joinBanner: { backgroundColor: '#064E3B', borderRadius: 16, padding: 18, marginBottom: 16 },
  joinBannerTitle: { fontSize: 17, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  joinBannerSub: { fontSize: 13, color: '#6EE7B7' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickCard: { width: '47%', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, borderLeftWidth: 3 },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  liveBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#064E3B', borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  liveBannerDot: { color: '#10B981', fontSize: 12 },
  liveBannerText: { flex: 1, color: '#F9FAFB', fontWeight: '600', fontSize: 14 },
  liveBannerJoin: { color: '#10B981', fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, marginTop: 4 },
  listCard: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listCardLeft: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#F9FAFB', marginBottom: 2 },
  listSub: { fontSize: 12, color: '#6B7280' },
  livePill: { backgroundColor: '#064E3B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  livePillText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
});

export default StudentHomeScreen;
