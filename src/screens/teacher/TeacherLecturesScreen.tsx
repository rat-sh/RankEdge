import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TeacherLecturesScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: lectures = [], isLoading, refetch } = useQuery({
    queryKey: ['teacher_lectures', user?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('lectures').select('id, title, subject, chapter, topic, lecture_number, is_external, created_at').eq('teacher_id', user!.id).order('lecture_number', { ascending: true }) as any) as { data: any[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Lectures</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate(ROUTES.UPLOAD_EDIT_LECTURE)}>
          <Text style={s.addBtnText}>+ Upload</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList data={lectures} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No lectures uploaded yet</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => nav.navigate(ROUTES.UPLOAD_EDIT_LECTURE, { lectureId: item.id })}>
              <View style={s.numBox}><Text style={s.num}>{item.lecture_number}</Text></View>
              <View style={s.cardBody}>
                <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                <Text style={s.meta}>{item.subject} · {item.chapter}{item.topic ? ` · ${item.topic}` : ''}</Text>
                <Text style={s.type}>{item.is_external ? '🔗 External' : '📁 Uploaded'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { flex: 1, fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 14, padding: 12, gap: 12, alignItems: 'center' },
  numBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  num: { color: '#3B82F6', fontWeight: '900', fontSize: 16 },
  cardBody: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', marginBottom: 3 },
  meta: { fontSize: 11, color: '#6B7280', marginBottom: 3 },
  type: { fontSize: 11, color: '#9CA3AF' },
});

export default TeacherLecturesScreen;
