import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView,
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const UpiSetupScreen = () => {
  const nav = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();

  const [upiId, setUpiId] = useState(user?.upi_id ?? '');
  const [qrUri, setQrUri] = useState<string | null>(user?.upi_qr_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refresh from DB on mount so we always show latest
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from('users').select('upi_id, upi_qr_url').eq('id', user!.id).single() as any);
      if (data) {
        setUpiId(data.upi_id ?? '');
        setQrUri(data.upi_qr_url ?? null);
      }
    })();
  }, []);

  const pickQr = async (fromCamera: boolean) => {
    const fn = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await fn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    await uploadQr(result.assets[0].uri);
  };

  const uploadQr = async (uri: string) => {
    setUploading(true);
    try {
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `upi_qr/${user!.id}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, {
        upsert: true,
        contentType: `image/${ext}`,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      setQrUri(urlData.publicUrl + `?t=${Date.now()}`);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!qrUri) {
      Alert.alert('Missing QR', 'Please upload your UPI QR code first.');
      return;
    }
    setSaving(true);
    const db = supabase as any;
    try {
      const { error } = await db.from('users').update({ upi_id: upiId.trim(), upi_qr_url: qrUri }).eq('id', user!.id);
      if (error) throw error;
      // Patch the local Zustand store so UI is immediately consistent
      useAuthStore.setState(s => {
        if (s.user) {
          s.user.upi_id = upiId.trim();
          s.user.upi_qr_url = qrUri ?? undefined;
        }
      });
      qc.invalidateQueries({ queryKey: ['teacher_payments'] });
      qc.invalidateQueries({ queryKey: ['teacher_upi_status'] });
      Alert.alert('Saved ✓', 'Your UPI QR has been updated. Students can now pay you!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.heading}>UPI Payment Setup</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={s.infoBanner}>
          <Text style={s.infoIcon}>💡</Text>
          <Text style={s.infoText}>
            Upload your UPI QR code (GPay, PhonePe, Paytm, BHIM, any app). Students will scan it to pay and submit a payment slip. You'll get notified instantly.
          </Text>
        </View>

        {/* QR Preview / Upload */}
        <Text style={s.sectionLabel}>Your UPI QR Code</Text>
        <View style={s.qrContainer}>
          {uploading ? (
            <View style={s.qrPlaceholder}>
              <ActivityIndicator color="#6366F1" size="large" />
              <Text style={s.qrPlaceholderText}>Uploading QR...</Text>
            </View>
          ) : qrUri ? (
            <View>
              <Image source={{ uri: qrUri }} style={s.qrImage} resizeMode="contain" />
              <View style={s.qrReadyBadge}>
                <Text style={s.qrReadyText}>✓ QR Ready</Text>
              </View>
            </View>
          ) : (
            <View style={s.qrPlaceholder}>
              <Text style={s.qrEmoji}>📱</Text>
              <Text style={s.qrPlaceholderText}>No QR uploaded yet</Text>
              <Text style={s.qrPlaceholderSub}>Upload from your payments app</Text>
            </View>
          )}
        </View>

        {/* Upload Buttons */}
        <View style={s.uploadRow}>
          <TouchableOpacity style={s.uploadBtn} onPress={() => pickQr(false)} disabled={uploading}>
            <Text style={s.uploadBtnIcon}>🖼️</Text>
            <Text style={s.uploadBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.uploadBtn} onPress={() => pickQr(true)} disabled={uploading}>
            <Text style={s.uploadBtnIcon}>📷</Text>
            <Text style={s.uploadBtnText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {/* UPI ID (optional text fallback) */}
        <Text style={s.sectionLabel}>UPI ID <Text style={s.optional}>(optional – text fallback)</Text></Text>
        <TextInput
          style={s.input}
          value={upiId}
          onChangeText={setUpiId}
          placeholder="yourname@upi or 9876543210@paytm"
          placeholderTextColor="#475569"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Supported Apps */}
        <Text style={s.sectionLabel}>Works with all UPI apps</Text>
        <View style={s.appsRow}>
          {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay', 'Others'].map(app => (
            <View key={app} style={s.appChip}>
              <Text style={s.appChipText}>{app}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <View style={s.howItWorks}>
          <Text style={s.howTitle}>How it works</Text>
          {[
            { n: '1', t: 'You upload your UPI QR here' },
            { n: '2', t: 'Student opens Fee Payment → sees your QR' },
            { n: '3', t: 'Student pays via any UPI app' },
            { n: '4', t: 'Student uploads payment screenshot as slip' },
            { n: '5', t: 'You get notified & payment is marked PAID' },
          ].map(step => (
            <View key={step.n} style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{step.n}</Text></View>
              <Text style={s.stepText}>{step.t}</Text>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[s.saveBtn, (saving || uploading) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || uploading}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>Save UPI Settings</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {},
  backText: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  infoBanner: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#334155', marginBottom: 24,
  },
  infoIcon: { fontSize: 20, marginTop: 2 },
  infoText: { flex: 1, color: '#94A3B8', fontSize: 13, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  optional: { fontSize: 11, color: '#475569', textTransform: 'none', fontWeight: '400' },
  qrContainer: {
    backgroundColor: '#1E293B', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#334155',
  },
  qrImage: { width: 200, height: 200, borderRadius: 12 },
  qrReadyBadge: {
    backgroundColor: '#064E3B', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 6, alignSelf: 'center', marginTop: 12, borderWidth: 1, borderColor: '#10B981',
  },
  qrReadyText: { color: '#10B981', fontWeight: '800', fontSize: 13 },
  qrPlaceholder: { alignItems: 'center', paddingVertical: 20 },
  qrEmoji: { fontSize: 48, marginBottom: 12 },
  qrPlaceholderText: { color: '#94A3B8', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  qrPlaceholderSub: { color: '#475569', fontSize: 12 },
  uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  uploadBtn: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#6366F1', gap: 6,
  },
  uploadBtnIcon: { fontSize: 24 },
  uploadBtnText: { color: '#A5B4FC', fontWeight: '700', fontSize: 14 },
  input: {
    backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: '#F1F5F9', fontSize: 15, borderWidth: 1,
    borderColor: '#334155', marginBottom: 24,
  },
  appsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  appChip: {
    backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, borderWidth: 1, borderColor: '#334155',
  },
  appChipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  howItWorks: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155', marginBottom: 28,
  },
  howTitle: { fontSize: 14, fontWeight: '800', color: '#F1F5F9', marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#312E81',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#A5B4FC', fontWeight: '800', fontSize: 13 },
  stepText: { color: '#94A3B8', fontSize: 13, flex: 1 },
  saveBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default UpiSetupScreen;
