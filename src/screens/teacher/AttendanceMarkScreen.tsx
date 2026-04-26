import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Student = { id: string; name: string };
type AttendanceMap = Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>;

const AttendanceMarkScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId, classId } = route.params as { batchId: string; classId?: string };
  const qc = useQueryClient();
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [saving, setSaving] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['batch_students_attendance', batchId],
    queryFn: async () => {
      const { data: batch } = await (supabase.from('batches').select('student_ids').eq('id', batchId).single() as any) as { data: any };
      if (!batch?.student_ids?.length) return [];
      const { data } = await (supabase.from('users').select('id, name').in('id', batch.student_ids) as any) as { data: Student[] };
      const init: AttendanceMap = {};
      (data ?? []).forEach(s => { init[s.id] = 'PRESENT'; });
      setAttendance(init);
      return data ?? [];
    },
  });

  const mark = (id: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendance(a => ({ ...a, [id]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        class_id: classId ?? 'manual', batch_id: batchId, student_id: s.id,
        status: attendance[s.id] ?? 'ABSENT', is_auto_marked: false,
      }));
      await (supabase.from('attendance') as any).insert(records);
      qc.invalidateQueries({ queryKey: ['attendance_report', batchId] });
      Alert.alert('Saved', 'Attendance marked!', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const STATUS_OPTIONS = ['PRESENT', 'LATE', 'ABSENT'] as const;
  const STATUS_COLORS: Record<string, string> = { PRESENT: '#10B981', LATE: '#F59E0B', ABSENT: '#EF4444' };
  const STATUS_BG: Record<string, string> = { PRESENT: '#064E3B', LATE: '#78350F', ABSENT: '#7F1D1D' };

  const counts = { P: Object.values(attendance).filter(v => v === 'PRESENT').length, L: Object.values(attendance).filter(v => v === 'LATE').length, A: Object.values(attendance).filter(v => v === 'ABSENT').length };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Mark Attendance</Text>
      </View>
      <View style={s.summary}>
        <Text style={[s.count, { color: '#10B981' }]}>P: {counts.P}</Text>
        <Text style={[s.count, { color: '#F59E0B' }]}>L: {counts.L}</Text>
        <Text style={[s.count, { color: '#EF4444' }]}>A: {counts.A}</Text>
        <Text style={s.countTotal}>/ {students.length}</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={students}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.row}>
              <Text style={s.name}>{item.name}</Text>
              <View style={s.statusBtns}>
                {STATUS_OPTIONS.map(st => (
                  <TouchableOpacity key={st} style={[s.stBtn, attendance[item.id] === st && { backgroundColor: STATUS_BG[st], borderColor: STATUS_COLORS[st] }]} onPress={() => mark(item.id, st)}>
                    <Text style={[s.stBtnText, attendance[item.id] === st && { color: STATUS_COLORS[st] }]}>{st[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}
      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving || students.length === 0}>
        <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Attendance'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  summary: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingBottom: 12, alignItems: 'center' },
  count: { fontSize: 18, fontWeight: '800' },
  countTotal: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 12 },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: '#F9FAFB' },
  statusBtns: { flexDirection: 'row', gap: 6 },
  stBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#374151' },
  stBtnText: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
  saveBtn: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default AttendanceMarkScreen;
