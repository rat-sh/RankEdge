import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TeacherNotesScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ['teacher_notes', user?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('notes').select('id, title, subject, chapter, topic, is_pinned, file_type, created_at').eq('teacher_id', user!.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }) as any) as { data: any[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  const handlePin = async (id: string, current: boolean) => {
    await (supabase.from('notes') as any).update({ is_pinned: !current }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['teacher_notes'] });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await (supabase.from('notes') as any).delete().eq('id', id);
        qc.invalidateQueries({ queryKey: ['teacher_notes'] });
      }},
    ]);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Notes & Material</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate(ROUTES.UPLOAD_NOTE)}>
          <Text style={s.addBtnText}>+ Upload</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList data={notes} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No notes uploaded yet</Text>}
          renderItem={({ item }) => (
            <View style={[s.card, item.is_pinned && s.cardPinned]}>
              <View style={s.cardLeft}>
                <Text style={s.fileType}>{item.file_type?.toUpperCase() ?? 'FILE'}</Text>
              </View>
              <View style={s.cardBody}>
                <View style={s.titleRow}>
                  {item.is_pinned && <Text style={s.pinIcon}>📌 </Text>}
                  <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                </View>
                <Text style={s.meta}>{item.subject} · {item.chapter}{item.topic ? ` · ${item.topic}` : ''}</Text>
                <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
              </View>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => handlePin(item.id, item.is_pinned)}>
                  <Text style={s.actionText}>{item.is_pinned ? 'Unpin' : 'Pin'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={[s.actionText, { color: '#EF4444' }]}>Del</Text>
                </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { flex: 1, fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 14, padding: 12, gap: 12, alignItems: 'center' },
  cardPinned: { borderWidth: 1, borderColor: '#3B82F6' },
  cardLeft: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  fileType: { fontSize: 10, color: '#3B82F6', fontWeight: '800' },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  pinIcon: { fontSize: 12 },
  title: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', flex: 1 },
  meta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 10, color: '#4B5563', marginTop: 2 },
  actions: { gap: 8, alignItems: 'flex-end' },
  actionText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
});

export default TeacherNotesScreen;
