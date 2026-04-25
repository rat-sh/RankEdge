import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  selectedTeacherId: string | null;
  isOffline: boolean;
  isExamMode: boolean;
  activeExamId: string | null;
  selectTeacher: (id: string | null) => void;
  setOffline: (v: boolean) => void;
  enterExamMode: (examId: string) => void;
  exitExamMode: () => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    selectedTeacherId: null,
    isOffline: false,
    isExamMode: false,
    activeExamId: null,
    selectTeacher: (id) => set((s) => { s.selectedTeacherId = id; }),
    setOffline: (v) => set((s) => { s.isOffline = v; }),
    enterExamMode: (examId) => set((s) => { s.isExamMode = true; s.activeExamId = examId; }),
    exitExamMode: () => set((s) => { s.isExamMode = false; s.activeExamId = null; }),
  }))
);
