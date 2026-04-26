import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const StudentLecturesScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params as { batchId: string };
  const [search, setSearch] = useState('');

  const { data: lectures = [], isLoading, refetch } = useQuery({
    queryKey: ['student_lectures', batchId],
    queryFn: async () => {
      const { data } = await (supabase.from('lectures').select('id, title, subject, chapter, topic, lecture_number, video_url, is_external, created_at').eq('batch_id', batchId).order('lecture_number', { ascending: true }) as any) as { data: any[] };
      return data ?? [];
    },
  });

  const filtered = lectures.filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.chapter.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Recorded Lectures</Text>
      </View>
      <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="Search lectures..." placeholderTextColor="#4B5563" />
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No lectures available</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => nav.navigate(ROUTES.VIDEO_PLAYER, { lectureId: item.id, videoUrl: item.video_url, title: item.title })}>
              <View style={s.numBox}><Text style={s.num}>{item.lecture_number ?? '—'}</Text></View>
              <View style={s.info}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.meta}>{item.subject} · {item.chapter}</Text>
                {item.topic && <Text style={s.topic}>{item.topic}</Text>}
              </View>
              <Text style={s.playIcon}>▶</Text>
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
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 14, padding: 12, gap: 12, alignItems: 'center' },
  numBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#064E3B', alignItems: 'center', justifyContent: 'center' },
  num: { color: '#10B981', fontWeight: '900', fontSize: 14 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', marginBottom: 3 },
  meta: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  topic: { fontSize: 11, color: '#4B5563' },
  playIcon: { fontSize: 18, color: '#10B981' },
});

export default StudentLecturesScreen;
