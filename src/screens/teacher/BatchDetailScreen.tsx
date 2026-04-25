import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TABS = ['Students', 'Exams', 'Assignments'];

const BatchDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params as { batchId: string };
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch_detail', batchId],
    queryFn: async () => {
      const { data, error } = await supabase.from('batches').select('*').eq('id', batchId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['batch_students', batchId],
    queryFn: async () => {
      if (!batch?.student_ids?.length) return [];
      const { data } = await supabase.from('users').select('id, name, email, avatar_url').in('id', batch.student_ids);
      return data ?? [];
    },
    enabled: !!batch,
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['batch_exams', batchId],
    queryFn: async () => {
      const { data } = await supabase.from('exams').select('id, title, scheduled_at, is_live, duration_minutes').overlaps('batch_ids', [batchId]).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['batch_assignments', batchId],
    queryFn: async () => {
      const { data } = await supabase.from('assignments').select('id, title, deadline, max_marks').eq('batch_id', batchId).order('deadline', { ascending: false });
      return data ?? [];
    },
  });

  const handleRemoveStudent = (studentId: string, name: string) => {
    Alert.alert('Remove Student', `Remove ${name} from this batch?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await supabase.rpc('remove_student', { p_batch_id: batchId, p_student_id: studentId });
          qc.invalidateQueries({ queryKey: ['batch_detail', batchId] });
          qc.invalidateQueries({ queryKey: ['batch_students', batchId] });
        },
      },
    ]);
  };

  if (isLoading) return <View style={s.center}><ActivityIndicator color="#3B82F6" /></View>;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.ADD_EDIT_BATCH, { batchId })} style={s.editBtn}>
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={s.batchInfo}>
        <Text style={s.batchName}>{batch?.name}</Text>
        <Text style={s.batchSub}>{batch?.subject} · {batch?.exam_category}</Text>
        <TouchableOpacity
          style={s.codeRow}
          onPress={() => Share.share({ message: `Join my batch on RankEdge!\nCode: ${batch?.join_code}` })}
        >
          <Text style={s.codeLabel}>Join Code: </Text>
          <Text style={s.code}>{batch?.join_code}</Text>
          <Text style={s.shareHint}> · tap to share</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[s.tab, tab === i && s.tabActive]} onPress={() => setTab(i)}>
            <Text style={[s.tabText, tab === i && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 0 && (
        <FlatList
          data={students}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.emptyText}>No students yet. Share the join code!</Text>}
          renderItem={({ item }) => (
            <View style={s.studentCard}>
              <View style={s.studentAvatar}>
                <Text style={s.studentAvatarText}>{item.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={s.studentInfo}>
                <Text style={s.studentName}>{item.name}</Text>
                <Text style={s.studentEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveStudent(item.id, item.name)} style={s.removeBtn}>
                <Text style={s.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {tab === 1 && (
        <FlatList
          data={exams}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.emptyText}>No exams for this batch</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.listCard} onPress={() => navigation.navigate(ROUTES.EXAM_RESULTS_OVERVIEW, { examId: item.id })}>
              <Text style={s.listTitle}>{item.title}</Text>
              <Text style={s.listSub}>{item.duration_minutes} min{item.scheduled_at ? ' · ' + new Date(item.scheduled_at).toLocaleDateString('en-IN') : ''}</Text>
              {item.is_live && <View style={s.livePill}><Text style={s.livePillText}>LIVE</Text></View>}
            </TouchableOpacity>
          )}
        />
      )}

      {tab === 2 && (
        <FlatList
          data={assignments}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.emptyText}>No assignments yet</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.listCard} onPress={() => navigation.navigate(ROUTES.ASSIGNMENT_SUBMISSIONS, { assignmentId: item.id })}>
              <Text style={s.listTitle}>{item.title}</Text>
              <Text style={s.listSub}>Due: {new Date(item.deadline).toLocaleDateString('en-IN')} · {item.max_marks} marks</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  back: {},
  backText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  editBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 13 },
  batchInfo: { paddingHorizontal: 20, paddingBottom: 16 },
  batchName: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  batchSub: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  codeLabel: { fontSize: 13, color: '#6B7280' },
  code: { fontSize: 15, fontWeight: '800', color: '#3B82F6', letterSpacing: 1 },
  shareHint: { fontSize: 12, color: '#4B5563' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937' },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  emptyText: { color: '#4B5563', textAlign: 'center', marginTop: 40 },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 12, gap: 12 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#F9FAFB' },
  studentEmail: { fontSize: 12, color: '#6B7280' },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#7F1D1D' },
  removeBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  listCard: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#F9FAFB', marginBottom: 4 },
  listSub: { fontSize: 12, color: '#6B7280' },
  livePill: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#064E3B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  livePillText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
});

export default BatchDetailScreen;
