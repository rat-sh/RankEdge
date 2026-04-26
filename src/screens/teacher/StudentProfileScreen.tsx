import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const StudentProfileScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { studentId } = route.params as { studentId: string };

  const { data, isLoading } = useQuery({
    queryKey: ['student_profile_detail', studentId],
    queryFn: async () => {
      const [profileRes, attemptsRes, submissionsRes] = await Promise.all([
        supabase.from('users').select('name, email, phone, city, institution, subject_list').eq('id', studentId).single() as any,
        supabase.from('exam_attempts').select('score, submitted_at').eq('student_id', studentId).order('submitted_at', { ascending: false }).limit(10) as any,
        supabase.from('submissions').select('status, grade, submitted_at').eq('student_id', studentId).order('submitted_at', { ascending: false }).limit(10) as any,
      ]);
      const profile = profileRes.data as any;
      const attempts = (attemptsRes.data ?? []) as any[];
      const submissions = (submissionsRes.data ?? []) as any[];
      const avgScore = attempts.length ? Math.round(attempts.reduce((s: number, a: any) => s + (a.score ?? 0), 0) / attempts.length) : 0;
      return { profile, attempts, submissions, avgScore };
    },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Student Profile</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.avatar}><Text style={s.avatarText}>{data?.profile?.name?.[0]?.toUpperCase()}</Text></View>
          <Text style={s.name}>{data?.profile?.name}</Text>
          <Text style={s.email}>{data?.profile?.email}</Text>
          {data?.profile?.phone && <Text style={s.detail}>{data.profile.phone}</Text>}
          {data?.profile?.city && <Text style={s.detail}>{data.profile.city}</Text>}
          {data?.profile?.institution && <Text style={s.detail}>{data.profile.institution}</Text>}

          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#3B82F6' }]}>{data?.avgScore ?? 0}</Text>
              <Text style={s.statLabel}>Avg Score</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#10B981' }]}>{data?.attempts?.length ?? 0}</Text>
              <Text style={s.statLabel}>Exams</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#F59E0B' }]}>{data?.submissions?.length ?? 0}</Text>
              <Text style={s.statLabel}>Assignments</Text>
            </View>
          </View>

          <Text style={s.section}>Recent Exam Scores</Text>
          {data?.attempts?.map((a: any, i: number) => (
            <View key={i} style={s.row}>
              <Text style={s.rowDate}>{new Date(a.submitted_at).toLocaleDateString('en-IN')}</Text>
              <Text style={[s.rowScore, { color: (a.score ?? 0) >= 60 ? '#10B981' : '#EF4444' }]}>{a.score ?? 0}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  content: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#3B82F6' },
  name: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  detail: { fontSize: 13, color: '#4B5563', marginBottom: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginVertical: 20, alignSelf: 'stretch', justifyContent: 'center' },
  stat: { backgroundColor: '#1F2937', borderRadius: 14, padding: 16, alignItems: 'center', flex: 1 },
  statVal: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '800', color: '#F9FAFB', marginBottom: 10, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1F2937', borderRadius: 10, padding: 12, marginBottom: 6, alignSelf: 'stretch' },
  rowDate: { fontSize: 13, color: '#9CA3AF' },
  rowScore: { fontSize: 16, fontWeight: '700' },
});

export default StudentProfileScreen;
