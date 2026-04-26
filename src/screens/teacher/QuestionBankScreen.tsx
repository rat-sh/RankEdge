import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

type Q = { id: string; text: string; type: string; difficulty: string | null; positive_marks: number; chapter_tag: string };

const TYPE_FILTERS = ['All', 'MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'NUMERICAL', 'THEORETICAL'];
const DIFF_COLORS: Record<string, string> = { EASY: '#10B981', MEDIUM: '#F59E0B', HARD: '#EF4444' };

const QuestionBankScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: questions = [], isLoading, refetch } = useQuery({
    queryKey: ['question_bank', user?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('questions').select('id, text, type, difficulty, positive_marks, chapter_tag').eq('teacher_id', user!.id).order('created_at', { ascending: false }) as any) as { data: Q[] | null };
      return data ?? [];
    },
    enabled: !!user,
  });

  const filtered = questions.filter(q => {
    const matchType = typeFilter === 'All' || q.type === typeFilter;
    const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase()) || q.chapter_tag.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Question Bank</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate(ROUTES.QUESTION_CREATOR)}>
          <Text style={s.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="Search questions or chapter..." placeholderTextColor="#4B5563" />

      <View style={s.filterRow}>
        {TYPE_FILTERS.map(t => (
          <TouchableOpacity key={t} style={[s.chip, typeFilter === t && s.chipActive]} onPress={() => setTypeFilter(t)}>
            <Text style={[s.chipText, typeFilter === t && s.chipTextActive]}>{t === 'All' ? 'All' : t.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No questions yet. Tap + New to add.</Text>}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => nav.navigate(ROUTES.QUESTION_CREATOR, { questionId: item.id })}>
              <View style={s.cardTop}>
                <Text style={s.qType}>{item.type.replace('_', ' ')}</Text>
                {item.difficulty && <Text style={[s.diff, { color: DIFF_COLORS[item.difficulty] ?? '#9CA3AF' }]}>{item.difficulty}</Text>}
                <Text style={s.marks}>+{item.positive_marks}m</Text>
              </View>
              <Text style={s.qText} numberOfLines={2}>{item.text}</Text>
              <Text style={s.chapter}>{item.chapter_tag}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <Text style={s.count}>{filtered.length} question{filtered.length !== 1 ? 's' : ''}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  search: { marginHorizontal: 16, backgroundColor: '#1F2937', borderRadius: 12, padding: 12, color: '#F9FAFB', fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: '#374151' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151' },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 60, fontSize: 14 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#374151' },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  qType: { fontSize: 10, color: '#3B82F6', fontWeight: '700', backgroundColor: '#1E3A5F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diff: { fontSize: 10, fontWeight: '700' },
  marks: { fontSize: 11, color: '#10B981', fontWeight: '600', marginLeft: 'auto' },
  qText: { fontSize: 14, color: '#F9FAFB', lineHeight: 20, marginBottom: 6 },
  chapter: { fontSize: 11, color: '#6B7280' },
  count: { position: 'absolute', bottom: 12, right: 16, fontSize: 11, color: '#4B5563' },
});

export default QuestionBankScreen;
