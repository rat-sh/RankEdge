import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/constants';

const PaymentHistoryScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['payment_history', user?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from('payments')
        .select('id, amount, status, due_date, paid_at, batch_id, slip_image_url, upi_reference, batches(name, subject)')
        .eq('student_id', user!.id)
        .order('paid_at', { ascending: false }) as any) as { data: any[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  const paid = payments.filter(p => p.status === 'PAID');
  const totalPaid = paid.reduce((s, p) => s + (p.amount ?? 0), 0);
  const STATUS_COLOR: Record<string, string> = { PAID: '#10B981', DUE: '#F59E0B', OVERDUE: '#EF4444' };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Payment History</Text>
      </View>

      <View style={s.summary}>
        <Text style={s.summaryLabel}>Total Paid</Text>
        <Text style={s.summaryVal}>₹{totalPaid.toLocaleString('en-IN')}</Text>
        <Text style={s.summarySub}>{paid.length} transaction{paid.length !== 1 ? 's' : ''}</Text>
      </View>

      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList data={payments} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No payment records</Text>}
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={[s.statusDot, { backgroundColor: STATUS_COLOR[item.status] ?? '#6B7280' }]} />
              <View style={s.rowBody}>
                <Text style={s.rowBatch}>{(item.batches as any)?.name ?? 'Batch'}</Text>
                <Text style={s.rowDate}>{item.paid_at ? `Paid ${new Date(item.paid_at).toLocaleDateString('en-IN')}` : `Due ${new Date(item.due_date).toLocaleDateString('en-IN')}`}</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={[s.rowAmount, { color: item.status === 'PAID' ? '#10B981' : STATUS_COLOR[item.status] }]}>₹{item.amount?.toLocaleString('en-IN')}</Text>
                <Text style={[s.rowStatus, { color: STATUS_COLOR[item.status] ?? '#6B7280' }]}>{item.status}</Text>
                {item.status === 'PAID' && item.slip_image_url ? (
                  <TouchableOpacity
                    onPress={() => nav.navigate(ROUTES.PAYMENT_SLIP, {
                      imageUrl: item.slip_image_url,
                      amount: item.amount,
                      batchName: (item.batches as any)?.name,
                      paidAt: item.paid_at,
                      upiReference: item.upi_reference,
                    })}
                  >
                    <Text style={s.receiptLink}>📄 Receipt</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
  back: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 22, fontWeight: '800', color: '#F9FAFB' },
  summary: { backgroundColor: '#064E3B', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#10B981' },
  summaryLabel: { fontSize: 12, color: '#A7F3D0', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  summaryVal: { fontSize: 36, fontWeight: '900', color: '#10B981', marginBottom: 4 },
  summarySub: { fontSize: 12, color: '#6EE7B7' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 6 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  row: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, gap: 12, alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  rowBody: { flex: 1 },
  rowBatch: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', marginBottom: 2 },
  rowDate: { fontSize: 11, color: '#6B7280' },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  rowStatus: { fontSize: 10, fontWeight: '700' },
  receiptLink: { fontSize: 10, color: '#60A5FA', fontWeight: '700', marginTop: 4 },
});

export default PaymentHistoryScreen;
