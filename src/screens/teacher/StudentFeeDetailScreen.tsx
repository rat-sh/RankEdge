import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const StudentFeeDetailScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { studentId, batchId } = route.params as { studentId: string; batchId: string };

  const { data, isLoading } = useQuery({
    queryKey: ['student_fee_detail', studentId, batchId],
    queryFn: async () => {
      const [studentRes, paymentsRes] = await Promise.all([
        supabase.from('users').select('name, email').eq('id', studentId).single() as any,
        supabase.from('payments').select('*').eq('student_id', studentId).eq('batch_id', batchId).order('due_date', { ascending: false }) as any,
      ]);
      return { student: studentRes.data as any, payments: (paymentsRes.data ?? []) as any[] };
    },
  });

  const STATUS_COLOR: Record<string, string> = { PAID: '#10B981', DUE: '#F59E0B', OVERDUE: '#EF4444' };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <View>
          <Text style={s.heading}>{data?.student?.name ?? 'Student'}</Text>
          <Text style={s.sub}>{data?.student?.email}</Text>
        </View>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={data?.payments}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No payment records</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.amount}>₹{item.amount?.toLocaleString('en-IN')}</Text>
                <View style={[s.pill, { backgroundColor: item.status === 'PAID' ? '#064E3B' : item.status === 'OVERDUE' ? '#7F1D1D' : '#78350F' }]}>
                  <Text style={[s.pillText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.due}>Due: {new Date(item.due_date).toLocaleDateString('en-IN')}</Text>
              {item.paid_at && <Text style={s.paid}>Paid: {new Date(item.paid_at).toLocaleDateString('en-IN')}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 12 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  sub: { fontSize: 13, color: '#6B7280' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  amount: { fontSize: 22, fontWeight: '800', color: '#F9FAFB' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700' },
  due: { fontSize: 12, color: '#9CA3AF' },
  paid: { fontSize: 12, color: '#10B981', marginTop: 2 },
});

export default StudentFeeDetailScreen;
