import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth/authStore';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const TeacherSpaceScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId, teacherId } = route.params as { batchId: string; teacherId: string };
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher_space', batchId, user?.id],
    queryFn: async () => {
      const [batchRes, examRes, noteRes, classRes, asgRes] = await Promise.all([
        supabase.from('batches').select('name, subject, exam_category, schedule, teacher_id, users(name)').eq('id', batchId).single() as any,
        supabase.from('exams').select('id, title, scheduled_at, is_live').overlaps('batch_ids', [batchId]).order('scheduled_at', { ascending: false }).limit(3) as any,
        supabase.from('notes').select('id, title, subject, chapter, is_pinned').eq('batch_id', batchId).order('is_pinned', { ascending: false }).limit(3) as any,
        supabase.from('live_classes').select('id, title, status, scheduled_at').eq('batch_id', batchId).order('scheduled_at', { ascending: false }).limit(3) as any,
        supabase.from('assignments').select('id, title, deadline').eq('batch_id', batchId).order('deadline', { ascending: true }).limit(3) as any,
      ]);
      return {
        batch: batchRes.data as any,
        exams: (examRes.data ?? []) as any[],
        notes: (noteRes.data ?? []) as any[],
        classes: (classRes.data ?? []) as any[],
        assignments: (asgRes.data ?? []) as any[],
      };
    },
  });

  const tiles = [
    { label: 'Exams', icon: '📋', route: ROUTES.STUDENT_EXAMS, color: '#3B82F6', bg: '#1E3A5F' },
    { label: 'Notes', icon: '📄', route: ROUTES.NOTES_BROWSER, color: '#10B981', bg: '#064E3B', params: { batchId } },
    { label: 'Lectures', icon: '🎬', route: ROUTES.STUDENT_LECTURES, color: '#8B5CF6', bg: '#2E1065', params: { batchId } },
    { label: 'Live Classes', icon: '🔴', route: ROUTES.STUDENT_LIVE_CLASSES, color: '#EF4444', bg: '#7F1D1D', params: { batchId } },
    { label: 'Assignments', icon: '📝', route: ROUTES.STUDENT_ASSIGNMENTS, color: '#F59E0B', bg: '#78350F', params: { batchId } },
    { label: 'Doubts', icon: '❓', route: ROUTES.STUDENT_DOUBTS, color: '#14B8A6', bg: '#134E4A' },
    { label: 'Attendance', icon: '✅', route: ROUTES.MY_ATTENDANCE, color: '#A78BFA', bg: '#1E1B4B' },
    { label: 'Interview Prep', icon: '💼', route: ROUTES.INTERVIEW_PACKS, color: '#FB923C', bg: '#431407' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        {isLoading ? <ActivityIndicator color="#10B981" size="small" /> : (
          <View style={{ flex: 1 }}>
            <Text style={s.batchName}>{data?.batch?.name}</Text>
            <Text style={s.batchMeta}>{data?.batch?.subject} · {data?.batch?.exam_category}</Text>
          </View>
        )}
      </View>

      {/* Live class alert */}
      {data?.classes?.find((c: any) => c.status === 'LIVE') && (
        <TouchableOpacity style={s.liveAlert} onPress={() => nav.navigate(ROUTES.STUDENT_LIVE_CLASSES, { batchId })}>
          <View style={s.liveDot} />
          <Text style={s.liveAlertText}>Class is LIVE now — Join!</Text>
          <Text style={s.liveArrow}>›</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={s.content}>
        {/* Quick tiles */}
        <View style={s.grid}>
          {tiles.map(t => (
            <TouchableOpacity key={t.label} style={[s.tile, { backgroundColor: t.bg, borderColor: t.color }]} onPress={() => nav.navigate(t.route as any, t.params)}>
              <Text style={s.tileIcon}>{t.icon}</Text>
              <Text style={[s.tileLabel, { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming exams */}
        {(data?.exams?.length ?? 0) > 0 && (
          <>
            <Text style={s.section}>Upcoming Exams</Text>
            {data!.exams.map((e: any) => (
              <View key={e.id} style={s.miniCard}>
                {e.is_live && <View style={s.liveMini} />}
                <Text style={s.miniTitle}>{e.title}</Text>
                <Text style={s.miniDate}>{e.scheduled_at ? new Date(e.scheduled_at).toLocaleDateString('en-IN') : 'TBD'}</Text>
              </View>
            ))}
          </>
        )}

        {/* Pending assignments */}
        {(data?.assignments?.length ?? 0) > 0 && (
          <>
            <Text style={s.section}>Assignments</Text>
            {data!.assignments.map((a: any) => (
              <View key={a.id} style={s.miniCard}>
                <Text style={s.miniTitle}>{a.title}</Text>
                <Text style={[s.miniDate, { color: '#F59E0B' }]}>Due {new Date(a.deadline).toLocaleDateString('en-IN')}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 12 },
  back: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  batchName: { fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  batchMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  liveAlert: { marginHorizontal: 16, backgroundColor: '#7F1D1D', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EF4444' },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  liveAlertText: { flex: 1, color: '#FCA5A5', fontWeight: '700', fontSize: 14 },
  liveArrow: { fontSize: 20, color: '#EF4444' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tile: { width: '47%', borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'center' },
  tileIcon: { fontSize: 28, marginBottom: 8 },
  tileLabel: { fontSize: 13, fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '800', color: '#F9FAFB', marginBottom: 8, marginTop: 4 },
  miniCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1F2937', borderRadius: 10, padding: 12, marginBottom: 6, alignItems: 'center' },
  liveMini: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8 },
  miniTitle: { flex: 1, fontSize: 13, color: '#F9FAFB', fontWeight: '600' },
  miniDate: { fontSize: 11, color: '#6B7280' },
});

export default TeacherSpaceScreen;
