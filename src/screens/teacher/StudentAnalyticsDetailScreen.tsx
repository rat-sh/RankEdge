import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const StudentAnalyticsDetailScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params as { batchId: string };

  const { data, isLoading } = useQuery({
    queryKey: ['batch_analytics', batchId],
    queryFn: async () => {
      const [batchRes, attemptsRes, attRes] = await Promise.all([
        supabase.from('batches').select('name, student_ids').eq('id', batchId).single() as any,
        supabase.from('exam_attempts').select('student_id, score, submitted_at, users(name)').eq('exam_id', batchId).order('score', { ascending: false }) as any,
        supabase.from('attendance').select('student_id, status, users(name)').eq('batch_id', batchId) as any,
      ]);
      const batch = batchRes.data as any;
      const attempts = (attemptsRes.data ?? []) as any[];
      const att = (attRes.data ?? []) as any[];

      // Group attendance by student
      const attByStudent: Record<string, { name: string; total: number; present: number }> = {};
      att.forEach((r: any) => {
        if (!attByStudent[r.student_id]) attByStudent[r.student_id] = { name: r.users?.name ?? '', total: 0, present: 0 };
        attByStudent[r.student_id].total++;
        if (r.status === 'PRESENT') attByStudent[r.student_id].present++;
      });

      return { batch, attempts, attByStudent: Object.entries(attByStudent).map(([id, v]) => ({ id, ...v, pct: v.total ? Math.round(v.present / v.total * 100) : 0 })) };
    },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>{data?.batch?.name ?? 'Batch Analytics'}</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.section}>Exam Scores</Text>
          {data?.attempts?.length === 0 && <Text style={s.empty}>No exam attempts yet</Text>}
          {data?.attempts?.map((a: any, i: number) => (
            <View key={a.student_id + i} style={s.row}>
              <Text style={s.rank}>#{i + 1}</Text>
              <Text style={s.sname}>{a.users?.name ?? 'Student'}</Text>
              <Text style={[s.score, { color: a.score >= 60 ? '#10B981' : '#EF4444' }]}>{a.score}</Text>
            </View>
          ))}

          <Text style={[s.section, { marginTop: 20 }]}>Attendance</Text>
          {data?.attByStudent?.length === 0 && <Text style={s.empty}>No attendance records</Text>}
          {data?.attByStudent?.map((a: any) => (
            <View key={a.id} style={s.attRow}>
              <Text style={s.sname}>{a.name}</Text>
              <View style={s.attBar}>
                <View style={[s.attFill, { width: `${a.pct}%` as any, backgroundColor: a.pct >= 75 ? '#10B981' : '#EF4444' }]} />
              </View>
              <Text style={[s.attPct, { color: a.pct >= 75 ? '#10B981' : '#EF4444' }]}>{a.pct}%</Text>
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
  heading: { flex: 1, fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '800', color: '#F9FAFB', marginBottom: 10 },
  empty: { color: '#4B5563', textAlign: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  rank: { width: 24, fontSize: 13, color: '#6B7280', fontWeight: '700' },
  sname: { flex: 1, fontSize: 14, color: '#F9FAFB', fontWeight: '600' },
  score: { fontSize: 18, fontWeight: '800' },
  attRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  attBar: { flex: 1, height: 6, backgroundColor: '#374151', borderRadius: 3, overflow: 'hidden' },
  attFill: { height: 6, borderRadius: 3 },
  attPct: { fontSize: 14, fontWeight: '800', width: 40, textAlign: 'right' },
});

export default StudentAnalyticsDetailScreen;
