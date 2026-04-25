import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Alert, TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { validateExamSession } from '@/services/exam';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const StudentExamsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [tokenModal, setTokenModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [token, setToken] = useState('');
  const [validating, setValidating] = useState(false);

  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ['student_exams', user?.id],
    queryFn: async () => {
      const { data: profile } = await (supabase
        .from('users')
        .select('batch_ids')
        .eq('id', user!.id)
        .single() as any) as { data: { batch_ids: string[] } | null };

      if (!profile?.batch_ids?.length) return [];

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .overlaps('batch_ids', profile.batch_ids)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleEnterExam = (exam: any) => {
    if (!exam.is_live) {
      Alert.alert('Not Live', 'This exam session has not started yet. Wait for your teacher to start it.');
      return;
    }
    setSelectedExam(exam);
    setToken('');
    setTokenModal(true);
  };

  const handleValidateToken = async () => {
    if (token.trim().length < 6) {
      Alert.alert('Error', 'Enter the session token from your teacher');
      return;
    }
    setValidating(true);
    try {
      const valid = await validateExamSession(selectedExam.id, token.trim());
      if (valid) {
        setTokenModal(false);
        navigation.navigate(ROUTES.TAKE_EXAM, { examId: selectedExam.id });
      } else {
        Alert.alert('Invalid Token', 'The token is incorrect or session has expired.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setValidating(false);
    }
  };

  const renderExam = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.badge, item.is_live && s.badgeLive]}>
          <Text style={[s.badgeText, item.is_live && s.badgeTextLive]}>
            {item.is_live ? '● LIVE' : 'Upcoming'}
          </Text>
        </View>
        <Text style={s.duration}>{item.duration_minutes} min</Text>
      </View>

      <Text style={s.title}>{item.title}</Text>
      {item.exam_category && <Text style={s.category}>{item.exam_category}</Text>}

      {item.scheduled_at && !item.is_live && (
        <Text style={s.scheduled}>
          Scheduled: {new Date(item.scheduled_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      )}

      <TouchableOpacity
        style={[s.enterBtn, !item.is_live && s.enterBtnDisabled]}
        onPress={() => handleEnterExam(item)}
      >
        <Text style={s.enterBtnText}>
          {item.is_live ? 'Enter Exam →' : 'Waiting for session...'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Exams</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(i) => i.id}
          renderItem={renderExam}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#10B981" />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No exams yet</Text>
              <Text style={s.emptySubText}>Join a batch to see exams</Text>
            </View>
          }
        />
      )}

      <Modal visible={tokenModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Enter Session Token</Text>
            <Text style={s.modalSubtitle}>
              Ask your teacher for the session token to enter {selectedExam?.title}
            </Text>
            <TextInput
              style={s.tokenInput}
              placeholder="e.g. ABC123-DEF456"
              placeholderTextColor="#4B5563"
              value={token}
              onChangeText={setToken}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setTokenModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleValidateToken} disabled={validating}>
                {validating ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>Enter</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#374151' },
  badgeLive: { backgroundColor: '#064E3B' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  badgeTextLive: { color: '#10B981' },
  duration: { fontSize: 12, color: '#6B7280' },
  title: { fontSize: 17, fontWeight: '700', color: '#F9FAFB', marginBottom: 4 },
  category: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  scheduled: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  enterBtn: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  enterBtnDisabled: { backgroundColor: '#374151' },
  enterBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#6B7280' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1F2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#F9FAFB', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  tokenInput: { backgroundColor: '#111827', borderRadius: 12, padding: 16, color: '#F9FAFB', fontSize: 18, fontWeight: '700', letterSpacing: 2, borderWidth: 1, borderColor: '#374151', marginBottom: 20, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
  cancelBtnText: { color: '#9CA3AF', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default StudentExamsScreen;
