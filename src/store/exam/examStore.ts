import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ExamAttemptState {
  examId: string | null;
  answers: Record<string, string | string[] | number>;
  markedForReview: string[];
  currentQuestionIndex: number;
  startedAt: number | null;
  startAttempt: (examId: string) => void;
  setAnswer: (questionId: string, answer: string | string[] | number) => void;
  toggleReview: (questionId: string) => void;
  setCurrentQuestion: (index: number) => void;
  clearAttempt: () => void;
}

export const useExamStore = create<ExamAttemptState>()(
  immer((set) => ({
    examId: null,
    answers: {},
    markedForReview: [],
    currentQuestionIndex: 0,
    startedAt: null,
    startAttempt: (examId) => set((s) => { s.examId = examId; s.answers = {}; s.markedForReview = []; s.currentQuestionIndex = 0; s.startedAt = Date.now(); }),
    setAnswer: (qId, answer) => set((s) => { s.answers[qId] = answer; }),
    toggleReview: (qId) => set((s) => {
      const i = s.markedForReview.indexOf(qId);
      i === -1 ? s.markedForReview.push(qId) : s.markedForReview.splice(i, 1);
    }),
    setCurrentQuestion: (i) => set((s) => { s.currentQuestionIndex = i; }),
    clearAttempt: () => set((s) => { s.examId = null; s.answers = {}; s.markedForReview = []; s.currentQuestionIndex = 0; s.startedAt = null; }),
  }))
);
