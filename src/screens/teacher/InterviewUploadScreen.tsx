import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const QUESTION_TYPES = ['MCQ', 'CODING', 'HR', 'BEHAVIORAL', 'THEORETICAL'];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const DIFF_COLORS: Record<string, string> = { EASY: '#10B981', MEDIUM: '#F59E0B', HARD: '#EF4444' };

const InterviewUploadScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [qType, setQType] = useState('MCQ');
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [modelAnswer, setModelAnswer] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [company, setCompany] = useState('');
  const [packId, setPackId] = useState('');

  const handleSave = async () => {
    if (!text.trim() || !company.trim()) { Alert.alert('Error', 'Question text and company are required'); return; }
    setSaving(true);
    try {
      await (supabase.from('interview_questions') as any).insert({
        teacher_id: user!.id, pack_id: packId.trim() || null,
        type: qType, text: text.trim(),
        options: qType === 'MCQ' ? options.filter(o => o.trim()) : null,
        correct_index: qType === 'MCQ' ? correctIndex : null,
        model_answer: modelAnswer.trim() || null,
        difficulty, company: company.trim(),
      });
      qc.invalidateQueries({ queryKey: ['interview_questions'] });
      Alert.alert('Saved!', 'Question added to pack', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => nav.goBack()} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.heading}>Upload Interview Question</Text>

      <Text style={s.label}>Question Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {QUESTION_TYPES.map(t => (
            <TouchableOpacity key={t} style={[s.chip, qType === t && s.chipActive]} onPress={() => setQType(t)}>
              <Text style={[s.chipText, qType === t && s.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={s.label}>Company *</Text>
      <TextInput style={s.input} value={company} onChangeText={setCompany} placeholder="e.g. Infosys, TCS, Google" placeholderTextColor="#4B5563" />

      <Text style={s.label}>Pack ID (optional)</Text>
      <TextInput style={s.input} value={packId} onChangeText={setPackId} placeholder="Paste pack UUID" placeholderTextColor="#4B5563" autoCapitalize="none" />

      <Text style={s.label}>Question *</Text>
      <TextInput style={[s.input, { height: 90 }]} value={text} onChangeText={setText} placeholder="Enter interview question..." placeholderTextColor="#4B5563" multiline textAlignVertical="top" />

      {qType === 'MCQ' && options.map((opt, i) => (
        <View key={i} style={s.optRow}>
          <TouchableOpacity style={[s.optCheck, correctIndex === i && s.optOn]} onPress={() => setCorrectIndex(i)}>
            <Text style={s.optLetter}>{String.fromCharCode(65 + i)}</Text>
          </TouchableOpacity>
          <TextInput style={s.optInput} value={opt} onChangeText={v => { const o = [...options]; o[i] = v; setOptions(o); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} placeholderTextColor="#4B5563" />
        </View>
      ))}

      <Text style={s.label}>Model Answer</Text>
      <TextInput style={[s.input, { height: 80 }]} value={modelAnswer} onChangeText={setModelAnswer} placeholder="Expected answer / solution..." placeholderTextColor="#4B5563" multiline textAlignVertical="top" />

      <Text style={s.label}>Difficulty</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {DIFFICULTIES.map(d => (
          <TouchableOpacity key={d} style={[s.chip, difficulty === d && { backgroundColor: DIFF_COLORS[d], borderColor: DIFF_COLORS[d] }]} onPress={() => setDifficulty(d)}>
            <Text style={[s.chipText, difficulty === d && { color: '#fff' }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Upload Question</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 20 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 6, marginTop: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 13, color: '#F9FAFB', fontSize: 14, marginBottom: 4, borderWidth: 1, borderColor: '#374151' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937', borderWidth: 1.5, borderColor: '#374151' },
  chipActive: { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' },
  chipText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  chipTextActive: { color: '#3B82F6' },
  optRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  optCheck: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1F2937', borderWidth: 2, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  optOn: { backgroundColor: '#10B981', borderColor: '#10B981' },
  optLetter: { color: '#F9FAFB', fontWeight: '800', fontSize: 12 },
  optInput: { flex: 1, backgroundColor: '#1F2937', borderRadius: 10, padding: 11, color: '#F9FAFB', fontSize: 14, borderWidth: 1, borderColor: '#374151' },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default InterviewUploadScreen;
