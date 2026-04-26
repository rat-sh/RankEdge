import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Doubt = { id: string; content: string; chapter: string; subject: string; is_resolved: boolean; created_at: string; batch_id: string; student_id: string; users?: { name: string } };

const TeacherDoubtsScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  const { data: doubts = [], isLoading, refetch } = useQuery({
    queryKey: ['teacher_doubts', user?.id, filter],
    queryFn: async () => {
      const { data: batches } = await (supabase.from('batches').select('id').eq('teacher_id', user!.id) as any) as { data: any[] };
      if (!batches?.length) return [];
      const ids = batches.map((b: any) => b.id);
      let q = supabase.from('doubts').select('id, content, chapter, subject, is_resolved, created_at, batch_id, student_id, users(name)').in('batch_id', ids).order('created_at', { ascending: false }) as any;
      if (filter === 'unresolved') q = q.eq('is_resolved', false);
      if (filter === 'resolved') q = q.eq('is_resolved', true);
      const { data } = await q;
      return (data ?? []) as Doubt[];
    },
    enabled: !!user,
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}><Text style={s.heading}>Doubt Forum</Text></View>
      <View style={s.filters}>
        {(['unresolved', 'all', 'resolved'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={doubts}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No doubts {filter === 'unresolved' ? 'pending' : ''}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => nav.navigate(ROUTES.DOUBT_THREAD, { doubtId: item.id })}>
              <View style={s.cardTop}>
                <Text style={s.subject}>{item.subject} · {item.chapter}</Text>
                <View style={[s.pill, { backgroundColor: item.is_resolved ? '#064E3B' : '#78350F' }]}>
                  <Text style={[s.pillText, { color: item.is_resolved ? '#10B981' : '#F59E0B' }]}>{item.is_resolved ? 'Resolved' : 'Open'}</Text>
                </View>
              </View>
              <Text style={s.content} numberOfLines={2}>{item.content}</Text>
              <Text style={s.meta}>By {(item.users as any)?.name ?? 'Student'} · {new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1F2937' },
  chipActive: { backgroundColor: '#3B82F6' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subject: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '700' },
  content: { fontSize: 14, color: '#F9FAFB', lineHeight: 20, marginBottom: 6 },
  meta: { fontSize: 11, color: '#4B5563' },
});

export default TeacherDoubtsScreen;
