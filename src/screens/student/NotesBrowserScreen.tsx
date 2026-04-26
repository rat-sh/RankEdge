import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

type Note = { id: string; title: string; subject: string; chapter: string; topic: string | null; is_pinned: boolean; file_url: string; file_type: string };

const NotesBrowserScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params as { batchId: string };
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ['student_notes', batchId],
    queryFn: async () => {
      const { data } = await (supabase.from('notes').select('id, title, subject, chapter, topic, is_pinned, file_url, file_type, created_at').eq('batch_id', batchId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }) as any) as { data: Note[] };
      return data ?? [];
    },
  });

  const subjects = ['All', ...Array.from(new Set(notes.map(n => n.subject)))];
  const filtered = notes.filter(n => {
    const matchSub = selectedSubject === 'All' || n.subject === selectedSubject;
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.chapter.toLowerCase().includes(search.toLowerCase());
    return matchSub && matchSearch;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Study Material</Text>
      </View>
      <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="Search notes..." placeholderTextColor="#4B5563" />
      <View style={{ paddingLeft: 16, marginBottom: 10 }}>
        <FlatList data={subjects} horizontal keyExtractor={i => i} showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.chip, selectedSubject === item && s.chipActive]} onPress={() => setSelectedSubject(item)}>
              <Text style={[s.chipText, selectedSubject === item && s.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )} />
      </View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No notes available</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.card, item.is_pinned && s.cardPinned]} onPress={() => nav.navigate(ROUTES.NOTE_VIEWER, { noteId: item.id, fileUrl: item.file_url, title: item.title })}>
              <View style={s.iconBox}><Text style={s.icon}>{item.file_type === 'pdf' ? '📄' : item.file_type === 'image' ? '🖼️' : '📁'}</Text></View>
              <View style={s.info}>
                {item.is_pinned && <Text style={s.pinBadge}>📌 Pinned</Text>}
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.meta}>{item.subject} · {item.chapter}{item.topic ? ` · ${item.topic}` : ''}</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 22, fontWeight: '800', color: '#F9FAFB' },
  search: { marginHorizontal: 16, backgroundColor: '#1F2937', borderRadius: 12, padding: 12, color: '#F9FAFB', fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: '#374151' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', marginRight: 8 },
  chipActive: { backgroundColor: '#064E3B', borderColor: '#10B981' },
  chipText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  chipTextActive: { color: '#10B981' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 14, padding: 12, gap: 12, alignItems: 'center' },
  cardPinned: { borderWidth: 1, borderColor: '#10B981' },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#064E3B', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  pinBadge: { fontSize: 10, color: '#10B981', fontWeight: '700', marginBottom: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', marginBottom: 3 },
  meta: { fontSize: 11, color: '#6B7280' },
  arrow: { fontSize: 20, color: '#374151' },
});

export default NotesBrowserScreen;
