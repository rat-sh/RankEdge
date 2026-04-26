import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type LiveClass = { id: string; title: string; platform: string; meeting_link: string; scheduled_at: string; duration_minutes: number; status: string; batch_id: string };

const TeacherLiveClassesScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['teacher_live_classes', user?.id],
    queryFn: async () => {
      const { data: batches } = await (supabase.from('batches').select('id').eq('teacher_id', user!.id) as any) as { data: any[] };
      if (!batches?.length) return [];
      const ids = batches.map((b: any) => b.id);
      const { data } = await (supabase.from('live_classes').select('*').in('batch_id', ids).order('scheduled_at', { ascending: false }) as any) as { data: LiveClass[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleMarkLive = async (id: string, current: string) => {
    const newStatus = current === 'LIVE' ? 'COMPLETED' : 'LIVE';
    await (supabase.from('live_classes') as any).update({ status: newStatus }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['teacher_live_classes'] });
  };

  const statusColor: Record<string, string> = { SCHEDULED: '#3B82F6', LIVE: '#10B981', COMPLETED: '#6B7280' };
  const statusBg: Record<string, string> = { SCHEDULED: '#1E3A5F', LIVE: '#064E3B', COMPLETED: '#1F2937' };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Live Classes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate(ROUTES.SCHEDULE_LIVE_CLASS)}>
          <Text style={s.addBtnText}>+ Schedule</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList data={classes} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No classes scheduled</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.title}>{item.title}</Text>
                <View style={[s.statusPill, { backgroundColor: statusBg[item.status] ?? '#1F2937' }]}>
                  {item.status === 'LIVE' && <View style={s.liveDot} />}
                  <Text style={[s.statusText, { color: statusColor[item.status] ?? '#9CA3AF' }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.platform}>{item.platform} · {item.duration_minutes} min</Text>
              <Text style={s.datetime}>{new Date(item.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
              <View style={s.actions}>
                <TouchableOpacity style={s.joinBtn} onPress={() => Linking.openURL(item.meeting_link)}>
                  <Text style={s.joinBtnText}>Open Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.liveBtn, item.status === 'LIVE' && s.liveBtnEnd]} onPress={() => handleMarkLive(item.id, item.status)}>
                  <Text style={s.liveBtnText}>{item.status === 'LIVE' ? 'End Class' : item.status === 'COMPLETED' ? '✓ Done' : 'Go Live'}</Text>
                </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { flex: 1, fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#F9FAFB' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { fontSize: 11, fontWeight: '700' },
  platform: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  datetime: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  joinBtn: { flex: 1, backgroundColor: '#1E3A5F', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6' },
  joinBtnText: { color: '#3B82F6', fontWeight: '700', fontSize: 13 },
  liveBtn: { flex: 1, backgroundColor: '#064E3B', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  liveBtnEnd: { backgroundColor: '#7F1D1D' },
  liveBtnText: { color: '#F9FAFB', fontWeight: '700', fontSize: 13 },
});

export default TeacherLiveClassesScreen;
