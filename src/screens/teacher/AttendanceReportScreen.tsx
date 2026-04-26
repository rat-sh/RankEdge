import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

type Record_ = { id: string; status: string; timestamp: string; class_id: string; users?: { name: string } };

const AttendanceReportScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params as { batchId: string };
  const [view, setView] = useState<'student' | 'class'>('student');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance_report', batchId],
    queryFn: async () => {
      const { data } = await (supabase.from('attendance').select('id, status, timestamp, class_id, student_id, users(name)').eq('batch_id', batchId).order('timestamp', { ascending: false }) as any) as { data: any[] };
      const records = data ?? [];
      // Group by student
      const byStudent: Record<string, { name: string; total: number; present: number; late: number; absent: number }> = {};
      records.forEach((r: any) => {
        const name = r.users?.name ?? 'Unknown';
        if (!byStudent[r.student_id]) byStudent[r.student_id] = { name, total: 0, present: 0, late: 0, absent: 0 };
        byStudent[r.student_id].total++;
        if (r.status === 'PRESENT') byStudent[r.student_id].present++;
        if (r.status === 'LATE') byStudent[r.student_id].late++;
        if (r.status === 'ABSENT') byStudent[r.student_id].absent++;
      });
      return { records, byStudent: Object.values(byStudent) };
    },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Attendance Report</Text>
      </View>
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, view === 'student' && s.tabActive]} onPress={() => setView('student')}>
          <Text style={[s.tabText, view === 'student' && s.tabTextActive]}>By Student</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, view === 'class' && s.tabActive]} onPress={() => setView('class')}>
          <Text style={[s.tabText, view === 'class' && s.tabTextActive]}>All Records</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : view === 'student' ? (
        <FlatList
          data={data?.byStudent}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No attendance records</Text>}
          renderItem={({ item }) => {
            const pct = item.total ? Math.round((item.present / item.total) * 100) : 0;
            return (
              <View style={s.card}>
                <View style={s.cardTop}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={[s.pct, { color: pct >= 75 ? '#10B981' : '#EF4444' }]}>{pct}%</Text>
                </View>
                <View style={s.bar}>
                  <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: pct >= 75 ? '#10B981' : '#EF4444' }]} />
                </View>
                <Text style={s.breakdown}>{item.present}P · {item.late}L · {item.absent}A / {item.total}</Text>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={data?.records}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={s.list}
          renderItem={({ item }: any) => (
            <View style={s.record}>
              <Text style={s.recName}>{item.users?.name ?? 'Student'}</Text>
              <Text style={s.recDate}>{new Date(item.timestamp).toLocaleDateString('en-IN')}</Text>
              <Text style={[s.recStatus, { color: item.status === 'PRESENT' ? '#10B981' : item.status === 'LATE' ? '#F59E0B' : '#EF4444' }]}>{item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937' },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#F9FAFB' },
  pct: { fontSize: 18, fontWeight: '800' },
  bar: { height: 4, backgroundColor: '#374151', borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  breakdown: { fontSize: 11, color: '#6B7280' },
  record: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 10, padding: 12, alignItems: 'center' },
  recName: { flex: 1, fontSize: 13, color: '#F9FAFB', fontWeight: '600' },
  recDate: { fontSize: 12, color: '#6B7280', marginRight: 12 },
  recStatus: { fontSize: 12, fontWeight: '700', width: 70, textAlign: 'right' },
});

export default AttendanceReportScreen;
