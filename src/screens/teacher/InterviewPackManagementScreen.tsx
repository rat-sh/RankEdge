import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const InterviewPackManagementScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: packs = [], isLoading, refetch } = useQuery({
    queryKey: ['interview_packs', user?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('interview_packs').select('id, name, company, question_count, created_at').eq('teacher_id', user!.id).order('created_at', { ascending: false }) as any) as { data: any[] };
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!newName.trim() || !newCompany.trim()) { Alert.alert('Error', 'Name and company required'); return; }
    setSaving(true);
    try {
      await (supabase.from('interview_packs') as any).insert({ teacher_id: user!.id, name: newName.trim(), company: newCompany.trim(), question_count: 0 });
      qc.invalidateQueries({ queryKey: ['interview_packs'] });
      setCreating(false); setNewName(''); setNewCompany('');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Pack?', 'All questions in this pack will be unlinked.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await (supabase.from('interview_packs') as any).delete().eq('id', id);
        qc.invalidateQueries({ queryKey: ['interview_packs'] });
      }},
    ]);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Interview Packs</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setCreating(v => !v)}>
          <Text style={s.addBtnText}>{creating ? '✕' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      {creating && (
        <View style={s.createBox}>
          <TextInput style={s.input} value={newName} onChangeText={setNewName} placeholder="Pack name (e.g. Infosys Pack)" placeholderTextColor="#4B5563" />
          <TextInput style={s.input} value={newCompany} onChangeText={setNewCompany} placeholder="Company / Target role" placeholderTextColor="#4B5563" />
          <TouchableOpacity style={[s.createBtn, saving && { opacity: 0.6 }]} onPress={handleCreate} disabled={saving}>
            <Text style={s.createBtnText}>{saving ? 'Creating...' : 'Create Pack'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={s.uploadBtn} onPress={() => nav.navigate(ROUTES.INTERVIEW_UPLOAD)}>
        <Text style={s.uploadBtnText}>+ Upload Questions</Text>
      </TouchableOpacity>

      {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList data={packs} keyExtractor={i => i.id} contentContainerStyle={s.list} onRefresh={refetch} refreshing={isLoading}
          ListEmptyComponent={<Text style={s.empty}>No packs yet. Create one above.</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardLeft}>
                <Text style={s.packName}>{item.name}</Text>
                <Text style={s.company}>{item.company}</Text>
                <Text style={s.qCount}>{item.question_count ?? 0} questions</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={s.deleteBtn}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 10 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  createBox: { padding: 16, backgroundColor: '#1F2937', marginHorizontal: 16, borderRadius: 14, marginBottom: 10, gap: 8 },
  input: { backgroundColor: '#111827', borderRadius: 10, padding: 12, color: '#F9FAFB', fontSize: 14, borderWidth: 1, borderColor: '#374151' },
  createBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700' },
  uploadBtn: { marginHorizontal: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  uploadBtnText: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  empty: { textAlign: 'center', color: '#4B5563', marginTop: 40 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 14, padding: 14, alignItems: 'center' },
  cardLeft: { flex: 1 },
  packName: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginBottom: 2 },
  company: { fontSize: 12, color: '#3B82F6', marginBottom: 4 },
  qCount: { fontSize: 11, color: '#6B7280' },
  deleteBtn: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});

export default InterviewPackManagementScreen;
