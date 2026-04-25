// Regenerate after every migration:
// bun run supabase:types
export type Database = {
  public: {
    Tables: {
      users: { Row: any; Insert: any; Update: any };
      batches: { Row: any; Insert: any; Update: any };
      exams: { Row: any; Insert: any; Update: any };
      questions: { Row: any; Insert: any; Update: any };
      exam_attempts: { Row: any; Insert: any; Update: any };
      assignments: { Row: any; Insert: any; Update: any };
      submissions: { Row: any; Insert: any; Update: any };
      notes: { Row: any; Insert: any; Update: any };
      lectures: { Row: any; Insert: any; Update: any };
      watch_progress: { Row: any; Insert: any; Update: any };
      live_classes: { Row: any; Insert: any; Update: any };
      attendance: { Row: any; Insert: any; Update: any };
      doubts: { Row: any; Insert: any; Update: any };
      doubt_replies: { Row: any; Insert: any; Update: any };
      payments: { Row: any; Insert: any; Update: any };
      interview_packs: { Row: any; Insert: any; Update: any };
      interview_attempts: { Row: any; Insert: any; Update: any };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: 'TEACHER' | 'STUDENT';
      batch_status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
      question_type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'NUMERICAL' | 'THEORETICAL' | 'FILL_BLANK';
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      attendance_status: 'PRESENT' | 'ABSENT' | 'LATE';
      live_class_status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
      payment_status: 'PAID' | 'DUE' | 'OVERDUE';
    };
  };
};
