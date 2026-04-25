import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, BackHandler, StatusBar, FlatList, Modal, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { useExamStore } from '@/store/exam/examStore';
import { supabase } from '@/lib/supabase/client';
import { submitExamAttempt } from '@/services/exam';
import { ROUTES, TIMER_WARNING_SECONDS } from '@/constants';

type ExamData = {
  id: string;
  title: string;
  duration_minutes: number;
  shuffle_questions: boolean;
  question_ids: string[] | null;
};

type Question = {
  id: string;
  type: string;
  text: string;
  options: string[] | null;
  difficulty: string | null;
  positive_marks: number;
  negative_marks: number;
};

const TakeExamScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { examId } = route.params as { examId: string };
  const { user } = useAuthStore();
  const {
    answers, markedForReview, setAnswer, toggleReview,
    setCurrentQuestion, currentQuestionIndex,
    startAttempt, clearAttempt,
  } = useExamStore();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadExam();
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => {
      backHandler.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadExam = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, title, duration_minutes, shuffle_questions, question_ids')
        .eq('id', examId)
        .single();

      if (examError || !examData) throw new Error('Exam not found');

      const typedExam = examData as ExamData;
      const questionIds: string[] = typedExam.question_ids ?? [];

      let loadedQuestions: Question[] = [];
      if (questionIds.length > 0) {
        const { data: qData } = await supabase
          .from('questions')
          .select('id, type, text, options, difficulty, positive_marks, negative_marks')
          .in('id', questionIds);
        loadedQuestions = (qData ?? []) as Question[];
        if (typedExam.shuffle_questions) {
          loadedQuestions = [...loadedQuestions].sort(() => Math.random() - 0.5);
        }
      }

      setExam(typedExam);
      setQuestions(loadedQuestions);
      startAttempt(examId);

      const secs = typedExam.duration_minutes * 60;
      setTimeLeft(secs);
      startTimer(secs);
    } catch {
      Alert.alert('Error', 'Could not load exam');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (seconds: number) => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleExit = () => {
    Alert.alert('Exit Exam?', 'Your progress will be lost if you exit now.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => { clearAttempt(); navigation.goBack(); } },
    ]);
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!exam) return;
    if (!autoSubmit) {
      const unattempted = questions.length - Object.keys(answers).length;
      if (unattempted > 0) {
        const confirmed = await new Promise<boolean>(resolve =>
          Alert.alert('Submit Exam?', `${unattempted} question(s) unattempted.`, [
            { text: 'Review', onPress: () => resolve(false) },
            { text: 'Submit', onPress: () => resolve(true) },
          ])
        );
        if (!confirmed) return;
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeTaken = exam.duration_minutes * 60 - timeLeft;
      await submitExamAttempt({
        examId,
        studentId: user!.id,
        answers,
        markedForReview,
        timeTakenSeconds: timeTaken,
      });
      clearAttempt();
      navigation.replace(ROUTES.EXAM_RESULT, { examId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Submission failed';
      Alert.alert('Error', msg);
      setSubmitting(false);
    }
  }, [answers, markedForReview, timeLeft, exam, questions]);

  const currentQ = questions[currentQuestionIndex] ?? null;
  const isWarning = timeLeft <= TIMER_WARNING_SECONDS;

  if (loading) return (
    <View style={s.center}><ActivityIndicator color="#10B981" size="large" /></View>
  );

  if (submitting) return (
    <View style={s.center}>
      <ActivityIndicator color="#10B981" size="large" />
      <Text style={s.submittingText}>Submitting exam...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar hidden />

      <View style={s.header}>
        <TouchableOpacity onPress={handleExit} style={s.exitBtn}>
          <Text style={s.exitText}>✕</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.examTitle} numberOfLines={1}>{exam?.title}</Text>
          <Text style={s.progress}>{currentQuestionIndex + 1} / {questions.length}</Text>
        </View>
        <TouchableOpacity style={[s.timer, isWarning && s.timerWarning]} onPress={() => setShowNavigator(true)}>
          <Text style={[s.timerText, isWarning && s.timerTextWarning]}>{formatTime(timeLeft)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.qScroll} contentContainerStyle={s.qContent}>
        {currentQ ? (
          <>
            <View style={s.qMeta}>
              <Text style={s.qNumber}>Q{currentQuestionIndex + 1}</Text>
              {currentQ.difficulty ? (
                <Text style={[
                  s.diffBadge,
                  currentQ.difficulty === 'HARD' ? s.hard :
                  currentQ.difficulty === 'EASY' ? s.easy : s.medium,
                ]}>
                  {currentQ.difficulty}
                </Text>
              ) : null}
              {markedForReview.includes(currentQ.id) && (
                <Text style={s.reviewBadge}>Marked for Review</Text>
              )}
            </View>
            <Text style={s.qText}>{currentQ.text}</Text>

            {(currentQ.type === 'MCQ_SINGLE' ||
              currentQ.type === 'MCQ_MULTI' ||
              currentQ.type === 'TRUE_FALSE') && (
              <View style={s.options}>
                {(currentQ.type === 'TRUE_FALSE'
                  ? ['True', 'False']
                  : currentQ.options ?? []
                ).map((opt: string, i: number) => {
                  const isMulti = currentQ.type === 'MCQ_MULTI';
                  const selected = isMulti
                    ? ((answers[currentQ.id] as string[]) ?? []).includes(opt)
                    : answers[currentQ.id] === opt;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.option, selected && s.optionSelected]}
                      onPress={() => {
                        if (isMulti) {
                          const prev = (answers[currentQ.id] as string[]) ?? [];
                          setAnswer(currentQ.id, selected ? prev.filter(x => x !== opt) : [...prev, opt]);
                        } else {
                          setAnswer(currentQ.id, opt);
                        }
                      }}
                    >
                      <View style={[s.optionDot, selected && s.optionDotSelected]}>
                        {selected && <View style={s.optionDotInner} />}
                      </View>
                      <Text style={[s.optionText, selected && s.optionTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={s.marksRow}>
              <Text style={s.marksText}>+{currentQ.positive_marks} marks</Text>
              {currentQ.negative_marks > 0 && (
                <Text style={s.negMarksText}>-{currentQ.negative_marks} negative</Text>
              )}
            </View>
          </>
        ) : (
          <Text style={s.noQ}>No questions loaded</Text>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.reviewBtn}
          onPress={() => currentQ && toggleReview(currentQ.id)}
        >
          <Text style={s.reviewBtnText}>
            {currentQ && markedForReview.includes(currentQ.id) ? 'Unmark' : 'Mark Review'}
          </Text>
        </TouchableOpacity>
        <View style={s.navBtns}>
          <TouchableOpacity
            style={[s.navBtn, currentQuestionIndex === 0 && s.navBtnDisabled]}
            onPress={() => setCurrentQuestion(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={s.navBtnText}>← Prev</Text>
          </TouchableOpacity>
          {currentQuestionIndex === questions.length - 1 ? (
            <TouchableOpacity style={s.submitBtn} onPress={() => handleSubmit(false)}>
              <Text style={s.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.navBtn}
              onPress={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            >
              <Text style={s.navBtnText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={showNavigator} transparent animationType="slide">
        <View style={s.navOverlay}>
          <View style={s.navModal}>
            <Text style={s.navModalTitle}>Questions</Text>
            <FlatList
              data={questions}
              numColumns={5}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => {
                const isAnswered = !!answers[item.id];
                const isReview = markedForReview.includes(item.id);
                const isCurrent = index === currentQuestionIndex;
                return (
                  <TouchableOpacity
                    style={[
                      s.navCell,
                      isCurrent && s.navCellCurrent,
                      isAnswered && !isCurrent && s.navCellAnswered,
                      isReview && s.navCellReview,
                    ]}
                    onPress={() => { setCurrentQuestion(index); setShowNavigator(false); }}
                  >
                    <Text style={[s.navCellText, (isCurrent || isAnswered) && s.navCellTextActive]}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <View style={s.navLegend}>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#10B981' }]} /><Text style={s.legendText}>Answered</Text></View>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={s.legendText}>Review</Text></View>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#374151' }]} /><Text style={s.legendText}>Skipped</Text></View>
            </View>
            <TouchableOpacity style={s.closeNavBtn} onPress={() => setShowNavigator(false)}>
              <Text style={s.closeNavBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  submittingText: { color: '#F9FAFB', fontSize: 16, marginTop: 16 },
  noQ: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#1F2937', gap: 12 },
  exitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  exitText: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  headerCenter: { flex: 1 },
  examTitle: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  progress: { fontSize: 12, color: '#6B7280' },
  timer: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#374151', borderRadius: 10 },
  timerWarning: { backgroundColor: '#7F1D1D' },
  timerText: { fontSize: 16, fontWeight: '800', color: '#F9FAFB' },
  timerTextWarning: { color: '#EF4444' },
  qScroll: { flex: 1 },
  qContent: { padding: 20, paddingBottom: 40 },
  qMeta: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 },
  qNumber: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, fontWeight: '700' },
  easy: { backgroundColor: '#064E3B', color: '#10B981' },
  medium: { backgroundColor: '#78350F', color: '#F59E0B' },
  hard: { backgroundColor: '#7F1D1D', color: '#EF4444' },
  reviewBadge: { backgroundColor: '#78350F', color: '#F59E0B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, fontWeight: '700' },
  qText: { fontSize: 17, color: '#F9FAFB', lineHeight: 26, marginBottom: 24 },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1F2937', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#374151' },
  optionSelected: { borderColor: '#10B981', backgroundColor: '#064E3B' },
  optionDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6B7280', alignItems: 'center', justifyContent: 'center' },
  optionDotSelected: { borderColor: '#10B981' },
  optionDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  optionText: { fontSize: 15, color: '#9CA3AF', flex: 1 },
  optionTextSelected: { color: '#F9FAFB', fontWeight: '600' },
  marksRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  marksText: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  negMarksText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  footer: { backgroundColor: '#1F2937', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F59E0B' },
  reviewBtnText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  navBtns: { flex: 1, flexDirection: 'row', gap: 8 },
  navBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#374151', alignItems: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#F9FAFB', fontWeight: '700', fontSize: 13 },
  submitBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  navOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  navModal: { backgroundColor: '#1F2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '70%' },
  navModalTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB', marginBottom: 16 },
  navCell: { width: 52, height: 52, margin: 4, borderRadius: 10, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  navCellCurrent: { backgroundColor: '#3B82F6' },
  navCellAnswered: { backgroundColor: '#10B981' },
  navCellReview: { backgroundColor: '#F59E0B' },
  navCellText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  navCellTextActive: { color: '#fff' },
  navLegend: { flexDirection: 'row', gap: 16, marginTop: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: '#9CA3AF' },
  closeNavBtn: { backgroundColor: '#374151', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeNavBtnText: { color: '#F9FAFB', fontWeight: '700' },
});

export default TakeExamScreen;
