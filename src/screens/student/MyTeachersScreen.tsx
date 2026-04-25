import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const MyTeachersScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data: batches = [], isLoading, refetch } = useQuery({
    queryKey: ['my_teachers', user?.id],
    queryFn: async () => {
      const { data: profile } = await (supabase.from('users').select('batch_ids').eq('id', user!.id).single() as any) as { data: { batch_ids: string[] } | null };
      const batchIds: string[] = profile?.batch_ids ?? [];
      if (!batchIds.length) return [];
      const { data } = await (supabase.from('batches').select('id, name, subject, exam_category, teacher_id, join_code, student_ids, status').in('id', batchIds) as any) as { data: any[] | null };
      return (data ?? []) as Array<{ id: string; name: string; subject: string; exam_category: string; teacher_id: string; join_code: string; student_ids: string[]; status: string }>;
    },
    enabled: !!user,
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>My Teachers</Text>
        <TouchableOpacity style={s.joinBtn} onPress={() => navigation.navigate(ROUTES.JOIN_BATCH)}>
          <Text style={s.joinBtnText}>+ Join Batch</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={batches}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#10B981" />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No batches yet</Text>
              <Text style={s.emptySub}>Join a batch using your teacher's code</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate(ROUTES.JOIN_BATCH)}>
                <Text style={s.emptyBtnText}>Join Batch</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => navigation.navigate(ROUTES.TEACHER_SPACE, { batchId: item.id, teacherId: item.teacher_id })} activeOpacity={0.85}>
              <View style={s.cardTop}>
                <Text style={s.subject}>{item.subject}</Text>
                <Text style={s.category}>{item.exam_category}</Text>
              </View>
              <Text style={s.batchName}>{item.name}</Text>
              <View style={s.cardFooter}>
                <Text style={s.students}>{item.student_ids?.length ?? 0} students</Text>
                <View style={[s.statusPill, { backgroundColor: item.status === 'ACTIVE' ? '#064E3B' : '#374151' }]}>
                  <Text style={[s.statusText, { color: item.status === 'ACTIVE' ? '#10B981' : '#6B7280' }]}>{item.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  joinBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  subject: { fontSize: 12, color: '#10B981', fontWeight: '700', backgroundColor: '#064E3B', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  category: { fontSize: 12, color: '#6B7280', fontWeight: '600', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: '#374151' },
  batchName: { fontSize: 18, fontWeight: '800', color: '#F9FAFB', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  students: { fontSize: 13, color: '#6B7280' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#10B981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});

export default MyTeachersScreen;
