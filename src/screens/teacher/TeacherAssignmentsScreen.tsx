import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Assignment = { id: string; title: string; deadline: string; max_marks: number; batch_id: string; created_at: string };
type Batch = { id: string; name: string };

const TeacherAssignmentsScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher_assignments', user?.id],
    queryFn: async () => {
      const [batchRes, asgRes] = await Promise.all([
        (supabase.from('batches').select('id, name').eq('teacher_id', user!.id) as any) as Promise<{ data: Batch[] }>,
        (supabase.from('assignments').select('id, title, deadline, max_marks, batch_id, created_at').eq('teacher_id', user!.id).order('deadline', { ascending: true }) as any) as Promise<{ data: Assignment[] }>,
      ]);
      const batches: Record<string, string> = {};
      (batchRes.data ?? []).forEach(b => { batches[b.id] = b.name; });
      return { assignments: asgRes.data ?? [], batches };
    },
    enabled: !!user,
  });

  const isOverdue = (deadline: string) => new Date(deadline) < new Date();
  const daysUntil = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Assignments</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate(ROUTES.CREATE_EDIT_ASSIGNMENT)}>
          <Text style={s.addBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={data?.assignments}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No assignments yet</Text>}
          renderItem={({ item }) => {
            const days = daysUntil(item.deadline);
            const overdue = isOverdue(item.deadline);
            return (
              <TouchableOpacity style={s.card} onPress={() => nav.navigate(ROUTES.ASSIGNMENT_SUBMISSIONS, { assignmentId: item.id })}>
                <View style={s.cardTop}>
                  <Text style={s.batchTag}>{data?.batches[item.batch_id] ?? 'Batch'}</Text>
                  <View style={[s.pill, { backgroundColor: overdue ? '#7F1D1D' : days <= 1 ? '#78350F' : '#1F2937' }]}>
                    <Text style={[s.pillText, { color: overdue ? '#EF4444' : days <= 1 ? '#F59E0B' : '#6B7280' }]}>
                      {overdue ? 'Overdue' : days === 0 ? 'Due today' : `Due in ${days}d`}
                    </Text>
                  </View>
                </View>
                <Text style={s.title}>{item.title}</Text>
                <View style={s.cardBottom}>
                  <Text style={s.deadline}>{new Date(item.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                  <Text style={s.marks}>{item.max_marks} marks</Text>
                  <Text style={s.viewSubmissions}>View Submissions →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
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
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60, fontSize: 14 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  batchTag: { fontSize: 11, color: '#3B82F6', fontWeight: '700', backgroundColor: '#1E3A5F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deadline: { fontSize: 12, color: '#9CA3AF' },
  marks: { fontSize: 12, color: '#6B7280' },
  viewSubmissions: { marginLeft: 'auto', fontSize: 12, color: '#3B82F6', fontWeight: '600' },
});

export default TeacherAssignmentsScreen;
