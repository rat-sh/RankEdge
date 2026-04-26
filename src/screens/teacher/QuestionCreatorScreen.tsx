import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const TYPES = ['MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'NUMERICAL', 'THEORETICAL', 'FILL_BLANK'];
const DIFFS = ['EASY', 'MEDIUM', 'HARD'];
const DIFF_COLORS: Record<string, string> = { EASY: '#10B981', MEDIUM: '#F59E0B', HARD: '#EF4444' };

const QuestionCreatorScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { questionId } = route.params ?? {};
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!questionId);
  const [type, setType] = useState('MCQ_SINGLE');
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctSingle, setCorrectSingle] = useState<number | null>(null);
  const [correctMulti, setCorrectMulti] = useState([false, false, false, false]);
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [numericalAnswer, setNumericalAnswer] = useState('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [chapterTag, setChapterTag] = useState('');
  const [topicTag, setTopicTag] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [posMarks, setPosMarks] = useState('4');
  const [negMarks, setNegMarks] = useState('1');

  useEffect(() => {
    if (!questionId) return;
    (async () => {
      const { data } = await (supabase.from('questions').select('*').eq('id', questionId).single() as any) as { data: any };
      if (data) {
        setType(data.type); setText(data.text); setChapterTag(data.chapter_tag ?? '');
        setTopicTag(data.topic_tag ?? ''); setDifficulty(data.difficulty ?? 'MEDIUM');
        setPosMarks(String(data.positive_marks ?? 4)); setNegMarks(String(data.negative_marks ?? 0));
        setExplanation(data.explanation ?? '');
        if (data.options) setOptions([...data.options, '', '', '', ''].slice(0, 4));
        if (data.type === 'MCQ_SINGLE') setCorrectSingle(Number(data.correct_answer));
        if (data.type === 'TRUE_FALSE') setTfAnswer(data.correct_answer === true);
        if (data.type === 'NUMERICAL') setNumericalAnswer(String(data.correct_answer ?? ''));
        if (data.type === 'FILL_BLANK') setFillAnswer(String(data.correct_answer ?? ''));
      }
      setLoading(false);
    })();
  }, [questionId]);

  const buildAnswer = () => {
    if (type === 'MCQ_SINGLE') return correctSingle;
    if (type === 'MCQ_MULTI') return correctMulti.map((v, i) => v ? i : -1).filter(i => i >= 0);
    if (type === 'TRUE_FALSE') return tfAnswer;
    if (type === 'NUMERICAL') return parseFloat(numericalAnswer);
    if (type === 'FILL_BLANK') return fillAnswer.trim();
    return null;
  };

  const handleSave = async () => {
    if (!text.trim() || !chapterTag.trim()) { Alert.alert('Error', 'Question text and chapter are required'); return; }
    setSaving(true);
    try {
      const payload = {
        teacher_id: user!.id, type, text: text.trim(),
        options: ['MCQ_SINGLE', 'MCQ_MULTI'].includes(type) ? options.filter(o => o.trim()) : null,
        correct_answer: buildAnswer(), explanation: explanation.trim() || null,
        chapter_tag: chapterTag.trim(), topic_tag: topicTag.trim() || null,
        difficulty, positive_marks: parseFloat(posMarks) || 4, negative_marks: parseFloat(negMarks) || 0,
      };
      if (questionId) {
        await (supabase.from('questions') as any).update(payload).eq('id', questionId);
      } else {
        await (supabase.from('questions') as any).insert(payload);
      }
      qc.invalidateQueries({ queryKey: ['question_bank'] });
      nav.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#3B82F6" size="large" /></View>;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => nav.goBack()} style={s.backRow}><Text style={s.back}>← Back</Text></TouchableOpacity>
      <Text style={s.heading}>{questionId ? 'Edit Question' : 'New Question'}</Text>

      <Text style={s.label}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} style={[s.chip, type === t && s.chipActive]} onPress={() => setType(t)}>
              <Text style={[s.chipText, type === t && s.chipTextActive]}>{t.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={s.label}>Question *</Text>
      <TextInput style={[s.input, { height: 90 }]} value={text} onChangeText={setText} placeholder="Enter question..." placeholderTextColor="#4B5563" multiline textAlignVertical="top" />

      {(type === 'MCQ_SINGLE' || type === 'MCQ_MULTI') && options.map((opt, i) => (
        <View key={i} style={s.optRow}>
          <TouchableOpacity style={[s.optCheck, (type === 'MCQ_SINGLE' ? correctSingle === i : correctMulti[i]) && s.optOn]}
            onPress={() => type === 'MCQ_SINGLE' ? setCorrectSingle(i) : (() => { const m = [...correctMulti]; m[i] = !m[i]; setCorrectMulti(m); })()}>
            <Text style={s.optLetter}>{String.fromCharCode(65 + i)}</Text>
          </TouchableOpacity>
          <TextInput style={s.optInput} value={opt} onChangeText={v => { const o = [...options]; o[i] = v; setOptions(o); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} placeholderTextColor="#4B5563" />
        </View>
      ))}
      {(type === 'MCQ_SINGLE' || type === 'MCQ_MULTI') && <Text style={s.hint}>Tap letter = correct answer</Text>}

      {type === 'TRUE_FALSE' && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          {[true, false].map(v => (
            <TouchableOpacity key={String(v)} style={[s.tfBtn, tfAnswer === v && { borderColor: v ? '#10B981' : '#EF4444', backgroundColor: v ? '#064E3B' : '#7F1D1D' }]} onPress={() => setTfAnswer(v)}>
              <Text style={s.tfText}>{v ? 'True' : 'False'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {type === 'NUMERICAL' && <TextInput style={s.input} value={numericalAnswer} onChangeText={setNumericalAnswer} keyboardType="decimal-pad" placeholder="Correct answer (number)" placeholderTextColor="#4B5563" />}
      {type === 'FILL_BLANK' && <TextInput style={s.input} value={fillAnswer} onChangeText={setFillAnswer} placeholder="Correct answer text" placeholderTextColor="#4B5563" />}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Text style={s.label}>+Marks</Text><TextInput style={s.input} value={posMarks} onChangeText={setPosMarks} keyboardType="decimal-pad" placeholderTextColor="#4B5563" /></View>
        <View style={{ flex: 1 }}><Text style={s.label}>−Marks</Text><TextInput style={s.input} value={negMarks} onChangeText={setNegMarks} keyboardType="decimal-pad" placeholderTextColor="#4B5563" /></View>
      </View>

      <Text style={s.label}>Difficulty</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {DIFFS.map(d => (
          <TouchableOpacity key={d} style={[s.chip, difficulty === d && { backgroundColor: DIFF_COLORS[d], borderColor: DIFF_COLORS[d] }]} onPress={() => setDifficulty(d)}>
            <Text style={[s.chipText, difficulty === d && { color: '#fff' }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Chapter *</Text>
      <TextInput style={s.input} value={chapterTag} onChangeText={setChapterTag} placeholder="e.g. Kinematics" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Topic</Text>
      <TextInput style={s.input} value={topicTag} onChangeText={setTopicTag} placeholder="e.g. Projectile Motion" placeholderTextColor="#4B5563" />
      <Text style={s.label}>Explanation</Text>
      <TextInput style={[s.input, { height: 80 }]} value={explanation} onChangeText={setExplanation} placeholder="Solution explanation..." placeholderTextColor="#4B5563" multiline textAlignVertical="top" />

      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{questionId ? 'Update' : 'Save Question'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  backRow: { marginBottom: 16 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 20 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 13, color: '#F9FAFB', fontSize: 14, marginBottom: 4, borderWidth: 1, borderColor: '#374151' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1F2937', borderWidth: 1.5, borderColor: '#374151' },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { fontSize: 11, color: '#6B7280', fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  optRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  optCheck: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1F2937', borderWidth: 2, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  optOn: { backgroundColor: '#10B981', borderColor: '#10B981' },
  optLetter: { color: '#F9FAFB', fontWeight: '800', fontSize: 12 },
  optInput: { flex: 1, backgroundColor: '#1F2937', borderRadius: 10, padding: 11, color: '#F9FAFB', fontSize: 14, borderWidth: 1, borderColor: '#374151' },
  hint: { fontSize: 11, color: '#4B5563', marginBottom: 8 },
  tfBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1F2937', alignItems: 'center', borderWidth: 2, borderColor: '#374151' },
  tfText: { color: '#F9FAFB', fontWeight: '700', fontSize: 15 },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default QuestionCreatorScreen;
