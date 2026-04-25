import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type Batch = { id: string; name: string; subject: string };
type Question = { id: string; text: string; type: string; difficulty: string | null; positive_marks: number };

const CreateEditExamScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const examId: string | undefined = route.params?.examId;
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [loading, setLoading] = useState(!!examId);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [scheduledAt, setScheduledAt] = useState('');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [examCategory, setExamCategory] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [batchRes, qRes] = await Promise.all([
        supabase.from('batches').select('id, name, subject').eq('teacher_id', user!.id).eq('status', 'ACTIVE'),
        supabase.from('questions').select('id, text, type, difficulty, positive_marks').eq('teacher_id', user!.id).order('created_at', { ascending: false }),
      ]);
      setBatches((batchRes.data ?? []) as Batch[]);
      setQuestions((qRes.data ?? []) as Question[]);

      if (examId) {
        const { data: exam } = await (supabase.from('exams').select('*').eq('id', examId).single() as any) as { data: any };
        if (exam) {
          setTitle(exam.title ?? '');
          setDuration(String(exam.duration_minutes ?? 60));
          setScheduledAt(exam.scheduled_at ? new Date(exam.scheduled_at).toISOString().slice(0, 16).replace('T', ' ') : '');
          setNegativeMarking(exam.negative_marking_enabled ?? false);
          setShuffleQuestions(exam.shuffle_questions ?? false);
          setShuffleOptions(exam.shuffle_options ?? false);
          setExamCategory(exam.exam_category ?? '');
          setSelectedBatchIds(exam.batch_ids ?? []);
          setSelectedQuestionIds(exam.question_ids ?? []);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBatch = (id: string) =>
    setSelectedBatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleQuestion = (id: string) =>
    setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!duration || isNaN(Number(duration)) || Number(duration) < 1) { Alert.alert('Error', 'Enter a valid duration'); return; }
    if (selectedBatchIds.length === 0) { Alert.alert('Error', 'Select at least one batch'); return; }

    setSaving(true);
    try {
      const payload = {
        teacher_id: user!.id,
        title: title.trim(),
        duration_minutes: Number(duration),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        negative_marking_enabled: negativeMarking,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        exam_category: examCategory.trim() || null,
        batch_ids: selectedBatchIds,
        question_ids: selectedQuestionIds,
      };

      if (examId) {
        const { error } = await (supabase.from('exams') as any).update(payload).eq('id', examId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('exams') as any).insert(payload);
        if (error) throw error;
      }

      qc.invalidateQueries({ queryKey: ['teacher_exams'] });
      qc.invalidateQueries({ queryKey: ['student_calendar'] });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator color="#3B82F6" size="large" /></View>
  );

  const diffColor = (d: string | null) =>
    d === 'HARD' ? '#EF4444' : d === 'EASY' ? '#10B981' : '#F59E0B';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.heading}>{examId ? 'Edit Exam' : 'Create Exam'}</Text>

      {/* Title */}
      <Text style={s.label}>Title *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Physics Unit Test 1" placeholderTextColor="#4B5563" />

      {/* Duration */}
      <Text style={s.label}>Duration (minutes) *</Text>
      <TextInput style={s.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="60" placeholderTextColor="#4B5563" />

      {/* Category */}
      <Text style={s.label}>Category (optional)</Text>
      <TextInput style={s.input} value={examCategory} onChangeText={setExamCategory} placeholder="e.g. JEE, NEET, Board" placeholderTextColor="#4B5563" />

      {/* Scheduled At */}
      <Text style={s.label}>Scheduled At (optional)</Text>
      <TextInput
        style={s.input} value={scheduledAt} onChangeText={setScheduledAt}
        placeholder="YYYY-MM-DD HH:MM" placeholderTextColor="#4B5563"
      />

      {/* Toggles */}
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>Negative Marking</Text>
        <Switch value={negativeMarking} onValueChange={setNegativeMarking} trackColor={{ true: '#3B82F6' }} thumbColor="#fff" />
      </View>
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>Shuffle Questions</Text>
        <Switch value={shuffleQuestions} onValueChange={setShuffleQuestions} trackColor={{ true: '#3B82F6' }} thumbColor="#fff" />
      </View>
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>Shuffle Options</Text>
        <Switch value={shuffleOptions} onValueChange={setShuffleOptions} trackColor={{ true: '#3B82F6' }} thumbColor="#fff" />
      </View>

      {/* Batches */}
      <Text style={[s.label, { marginTop: 20 }]}>Assign to Batches *</Text>
      <View style={s.chips}>
        {batches.map(b => (
          <TouchableOpacity
            key={b.id}
            style={[s.chip, selectedBatchIds.includes(b.id) && s.chipActive]}
            onPress={() => toggleBatch(b.id)}
          >
            <Text style={[s.chipText, selectedBatchIds.includes(b.id) && s.chipTextActive]}>{b.name}</Text>
          </TouchableOpacity>
        ))}
        {batches.length === 0 && <Text style={s.emptyHint}>No active batches found</Text>}
      </View>

      {/* Questions */}
      <TouchableOpacity style={s.sectionToggle} onPress={() => setShowQuestions(v => !v)}>
        <Text style={s.sectionToggleText}>
          {showQuestions ? '▼' : '▶'} Questions ({selectedQuestionIds.length} selected)
        </Text>
      </TouchableOpacity>

      {showQuestions && (
        <View style={s.questionList}>
          {questions.length === 0 && (
            <Text style={s.emptyHint}>No questions yet — create them in Question Bank</Text>
          )}
          {questions.map(q => {
            const sel = selectedQuestionIds.includes(q.id);
            return (
              <TouchableOpacity key={q.id} style={[s.qCard, sel && s.qCardSel]} onPress={() => toggleQuestion(q.id)}>
                <View style={[s.qCheck, sel && s.qCheckSel]}>
                  {sel && <Text style={s.qCheckMark}>✓</Text>}
                </View>
                <View style={s.qBody}>
                  <Text style={s.qText} numberOfLines={2}>{q.text}</Text>
                  <View style={s.qMeta}>
                    <Text style={[s.qDiff, { color: diffColor(q.difficulty) }]}>{q.difficulty ?? 'MEDIUM'}</Text>
                    <Text style={s.qMarks}>+{q.positive_marks}m</Text>
                    <Text style={s.qType}>{q.type}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{examId ? 'Update Exam' : 'Create Exam'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB', marginBottom: 24 },
  label: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, color: '#F9FAFB', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#374151' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  toggleLabel: { fontSize: 15, color: '#F9FAFB', fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#374151', backgroundColor: '#1F2937' },
  chipActive: { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' },
  chipText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#3B82F6' },
  emptyHint: { fontSize: 13, color: '#4B5563', fontStyle: 'italic' },
  sectionToggle: { backgroundColor: '#1F2937', borderRadius: 10, padding: 14, marginBottom: 8 },
  sectionToggleText: { color: '#9CA3AF', fontWeight: '700', fontSize: 14 },
  questionList: { gap: 6, marginBottom: 20 },
  qCard: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 12, padding: 12, gap: 12, alignItems: 'flex-start', borderWidth: 1.5, borderColor: '#374151' },
  qCardSel: { borderColor: '#3B82F6', backgroundColor: '#1E3A5F' },
  qCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#374151', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  qCheckSel: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  qCheckMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  qBody: { flex: 1 },
  qText: { fontSize: 14, color: '#F9FAFB', lineHeight: 20, marginBottom: 6 },
  qMeta: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  qDiff: { fontSize: 11, fontWeight: '700' },
  qMarks: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  qType: { fontSize: 11, color: '#6B7280' },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default CreateEditExamScreen;
