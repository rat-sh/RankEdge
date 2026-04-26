import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const InterviewPacksScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();

  const { data: packs = [], isLoading, refetch } = useQuery({
    queryKey: ['student_interview_packs', user?.id],
    queryFn: async () => {
      // Get all packs from teachers the student is enrolled with
      const { data: profile } = await (supabase.from('users').select('batch_ids').eq('id', user!.id).single() as any) as { data: any };
      const batchIds: string[] = profile?.batch_ids ?? [];
      if (!batchIds.length) return [];
      const { data: batches } = await (supabase.from('batches').select('teacher_id').in('id', batchIds) as any) as { data: any[] };
      const teacherIds = [...new Set((batches ?? []).map((b: any) => b.teacher_id))];
      if (!teacherIds.length) return [];
      const { data } = await (supabase.from('interview_packs').select('id, name, company, question_count, teacher_id').in('teacher_id', teacherIds) as any) as { data: any[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  const COMPANY_COLORS: Record<string, string> = {
    Infosys: '#10B981', TCS: '#3B82F6', Google: '#F59E0B', Amazon: '#F97316', Microsoft: '#8B5CF6',
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Interview Prep</Text>
        <TouchableOpacity style={s.trackerBtn} onPress={() => nav.navigate(ROUTES.INTERVIEW_TRACKER)}>
          <Text style={s.trackerBtnText}>My Tracker</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList data={packs} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No interview packs available yet</Text>}
          renderItem={({ item }) => {
            const color = COMPANY_COLORS[item.company] ?? '#10B981';
            return (
              <TouchableOpacity style={[s.card, { borderLeftColor: color }]} onPress={() => nav.navigate(ROUTES.INTERVIEW_PRACTICE, { packId: item.id })}>
                <View style={[s.iconBox, { backgroundColor: color + '22' }]}>
                  <Text style={[s.iconText, { color }]}>{item.company?.[0] ?? '?'}</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.packName}>{item.name}</Text>
                  <Text style={[s.company, { color }]}>{item.company}</Text>
                  <Text style={s.qCount}>{item.question_count ?? 0} questions</Text>
                </View>
                <Text style={s.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 10 },
  back: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 22, fontWeight: '800', color: '#F9FAFB' },
  trackerBtn: { backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#374151' },
  trackerBtnText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 14, padding: 14, gap: 12, alignItems: 'center', borderLeftWidth: 3 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22, fontWeight: '900' },
  cardBody: { flex: 1 },
  packName: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginBottom: 3 },
  company: { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  qCount: { fontSize: 11, color: '#6B7280' },
  arrow: { fontSize: 22, color: '#374151' },
});

export default InterviewPacksScreen;
