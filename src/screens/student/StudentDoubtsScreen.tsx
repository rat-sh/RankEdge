import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

type DoubtRow = {
  id: string;
  content: string;
  chapter: string;
  subject: string;
  is_resolved: boolean;
  created_at: string;
  student_id: string;
};

const StudentDoubtsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'mine' | 'unresolved'>('all');

  const { data: doubts = [], isLoading, refetch } = useQuery({
    queryKey: ['student_doubts', user?.id, filter],
    queryFn: async (): Promise<DoubtRow[]> => {
      const { data: profile } = await supabase
        .from('users')
        .select('batch_ids')
        .eq('id', user!.id)
        .single();
      const batchIds: string[] = (profile as any)?.batch_ids ?? [];
      if (!batchIds.length) return [];

      let q = supabase
        .from('doubts')
        .select('id, content, chapter, subject, is_resolved, created_at, student_id')
        .in('batch_id', batchIds)
        .order('created_at', { ascending: false });

      if (filter === 'mine') q = (q as any).eq('student_id', user!.id);
      if (filter === 'unresolved') q = (q as any).eq('is_resolved', false);

      const { data } = await q;
      return (data ?? []) as unknown as DoubtRow[];
    },
    enabled: !!user,
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Doubts</Text>
        <TouchableOpacity style={s.postBtn} onPress={() => navigation.navigate(ROUTES.POST_DOUBT)}>
          <Text style={s.postBtnText}>+ Ask</Text>
        </TouchableOpacity>
      </View>
      <View style={s.filters}>
        {(['all', 'mine', 'unresolved'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? (
        <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={doubts}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#10B981" />}
          ListEmptyComponent={<Text style={s.empty}>No doubts found</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.chapter}>{item.subject} · {item.chapter}</Text>
                <View style={[s.statusPill, { backgroundColor: item.is_resolved ? '#064E3B' : '#78350F' }]}>
                  <Text style={[s.statusText, { color: item.is_resolved ? '#10B981' : '#F59E0B' }]}>
                    {item.is_resolved ? 'Resolved' : 'Open'}
                  </Text>
                </View>
              </View>
              <Text style={s.content} numberOfLines={2}>{item.content}</Text>
              <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  postBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1F2937' },
  filterActive: { backgroundColor: '#10B981' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { color: '#4B5563', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chapter: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  content: { fontSize: 14, color: '#F9FAFB', lineHeight: 20, marginBottom: 6 },
  date: { fontSize: 11, color: '#4B5563' },
});

export default StudentDoubtsScreen;
