import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Image, TextInput, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

// ─── Types ───────────────────────────────────────────────────────────────────
type Payment = {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  batch_id: string;
  teacher_id: string;
  batches?: { name: string; subject: string } | null;
};

type TeacherUpi = {
  teacher_id: string;
  upi_qr_url: string | null;
  upi_id: string | null;
  teacher_name: string;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const FeePaymentScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Payment to pay right now
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [slipUri, setSlipUri] = useState<string | null>(null);
  const [upiRef, setUpiRef] = useState('');
  const [uploading, setUploading] = useState(false);

  // ── Fetch student payments ──────────────────────────────────────────────────
  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['student_fees', user?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from('payments')
        .select('id, amount, status, due_date, paid_at, batch_id, teacher_id, batches(name, subject)')
        .eq('student_id', user!.id)
        .order('due_date', { ascending: true }) as any) as { data: Payment[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  // ── Fetch teacher UPI info (deduplicated by teacher_id) ────────────────────
  const teacherIds = [...new Set(payments.map(p => p.teacher_id).filter(Boolean))];
  const { data: teacherUpis = [] } = useQuery({
    queryKey: ['teacher_upis', teacherIds.join(',')],
    queryFn: async () => {
      if (!teacherIds.length) return [];
      const { data } = await (supabase
        .from('users')
        .select('id, name, upi_qr_url, upi_id')
        .in('id', teacherIds) as any) as { data: any[] };
      return (data ?? []).map((t: any): TeacherUpi => ({
        teacher_id: t.id,
        upi_qr_url: t.upi_qr_url,
        upi_id: t.upi_id,
        teacher_name: t.name,
      }));
    },
    enabled: teacherIds.length > 0,
  });

  const getTeacherUpi = (teacherId: string) =>
    teacherUpis.find(t => t.teacher_id === teacherId);

  // ── Submit payment slip ─────────────────────────────────────────────────────
  const submitSlipMutation = useMutation({
    mutationFn: async ({ payment, slipUrl }: { payment: Payment; slipUrl: string }) => {
      const db = supabase as any;

      // Update payment record
      const { error: pErr } = await db
        .from('payments')
        .update({
          status: 'PAID',
          paid_at: new Date().toISOString(),
          slip_image_url: slipUrl,
          upi_reference: upiRef.trim() || null,
        })
        .eq('id', payment.id);
      if (pErr) throw pErr;

      // Create notification for teacher
      const { error: nErr } = await db
        .from('payment_notifications')
        .insert({
          teacher_id: payment.teacher_id,
          payment_id: payment.id,
          student_id: user!.id,
          batch_id: payment.batch_id,
          amount: payment.amount,
          upi_reference: upiRef.trim() || null,
          slip_image_url: slipUrl,
          message: `${user!.name} has submitted a payment of ₹${payment.amount.toLocaleString('en-IN')} for ${(payment.batches as any)?.name ?? 'batch'}. Please verify and approve.`,
          is_read: false,
        });
      if (nErr) throw nErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student_fees'] });
      qc.invalidateQueries({ queryKey: ['payment_history'] });
      setModalVisible(false);
      setSelectedPayment(null);
      setSlipUri(null);
      setUpiRef('');
      Alert.alert(
        '✓ Payment Submitted!',
        'Your payment slip has been sent to the teacher. They will verify and mark you as paid.'
      );
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  // ── Pick slip image ─────────────────────────────────────────────────────────
  const pickSlip = async (fromCamera: boolean) => {
    const fn = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await fn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled) return;
    setSlipUri(result.assets[0].uri);
  };

  const uploadSlipAndSubmit = async () => {
    if (!slipUri || !selectedPayment) return;
    setUploading(true);
    try {
      const ext = slipUri.split('.').pop() ?? 'jpg';
      const path = `payment_slips/${selectedPayment.id}_${Date.now()}.${ext}`;
      const response = await fetch(slipUri);
      const blob = await response.blob();
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, {
        upsert: true,
        contentType: `image/${ext}`,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await submitSlipMutation.mutateAsync({ payment: selectedPayment, slipUrl: urlData.publicUrl });
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const openPayModal = (p: Payment) => {
    setSelectedPayment(p);
    setSlipUri(null);
    setUpiRef('');
    setModalVisible(true);
  };

  const pending = payments.filter(p => p.status !== 'PAID');
  const totalDue = pending.reduce((s, p) => s + (p.amount ?? 0), 0);
  const STATUS_COLOR: Record<string, string> = { PAID: '#10B981', DUE: '#F59E0B', OVERDUE: '#EF4444' };
  const STATUS_BG: Record<string, string> = { PAID: '#064E3B', DUE: '#78350F', OVERDUE: '#7F1D1D' };

  const selectedTeacher = selectedPayment ? getTeacherUpi(selectedPayment.teacher_id) : null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={s.header}>
        <Text style={s.heading}>Fee Payment</Text>
        <TouchableOpacity style={s.historyBtn} onPress={() => nav.navigate(ROUTES.PAYMENT_HISTORY)}>
          <Text style={s.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      {totalDue > 0 && (
        <View style={s.dueBanner}>
          <Text style={s.dueBannerLabel}>Total Due</Text>
          <Text style={s.dueBannerAmount}>₹{totalDue.toLocaleString('en-IN')}</Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {payments.length === 0 && <Text style={s.empty}>No fee records</Text>}
          {payments.map(p => {
            const tUpi = getTeacherUpi(p.teacher_id);
            const hasQr = !!tUpi?.upi_qr_url;
            return (
              <View key={p.id} style={s.card}>
                <View style={s.cardTop}>
                  <View>
                    <Text style={s.batchName}>{(p.batches as any)?.name ?? 'Batch'}</Text>
                    <Text style={s.subject}>{(p.batches as any)?.subject}</Text>
                  </View>
                  <View style={[s.pill, { backgroundColor: STATUS_BG[p.status] }]}>
                    <Text style={[s.pillText, { color: STATUS_COLOR[p.status] }]}>{p.status}</Text>
                  </View>
                </View>

                <Text style={s.amount}>₹{p.amount?.toLocaleString('en-IN')}</Text>
                <Text style={s.dueDate}>Due: {new Date(p.due_date).toLocaleDateString('en-IN')}</Text>
                {p.paid_at && <Text style={s.paidDate}>Paid: {new Date(p.paid_at).toLocaleDateString('en-IN')}</Text>}

                {p.status !== 'PAID' && (
                  <View>
                    {!hasQr && (
                      <View style={s.noQrBanner}>
                        <Text style={s.noQrText}>⏳ Teacher hasn't set up UPI yet</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[s.payBtn, !hasQr && { opacity: 0.5 }]}
                      onPress={() => hasQr ? openPayModal(p) : Alert.alert('Not ready', 'The teacher has not uploaded their UPI QR yet.')}
                    >
                      <Text style={s.payBtnText}>
                        {hasQr ? '📱 Pay via UPI' : 'UPI Not Set Up'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {p.status === 'PAID' && (
                  <TouchableOpacity
                    style={s.viewSlipBtn}
                    onPress={() => nav.navigate(ROUTES.PAYMENT_SLIP, {
                      imageUrl: (p as any).slip_image_url ?? '',
                      amount: p.amount,
                      studentName: user?.name,
                      batchName: (p.batches as any)?.name,
                      paidAt: p.paid_at,
                      upiReference: (p as any).upi_reference,
                    })}
                  >
                    <Text style={s.viewSlipBtnText}>📄 View Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Payment Modal ────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.sheetHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={m.title}>Pay ₹{selectedPayment?.amount.toLocaleString('en-IN')}</Text>
              <Text style={m.subtitle}>{(selectedPayment?.batches as any)?.name ?? 'Batch'}</Text>

              {/* Teacher QR */}
              {selectedTeacher?.upi_qr_url ? (
                <View style={m.qrBox}>
                  <Text style={m.qrLabel}>Scan to Pay</Text>
                  <Image source={{ uri: selectedTeacher.upi_qr_url }} style={m.qrImage} resizeMode="contain" />
                  <Text style={m.qrNote}>Open GPay, PhonePe, Paytm or any UPI app and scan</Text>

                  {selectedTeacher.upi_id ? (
                    <TouchableOpacity
                      style={m.upiIdRow}
                      onPress={() => {
                        Clipboard.setStringAsync(selectedTeacher.upi_id!);
                        Alert.alert('Copied!', 'UPI ID copied to clipboard');
                      }}
                    >
                      <Text style={m.upiIdLabel}>UPI ID:</Text>
                      <Text style={m.upiIdText}>{selectedTeacher.upi_id}</Text>
                      <Text style={m.upiIdCopy}>Copy</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* UPI Reference */}
              <Text style={m.sectionLabel}>UPI Transaction ID <Text style={m.optional}>(optional)</Text></Text>
              <TextInput
                style={m.input}
                value={upiRef}
                onChangeText={setUpiRef}
                placeholder="e.g. 412345678901"
                placeholderTextColor="#475569"
                keyboardType="default"
              />

              {/* Upload Slip */}
              <Text style={m.sectionLabel}>Upload Payment Screenshot <Text style={m.required}>*</Text></Text>
              {slipUri ? (
                <View style={m.slipPreview}>
                  <Image source={{ uri: slipUri }} style={m.slipImg} resizeMode="contain" />
                  <TouchableOpacity style={m.changeSlipBtn} onPress={() => setSlipUri(null)}>
                    <Text style={m.changeSlipText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={m.uploadRow}>
                  <TouchableOpacity style={m.uploadBtn} onPress={() => pickSlip(false)}>
                    <Text style={m.uploadIcon}>🖼️</Text>
                    <Text style={m.uploadBtnText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={m.uploadBtn} onPress={() => pickSlip(true)}>
                    <Text style={m.uploadIcon}>📷</Text>
                    <Text style={m.uploadBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={m.actionRow}>
                <TouchableOpacity
                  style={m.cancelBtn}
                  onPress={() => { setModalVisible(false); setSelectedPayment(null); setSlipUri(null); }}
                >
                  <Text style={m.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[m.submitBtn, (!slipUri || uploading) && { opacity: 0.5 }]}
                  onPress={uploadSlipAndSubmit}
                  disabled={!slipUri || uploading}
                >
                  {uploading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={m.submitBtnText}>Submit Payment</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { flex: 1, fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  historyBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  historyBtnText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  dueBanner: { marginHorizontal: 16, backgroundColor: '#7F1D1D', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#EF4444' },
  dueBannerLabel: { fontSize: 14, color: '#FCA5A5', fontWeight: '600' },
  dueBannerAmount: { fontSize: 22, color: '#FCA5A5', fontWeight: '900' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  batchName: { fontSize: 15, fontWeight: '700', color: '#F9FAFB' },
  subject: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700' },
  amount: { fontSize: 28, fontWeight: '900', color: '#F9FAFB', marginBottom: 6 },
  dueDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  paidDate: { fontSize: 12, color: '#10B981', marginBottom: 8 },
  noQrBanner: { backgroundColor: '#1E1A2E', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: '#4C1D95' },
  noQrText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  payBtn: { backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  viewSlipBtn: { backgroundColor: '#1E293B', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#334155' },
  viewSlipBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1E293B', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '92%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#F8FAFC', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  qrBox: {
    backgroundColor: '#0F172A', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#334155',
  },
  qrLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  qrImage: { width: 220, height: 220, borderRadius: 12, backgroundColor: '#fff' },
  qrNote: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 12 },
  upiIdRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginTop: 12, borderWidth: 1, borderColor: '#334155', gap: 6,
  },
  upiIdLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  upiIdText: { flex: 1, fontSize: 13, color: '#A5B4FC', fontWeight: '700' },
  upiIdCopy: { fontSize: 12, color: '#6366F1', fontWeight: '800' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  optional: { fontSize: 11, color: '#475569', textTransform: 'none', fontWeight: '400' },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: '#F1F5F9', fontSize: 15,
    borderWidth: 1, borderColor: '#334155', marginBottom: 16,
  },
  uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  uploadBtn: {
    flex: 1, backgroundColor: '#0F172A', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#6366F1', gap: 6,
  },
  uploadIcon: { fontSize: 24 },
  uploadBtnText: { color: '#A5B4FC', fontWeight: '700', fontSize: 14 },
  slipPreview: { alignItems: 'center', marginBottom: 20 },
  slipImg: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#0F172A' },
  changeSlipBtn: { marginTop: 10, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 20 },
  changeSlipText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8, paddingBottom: 16 },
  cancelBtn: { flex: 1, backgroundColor: '#0F172A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  cancelBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 15 },
  submitBtn: { flex: 2, backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default FeePaymentScreen;
