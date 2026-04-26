import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const StudentLiveClassesScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params as { batchId: string };

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['student_live_classes', batchId],
    queryFn: async () => {
      const { data } = await (supabase.from('live_classes').select('id, title, platform, meeting_link, scheduled_at, duration_minutes, status, recording_url').eq('batch_id', batchId).order('scheduled_at', { ascending: false }) as any) as { data: any[] };
      return data ?? [];
    },
  });

  const STATUS_COLOR: Record<string, string> = { SCHEDULED: '#3B82F6', LIVE: '#10B981', COMPLETED: '#6B7280' };
  const STATUS_BG: Record<string, string> = { SCHEDULED: '#1E3A5F', LIVE: '#064E3B', COMPLETED: '#1F2937' };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Live Classes</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList data={classes} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No live classes scheduled</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.title}>{item.title}</Text>
                <View style={[s.statusPill, { backgroundColor: STATUS_BG[item.status] }]}>
                  {item.status === 'LIVE' && <View style={s.liveDot} />}
                  <Text style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.platform}>{item.platform} · {item.duration_minutes} min</Text>
              <Text style={s.datetime}>{new Date(item.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
              <View style={s.actions}>
                {(item.status === 'LIVE' || item.status === 'SCHEDULED') && item.meeting_link ? (
                  <TouchableOpacity style={s.joinBtn} onPress={() => Linking.openURL(item.meeting_link)}>
                    <Text style={s.joinBtnText}>{item.status === 'LIVE' ? '🔴 Join Now' : 'Join When Live'}</Text>
                  </TouchableOpacity>
                ) : null}
                {item.status === 'COMPLETED' && item.recording_url ? (
                  <TouchableOpacity style={s.recBtn} onPress={() => Linking.openURL(item.recording_url)}>
                    <Text style={s.recBtnText}>▶ Watch Recording</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginRight: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { fontSize: 11, fontWeight: '700' },
  platform: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  datetime: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  joinBtn: { flex: 1, backgroundColor: '#064E3B', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#10B981' },
  joinBtnText: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  recBtn: { flex: 1, backgroundColor: '#1E3A5F', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6' },
  recBtnText: { color: '#3B82F6', fontWeight: '700', fontSize: 13 },
});

export default StudentLiveClassesScreen;
