import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Alert, Share, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { startExamSession, endExamSession } from '@/services/exam';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TeacherExamsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [sessionLoading, setSessionLoading] = useState<string | null>(null);

  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ['teacher_exams', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('teacher_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleStartSession = async (exam: any) => {
    Alert.alert(
      'Start Exam Session',
      `Start "${exam.title}"? A session token will be generated for students.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setSessionLoading(exam.id);
            try {
              const token = await startExamSession(exam.id, exam.duration_minutes);
              qc.invalidateQueries({ queryKey: ['teacher_exams', user?.id] });
              Alert.alert(
                'Session Started!',
                `Token: ${token}\n\nShare this with your students.`,
                [
                  { text: 'Share', onPress: () => Share.share({ message: `RankEdge Exam Token: ${token}\nExam: ${exam.title}` }) },
                  { text: 'OK' },
                ]
              );
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setSessionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleEndSession = async (exam: any) => {
    Alert.alert('End Session', 'End this exam session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive',
        onPress: async () => {
          setSessionLoading(exam.id);
          try {
            await endExamSession(exam.id);
            qc.invalidateQueries({ queryKey: ['teacher_exams', user?.id] });
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setSessionLoading(null);
          }
        },
      },
    ]);
  };

  const renderExam = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.liveBadge, item.is_live && s.liveBadgeActive]}>
          <Text style={[s.liveText, item.is_live && s.liveTextActive]}>
            {item.is_live ? '● LIVE' : 'OFFLINE'}
          </Text>
        </View>
        <Text style={s.duration}>{item.duration_minutes} min</Text>
      </View>

      <Text style={s.title}>{item.title}</Text>
      {item.exam_category && <Text style={s.category}>{item.exam_category}</Text>}

      {item.is_live && item.session_token && (
        <View style={s.tokenBox}>
          <Text style={s.tokenLabel}>Session Token</Text>
          <Text style={s.token}>{item.session_token}</Text>
        </View>
      )}

      <View style={s.cardFooter}>
        <TouchableOpacity
          style={s.detailBtn}
          onPress={() => navigation.navigate(ROUTES.EXAM_RESULTS_OVERVIEW, { examId: item.id })}
        >
          <Text style={s.detailBtnText}>Results</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.detailBtn}
          onPress={() => navigation.navigate(ROUTES.CREATE_EDIT_EXAM, { examId: item.id })}
        >
          <Text style={s.detailBtnText}>Edit</Text>
        </TouchableOpacity>

        {sessionLoading === item.id ? (
          <ActivityIndicator color="#3B82F6" />
        ) : item.is_live ? (
          <TouchableOpacity style={[s.sessionBtn, s.endBtn]} onPress={() => handleEndSession(item)}>
            <Text style={s.sessionBtnText}>End Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.sessionBtn} onPress={() => handleStartSession(item)}>
            <Text style={s.sessionBtnText}>Start Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Exams</Text>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate(ROUTES.CREATE_EDIT_EXAM)}>
          <Text style={s.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(i) => i.id}
          renderItem={renderExam}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3B82F6" />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No exams yet</Text>
              <Text style={s.emptySubText}>Create your first exam</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  createBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  liveBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#374151' },
  liveBadgeActive: { backgroundColor: '#064E3B' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  liveTextActive: { color: '#10B981' },
  duration: { fontSize: 12, color: '#6B7280' },
  title: { fontSize: 17, fontWeight: '700', color: '#F9FAFB', marginBottom: 4 },
  category: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  tokenBox: { backgroundColor: '#111827', borderRadius: 10, padding: 12, marginBottom: 12 },
  tokenLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  token: { fontSize: 20, fontWeight: '800', color: '#3B82F6', letterSpacing: 2 },
  cardFooter: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  detailBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  detailBtnText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  sessionBtn: { flex: 1, backgroundColor: '#3B82F6', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  endBtn: { backgroundColor: '#7F1D1D' },
  sessionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#6B7280' },
});

export default TeacherExamsScreen;
