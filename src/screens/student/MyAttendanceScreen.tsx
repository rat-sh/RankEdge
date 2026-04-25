import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

type AttendanceRecord = {
  id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  timestamp: string;
  class_id: string;
  batch_id: string;
};

const MyAttendanceScreen = () => {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['my_attendance', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('id, status, timestamp, class_id, batch_id')
        .eq('student_id', user!.id)
        .order('timestamp', { ascending: false });
      const records = (data ?? []) as AttendanceRecord[];
      const present = records.filter(r => r.status === 'PRESENT').length;
      const pct = records.length ? Math.round((present / records.length) * 100) : 0;
      return { records, present, total: records.length, pct };
    },
    enabled: !!user,
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}><Text style={s.heading}>My Attendance</Text></View>
      {isLoading ? (
        <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={s.summaryCard}>
            <Text style={[s.pct, { color: (data?.pct ?? 0) >= 75 ? '#10B981' : '#EF4444' }]}>
              {data?.pct ?? 0}%
            </Text>
            <Text style={s.pctLabel}>Overall Attendance</Text>
            <Text style={s.pctSub}>{data?.present ?? 0} present out of {data?.total ?? 0} classes</Text>
          </View>
          <FlatList
            data={data?.records}
            keyExtractor={i => i.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={<Text style={s.empty}>No attendance records yet</Text>}
            renderItem={({ item }) => (
              <View style={s.row}>
                <View style={[s.statusDot, {
                  backgroundColor: item.status === 'PRESENT' ? '#10B981' : item.status === 'LATE' ? '#F59E0B' : '#EF4444',
                }]} />
                <Text style={s.rowDate}>
                  {new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Text style={[s.rowStatus, {
                  color: item.status === 'PRESENT' ? '#10B981' : item.status === 'LATE' ? '#F59E0B' : '#EF4444',
                }]}>
                  {item.status}
                </Text>
              </View>
            )}
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
  summaryCard: { margin: 16, backgroundColor: '#1F2937', borderRadius: 20, padding: 24, alignItems: 'center' },
  pct: { fontSize: 48, fontWeight: '900', marginBottom: 4 },
  pctLabel: { fontSize: 14, color: '#F9FAFB', fontWeight: '700', marginBottom: 4 },
  pctSub: { fontSize: 13, color: '#6B7280' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 6 },
  empty: { color: '#4B5563', textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 10, padding: 12, gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  rowDate: { flex: 1, fontSize: 13, color: '#9CA3AF' },
  rowStatus: { fontSize: 13, fontWeight: '700' },
});

export default MyAttendanceScreen;
