import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const InterviewPracticeScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { packId } = route.params as { packId: string };
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['interview_practice', packId],
    queryFn: async () => {
      const [packRes, questionsRes] = await Promise.all([
        supabase.from('interview_packs').select('name, company').eq('id', packId).single() as any,
        supabase.from('interview_questions').select('*').eq('pack_id', packId).limit(20) as any,
      ]);
      return { pack: packRes.data as any, questions: (questionsRes.data ?? []) as any[] };
    },
  });

  const q = data?.questions?.[currentIdx];
  const total = data?.questions?.length ?? 0;

  const handleNext = async () => {
    let correct = false;
    if (q?.type === 'MCQ' && selectedOption === q.correct_index) { correct = true; setScore(s => s + 1); }
    setShowAnswer(false); setSelectedOption(null);
    if (currentIdx + 1 >= total) {
      setDone(true);
      setSaving(true);
      try {
        await (supabase.from('interview_attempts') as any).insert({ student_id: user!.id, pack_id: packId, score: correct ? score + 1 : score, total_marks: total, completed_at: new Date().toISOString() });
        qc.invalidateQueries({ queryKey: ['interview_tracker'] });
      } catch {}
      setSaving(false);
    } else setCurrentIdx(i => i + 1);
  };

  if (isLoading) return <View style={s.center}><ActivityIndicator color="#10B981" size="large" /></View>;

  if (done) return (
    <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <Text style={s.doneIcon}>🎉</Text>
      <Text style={s.doneTitle}>Session Complete!</Text>
      <Text style={s.doneScore}>{score} / {total}</Text>
      <Text style={s.doneSub}>{Math.round(score / total * 100)}% correct</Text>
      <TouchableOpacity style={s.doneBtn} onPress={() => nav.goBack()}><Text style={s.doneBtnText}>Back to Packs</Text></TouchableOpacity>
    </View>
  );

  if (!q) return <View style={s.center}><Text style={{ color: '#6B7280' }}>No questions in this pack</Text></View>;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Exit</Text></TouchableOpacity>
        <Text style={s.progress}>{currentIdx + 1}/{total}</Text>
        <Text style={[s.qType, { color: q.type === 'MCQ' ? '#3B82F6' : q.type === 'CODING' ? '#8B5CF6' : '#F59E0B' }]}>{q.type}</Text>
      </View>

      <View style={s.progressBar}><View style={[s.progressFill, { width: `${((currentIdx) / total) * 100}%` as any }]} /></View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.diffBadge, { backgroundColor: q.difficulty === 'EASY' ? '#064E3B' : q.difficulty === 'HARD' ? '#7F1D1D' : '#78350F' }]}>
          <Text style={s.diffText}>{q.difficulty}</Text>
        </View>
        <Text style={s.question}>{q.text}</Text>

        {q.type === 'MCQ' && (Array.isArray(q.options) ? q.options : []).map((opt: string, i: number) => (
          <TouchableOpacity key={i} style={[s.option, selectedOption === i && (showAnswer ? (i === q.correct_index ? s.optionCorrect : s.optionWrong) : s.optionSelected), showAnswer && i === q.correct_index && s.optionCorrect]} onPress={() => !showAnswer && setSelectedOption(i)}>
            <Text style={s.optionLetter}>{String.fromCharCode(65 + i)}</Text>
            <Text style={s.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}

        {showAnswer && q.model_answer && (
          <View style={s.modelAnswer}>
            <Text style={s.modelAnswerLabel}>Model Answer</Text>
            <Text style={s.modelAnswerText}>{q.model_answer}</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        {!showAnswer ? (
          <TouchableOpacity style={s.revealBtn} onPress={() => setShowAnswer(true)}>
            <Text style={s.revealBtnText}>Show Answer</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextBtnText}>{currentIdx + 1 >= total ? 'Finish' : 'Next →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  progress: { flex: 1, textAlign: 'center', color: '#6B7280', fontSize: 14, fontWeight: '600' },
  qType: { fontSize: 12, fontWeight: '800' },
  progressBar: { height: 3, backgroundColor: '#1F2937', marginHorizontal: 16, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: '#10B981', borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  diffBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 12 },
  diffText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  question: { fontSize: 18, fontWeight: '700', color: '#F9FAFB', lineHeight: 28, marginBottom: 20 },
  option: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: '#374151' },
  optionSelected: { borderColor: '#3B82F6', backgroundColor: '#1E3A5F' },
  optionCorrect: { borderColor: '#10B981', backgroundColor: '#064E3B' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: '#7F1D1D' },
  optionLetter: { fontSize: 14, fontWeight: '800', color: '#6B7280', width: 20 },
  optionText: { flex: 1, fontSize: 14, color: '#F9FAFB', lineHeight: 20 },
  modelAnswer: { backgroundColor: '#1E3A5F', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#3B82F6', marginTop: 12 },
  modelAnswerLabel: { fontSize: 11, color: '#93C5FD', fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  modelAnswerText: { fontSize: 14, color: '#F9FAFB', lineHeight: 22 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: '#1F2937' },
  revealBtn: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  revealBtnText: { color: '#9CA3AF', fontWeight: '700', fontSize: 14 },
  nextBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  doneIcon: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '900', color: '#F9FAFB', marginBottom: 8 },
  doneScore: { fontSize: 48, fontWeight: '900', color: '#10B981', marginBottom: 8 },
  doneSub: { fontSize: 16, color: '#6B7280', marginBottom: 32 },
  doneBtn: { backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default InterviewPracticeScreen;
