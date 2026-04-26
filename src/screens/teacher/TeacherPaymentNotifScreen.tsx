import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/constants';

type PaymentNotif = {
  id: string;
  payment_id: string;
  student_id: string;
  batch_id: string;
  amount: number;
  upi_reference: string | null;
  slip_image_url: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  users?: { name: string };
  batches?: { name: string };
};

const TeacherPaymentNotifScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: notifs = [], isLoading, refetch } = useQuery({
    queryKey: ['payment_notifs', user?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from('payment_notifications')
        .select('*, users!student_id(name), batches(name)')
        .eq('teacher_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50) as any) as { data: PaymentNotif[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: async (notif: PaymentNotif) => {
      const db = supabase as any;
      // Mark payment PAID
      const { error: pErr } = await db
        .from('payments')
        .update({
          status: 'PAID',
          paid_at: new Date().toISOString(),
          upi_reference: notif.upi_reference,
          slip_image_url: notif.slip_image_url,
        })
        .eq('id', notif.payment_id);
      if (pErr) throw pErr;
      // Mark notification read
      await db.from('payment_notifications').update({ is_read: true }).eq('id', notif.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment_notifs'] });
      qc.invalidateQueries({ queryKey: ['teacher_payments'] });
      Alert.alert('✓ Approved', 'Payment has been marked as PAID and slip recorded.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (notifId: string) => {
      const db = supabase as any;
      await db.from('payment_notifications').update({ is_read: true }).eq('id', notifId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_notifs'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const handleApprove = (notif: PaymentNotif) => {
    Alert.alert(
      'Approve Payment?',
      `Mark ₹${notif.amount.toLocaleString('en-IN')} from ${(notif.users as any)?.name ?? 'student'} as PAID?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve ✓', style: 'default', onPress: () => approveMutation.mutate(notif) },
      ]
    );
  };

  const handleReject = (notifId: string) => {
    Alert.alert(
      'Dismiss?',
      'This will dismiss the notification without marking it paid.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Dismiss', style: 'destructive', onPress: () => rejectMutation.mutate(notifId) },
      ]
    );
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <View style={s.titleRow}>
          <Text style={s.heading}>Payment Requests</Text>
          {unread > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🔔</Text>
              <Text style={s.emptyTitle}>No payment requests yet</Text>
              <Text style={s.emptySub}>When students pay and upload their slip, you'll see it here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.card, !item.is_read && s.cardUnread]}>
              {!item.is_read && <View style={s.unreadDot} />}

              <View style={s.cardHeader}>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarLetter}>{(item.users as any)?.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.studentName}>{(item.users as any)?.name ?? 'Student'}</Text>
                  <Text style={s.batchName}>{(item.batches as any)?.name ?? 'Batch'}</Text>
                </View>
                <Text style={s.amount}>₹{item.amount.toLocaleString('en-IN')}</Text>
              </View>

              <Text style={s.message}>{item.message}</Text>

              {item.upi_reference ? (
                <View style={s.refRow}>
                  <Text style={s.refLabel}>UPI Ref:</Text>
                  <Text style={s.refValue}>{item.upi_reference}</Text>
                </View>
              ) : null}

              {item.slip_image_url ? (
                <TouchableOpacity
                  style={s.slipBtn}
                  onPress={() => nav.navigate(ROUTES.PAYMENT_SLIP, { imageUrl: item.slip_image_url, amount: item.amount, studentName: (item.users as any)?.name })}
                >
                  <Text style={s.slipBtnText}>📎 View Payment Slip</Text>
                </TouchableOpacity>
              ) : null}

              <Text style={s.timeText}>{new Date(item.created_at).toLocaleString('en-IN')}</Text>

              {!item.is_read && (
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={s.rejectBtn}
                    onPress={() => handleReject(item.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <Text style={s.rejectBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.approveBtn}
                    onPress={() => handleApprove(item)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.approveBtnText}>✓ Mark as Paid</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}

              {item.is_read && (
                <View style={s.processedBadge}>
                  <Text style={s.processedText}>Processed</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  badge: { backgroundColor: '#7C3AED', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 48, gap: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#475569', textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  cardUnread: { borderColor: '#6366F1', borderWidth: 1.5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', alignSelf: 'flex-end', marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#312E81', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#A5B4FC', fontWeight: '800', fontSize: 16 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  batchName: { fontSize: 12, color: '#64748B', marginTop: 1 },
  amount: { fontSize: 20, fontWeight: '900', color: '#10B981' },
  message: { fontSize: 13, color: '#94A3B8', marginBottom: 10, lineHeight: 18 },
  refRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  refLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  refValue: { fontSize: 12, color: '#A5B4FC', fontWeight: '700', flex: 1 },
  slipBtn: {
    backgroundColor: '#1E3A5F', borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#3B82F6',
  },
  slipBtnText: { color: '#60A5FA', fontWeight: '700', fontSize: 13 },
  timeText: { fontSize: 11, color: '#475569', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#475569',
  },
  rejectBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  approveBtn: {
    flex: 2, backgroundColor: '#10B981', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  processedBadge: {
    backgroundColor: '#064E3B', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#10B981',
  },
  processedText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
});

export default TeacherPaymentNotifScreen;
