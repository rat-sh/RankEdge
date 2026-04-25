import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const InterviewTrackerScreen = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['interview_tracker', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('interview_attempts').select('id, score, total_marks, completed_at, pack_id').eq('student_id', user!.id).order('completed_at', { ascending: false });
      const attempts = data ?? [];
      const avg = attempts.length ? Math.round(attempts.reduce((s: number, a: any) => s + (a.score / a.total_marks * 100), 0) / attempts.length) : 0;
      return { attempts, avg, total: attempts.length };
    },
    enabled: !!user,
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}><Text style={s.heading}>Interview Tracker</Text></View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <>
          <View style={s.statsRow}>
            {[
              { label: 'Attempts', value: data?.total ?? 0, color: '#3B82F6' },
              { label: 'Avg Score', value: `${data?.avg ?? 0}%`, color: '#10B981' },
            ].map(st => (
              <View key={st.label} style={s.statCard}>
                <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
          <FlatList
            data={data?.attempts}
            keyExtractor={i => i.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={<Text style={s.empty}>No interview attempts yet</Text>}
            renderItem={({ item }) => {
              const pct = Math.round((item.score / item.total_marks) * 100);
              return (
                <View style={s.card}>
                  <Text style={[s.score, { color: pct >= 60 ? '#10B981' : '#EF4444' }]}>{pct}%</Text>
                  <View style={s.cardRight}>
                    <Text style={s.cardScore}>{item.score} / {item.total_marks} marks</Text>
                    <Text style={s.cardDate}>{new Date(item.completed_at).toLocaleDateString('en-IN')}</Text>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { color: '#4B5563', textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, gap: 14, alignItems: 'center' },
  score: { fontSize: 24, fontWeight: '800', width: 56, textAlign: 'center' },
  cardRight: { flex: 1 },
  cardScore: { fontSize: 14, color: '#F9FAFB', fontWeight: '600', marginBottom: 2 },
  cardDate: { fontSize: 12, color: '#6B7280' },
});

export default InterviewTrackerScreen;
