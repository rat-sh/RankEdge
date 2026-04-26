import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

type Payment = {
  id: string;
  student_id: string;
  batch_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  due_date: string;
  users?: { name: string };
  batches?: { name: string };
};

const TeacherPaymentsScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();

  // Payments summary
  const { data, isLoading } = useQuery({
    queryKey: ['teacher_payments', user?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from('payments')
        .select('id, student_id, batch_id, amount, status, paid_at, due_date, users(name), batches(name)')
        .eq('teacher_id', user!.id)
        .order('due_date', { ascending: true }) as any) as { data: Payment[] };
      const payments = data ?? [];
      const totalCollected = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
      const totalDue = payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0);
      return { payments, totalCollected, totalDue };
    },
    enabled: !!user,
  });

  // Unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['payment_notifs_count', user?.id],
    queryFn: async () => {
      const { count } = await (supabase
        .from('payment_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user!.id)
        .eq('is_read', false) as any) as { count: number };
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15000, // poll every 15s
  });

  // Check if UPI is set up
  const { data: upiSetup } = useQuery({
    queryKey: ['teacher_upi_status', user?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from('users')
        .select('upi_qr_url, upi_id')
        .eq('id', user!.id)
        .single() as any) as { data: { upi_qr_url: string | null; upi_id: string | null } };
      return data;
    },
    enabled: !!user,
  });

  const hasUpi = !!upiSetup?.upi_qr_url;

  const STATUS_COLOR: Record<string, string> = { PAID: '#10B981', DUE: '#F59E0B', OVERDUE: '#EF4444' };
  const STATUS_BG: Record<string, string> = { PAID: '#064E3B', DUE: '#78350F', OVERDUE: '#7F1D1D' };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={s.header}>
        <Text style={s.heading}>Fee & Payments</Text>
        <TouchableOpacity
          style={s.notifBtn}
          onPress={() => nav.navigate(ROUTES.TEACHER_PAYMENT_NOTIF)}
        >
          <Text style={s.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* UPI Setup CTA */}
      <TouchableOpacity
        style={[s.upiCta, hasUpi && s.upiCtaActive]}
        onPress={() => nav.navigate(ROUTES.UPI_SETUP)}
      >
        <Text style={s.upiCtaIcon}>{hasUpi ? '✅' : '📱'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.upiCtaTitle}>{hasUpi ? 'UPI QR Active' : 'Set Up UPI QR'}</Text>
          <Text style={s.upiCtaSub}>
            {hasUpi
              ? 'Students can pay you by scanning your QR'
              : 'Upload your GPay/PhonePe/Paytm QR so students can pay'}
          </Text>
        </View>
        <Text style={s.upiCtaArrow}>›</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {/* Summary */}
          <View style={s.summaryRow}>
            <View style={s.summaryCard}>
              <Text style={[s.summaryVal, { color: '#10B981' }]}>
                ₹{data?.totalCollected?.toLocaleString('en-IN')}
              </Text>
              <Text style={s.summaryLabel}>Collected</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={[s.summaryVal, { color: '#EF4444' }]}>
                ₹{data?.totalDue?.toLocaleString('en-IN')}
              </Text>
              <Text style={s.summaryLabel}>Pending</Text>
            </View>
          </View>

          {/* Pending requests highlight */}
          {unreadCount > 0 && (
            <TouchableOpacity
              style={s.pendingRequestsRow}
              onPress={() => nav.navigate(ROUTES.TEACHER_PAYMENT_NOTIF)}
            >
              <View style={s.pendingDot} />
              <Text style={s.pendingRequestsText}>
                {unreadCount} pending payment request{unreadCount !== 1 ? 's' : ''} awaiting your approval
              </Text>
              <Text style={s.pendingArrow}>›</Text>
            </TouchableOpacity>
          )}

          {/* Payment rows */}
          {data?.payments?.map(p => (
            <TouchableOpacity
              key={p.id}
              style={s.card}
              onPress={() => nav.navigate(ROUTES.STUDENT_FEE_DETAIL, { studentId: p.student_id, batchId: p.batch_id })}
            >
              <View style={s.cardTop}>
                <Text style={s.studentName}>{(p.users as any)?.name ?? 'Student'}</Text>
                <View style={[s.pill, { backgroundColor: STATUS_BG[p.status] }]}>
                  <Text style={[s.pillText, { color: STATUS_COLOR[p.status] }]}>{p.status}</Text>
                </View>
              </View>
              <Text style={s.batch}>{(p.batches as any)?.name ?? 'Batch'}</Text>
              <View style={s.cardBottom}>
                <Text style={s.amount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                <Text style={s.dueDate}>Due: {new Date(p.due_date).toLocaleDateString('en-IN')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  heading: { flex: 1, fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  notifBtn: { position: 'relative', padding: 6 },
  notifIcon: { fontSize: 22 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0, width: 18, height: 18,
    borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  upiCta: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1E293B',
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
    gap: 12, borderWidth: 1.5, borderColor: '#334155',
  },
  upiCtaActive: { borderColor: '#10B981', backgroundColor: '#064E3B22' },
  upiCtaIcon: { fontSize: 26 },
  upiCtaTitle: { fontSize: 14, fontWeight: '800', color: '#F1F5F9', marginBottom: 2 },
  upiCtaSub: { fontSize: 12, color: '#94A3B8' },
  upiCtaArrow: { fontSize: 22, color: '#64748B' },
  content: { padding: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryVal: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  pendingRequestsRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1A2E',
    borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#6366F1',
    gap: 10,
  },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  pendingRequestsText: { flex: 1, fontSize: 13, color: '#A5B4FC', fontWeight: '600' },
  pendingArrow: { fontSize: 18, color: '#6366F1' },
  card: { backgroundColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#F9FAFB' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700' },
  batch: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  dueDate: { fontSize: 12, color: '#9CA3AF' },
});

export default TeacherPaymentsScreen;
