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

const TeacherBatchesScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data: batches = [], isLoading, refetch } = useQuery({
    queryKey: ['teacher_batches', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('teacher_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const renderBatch = ({ item }: { item: any }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate(ROUTES.BATCH_DETAIL, { batchId: item.id })} activeOpacity={0.85}>
      <View style={s.cardTop}>
        <View style={[s.statusDot, { backgroundColor: item.status === 'ACTIVE' ? '#10B981' : '#6B7280' }]} />
        <Text style={s.status}>{item.status}</Text>
        <Text style={s.joinCode}>{item.join_code}</Text>
      </View>
      <Text style={s.batchName}>{item.name}</Text>
      <Text style={s.subject}>{item.subject} · {item.exam_category}</Text>
      <View style={s.cardFooter}>
        <Text style={s.studentCount}>{item.student_ids?.length ?? 0} students</Text>
        {item.schedule && <Text style={s.schedule}>{item.schedule}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Batches</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate(ROUTES.ADD_EDIT_BATCH)}>
          <Text style={s.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={batches}
          keyExtractor={i => i.id}
          renderItem={renderBatch}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3B82F6" />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No batches yet</Text>
              <Text style={s.emptySub}>Create your first batch to get started</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate(ROUTES.ADD_EDIT_BATCH)}>
                <Text style={s.emptyBtnText}>Create Batch</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  status: { fontSize: 11, color: '#6B7280', fontWeight: '600', flex: 1 },
  joinCode: { fontSize: 12, color: '#3B82F6', fontWeight: '700', letterSpacing: 1, backgroundColor: '#1E3A5F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  batchName: { fontSize: 18, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  subject: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  studentCount: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  schedule: { fontSize: 12, color: '#6B7280' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});

export default TeacherBatchesScreen;
