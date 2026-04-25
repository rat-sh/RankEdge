// Regenerate after every migration:
// bun run supabase:types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: 'TEACHER' | 'STUDENT';
          pin_hash: string;
          subject_list: string[];
          batch_ids: string[];
          institution: string | null;
          city: string | null;
          state: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & { id: string; name: string; email: string; role: 'TEACHER' | 'STUDENT'; pin_hash: string };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      batches: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          subject: string;
          exam_category: string;
          join_code: string;
          student_ids: string[];
          schedule: string | null;
          max_students: number;
          status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
          fee_amount: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['batches']['Row'], 'id' | 'join_code' | 'created_at' | 'student_ids' | 'status'> & { id?: string; join_code?: string; created_at?: string; student_ids?: string[]; status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' };
        Update: Partial<Database['public']['Tables']['batches']['Row']>;
      };
      exams: {
        Row: {
          id: string;
          batch_ids: string[];
          teacher_id: string;
          title: string;
          duration_minutes: number;
          scheduled_at: string | null;
          negative_marking_enabled: boolean;
          shuffle_questions: boolean;
          shuffle_options: boolean;
          attempt_limit: number;
          cutoff_score: number | null;
          auto_publish_results: boolean;
          is_results_released: boolean;
          exam_category: string | null;
          question_ids: string[] | null;
          session_token: string | null;
          session_started_at: string | null;
          session_expires_at: string | null;
          is_live: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['exams']['Row']>;
      };
      questions: {
        Row: {
          id: string;
          teacher_id: string;
          exam_id: string | null;
          type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'NUMERICAL' | 'THEORETICAL' | 'FILL_BLANK';
          text: string;
          image_url: string | null;
          options: string[] | null;
          option_images: string[] | null;
          correct_answer: unknown;
          tolerance_min: number | null;
          tolerance_max: number | null;
          positive_marks: number;
          negative_marks: number;
          difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
          chapter_tag: string;
          topic_tag: string | null;
          explanation: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['questions']['Row']>;
      };
      exam_attempts: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          answers: Record<string, unknown>;
          marked_for_review: string[];
          score: number;
          correct_count: number;
          incorrect_count: number;
          unattempted_count: number;
          time_taken_seconds: number | null;
          rank: number | null;
          submitted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exam_attempts']['Row'], 'id' | 'submitted_at' | 'score' | 'correct_count' | 'incorrect_count' | 'unattempted_count' | 'rank'> & { id?: string; submitted_at?: string; score?: number; correct_count?: number; incorrect_count?: number; unattempted_count?: number; rank?: number | null };
        Update: Partial<Database['public']['Tables']['exam_attempts']['Row']>;
      };
      assignments: {
        Row: {
          id: string;
          batch_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          deadline: string;
          max_marks: number;
          attachment_urls: string[];
          accepts_file_upload: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['assignments']['Row']>;
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          file_url: string | null;
          text_content: string | null;
          submitted_at: string;
          is_late: boolean;
          status: 'SUBMITTED' | 'GRADED' | 'RETURNED';
          grade: number | null;
          feedback: string | null;
          graded_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'submitted_at'> & { id?: string; submitted_at?: string };
        Update: Partial<Database['public']['Tables']['submissions']['Row']>;
      };
      notes: {
        Row: { id: string; batch_id: string; teacher_id: string; title: string; file_url: string; file_type: string; subject: string; chapter: string; topic: string | null; is_pinned: boolean; visible_to_all: boolean; created_at: string };
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['notes']['Row']>;
      };
      lectures: {
        Row: { id: string; batch_id: string; teacher_id: string; title: string; video_url: string; is_external: boolean; lecture_number: number; subject: string; chapter: string; topic: string | null; exam_category: string | null; timestamps: unknown; created_at: string };
        Insert: Omit<Database['public']['Tables']['lectures']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['lectures']['Row']>;
      };
      watch_progress: {
        Row: { id: string; lecture_id: string; student_id: string; progress_percent: number; last_position_seconds: number; updated_at: string };
        Insert: Omit<Database['public']['Tables']['watch_progress']['Row'], 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['watch_progress']['Row']>;
      };
      live_classes: {
        Row: { id: string; batch_id: string; teacher_id: string; title: string; platform: string; meeting_link: string; scheduled_at: string; duration_minutes: number; status: 'SCHEDULED' | 'LIVE' | 'COMPLETED'; recording_link: string | null; notes_urls: string[]; created_at: string };
        Insert: Omit<Database['public']['Tables']['live_classes']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['live_classes']['Row']>;
      };
      attendance: {
        Row: { id: string; class_id: string; batch_id: string; student_id: string; status: 'PRESENT' | 'ABSENT' | 'LATE'; timestamp: string; is_auto_marked: boolean };
        Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'timestamp'> & { id?: string; timestamp?: string };
        Update: Partial<Database['public']['Tables']['attendance']['Row']>;
      };
      doubts: {
        Row: { id: string; batch_id: string; student_id: string; subject: string; chapter: string; content: string; image_url: string | null; is_resolved: boolean; created_at: string };
        Insert: Omit<Database['public']['Tables']['doubts']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['doubts']['Row']>;
      };
      doubt_replies: {
        Row: { id: string; doubt_id: string; author_id: string; content: string; image_url: string | null; video_url: string | null; created_at: string };
        Insert: Omit<Database['public']['Tables']['doubt_replies']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['doubt_replies']['Row']>;
      };
      payments: {
        Row: { id: string; student_id: string; batch_id: string; teacher_id: string; amount: number; status: 'PAID' | 'DUE' | 'OVERDUE'; paid_at: string | null; due_date: string; receipt_url: string | null; transaction_id: string | null; method: string | null; created_at: string };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      interview_packs: {
        Row: { id: string; teacher_id: string; title: string; company: string | null; type: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; duration_minutes: number; created_at: string };
        Insert: Omit<Database['public']['Tables']['interview_packs']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['interview_packs']['Row']>;
      };
      interview_attempts: {
        Row: { id: string; pack_id: string; student_id: string; score: number; total_marks: number; completed_at: string };
        Insert: Omit<Database['public']['Tables']['interview_attempts']['Row'], 'id' | 'completed_at'> & { id?: string; completed_at?: string };
        Update: Partial<Database['public']['Tables']['interview_attempts']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_exam_session: {
        Args: { p_exam_id: string; p_duration_minutes: number };
        Returns: string;
      };
      end_exam_session: {
        Args: { p_exam_id: string };
        Returns: void;
      };
      validate_exam_session: {
        Args: { p_exam_id: string; p_token: string };
        Returns: boolean;
      };
      add_student_to_batch: {
        Args: { p_batch_id: string; p_student_id: string };
        Returns: void;
      };
      remove_student_from_batch: {
        Args: { p_batch_id: string; p_student_id: string };
        Returns: void;
      };
      update_exam_ranks: {
        Args: { p_exam_id: string };
        Returns: void;
      };
    };
    Enums: {
      user_role: 'TEACHER' | 'STUDENT';
      batch_status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
      question_type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'NUMERICAL' | 'THEORETICAL' | 'FILL_BLANK';
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      attendance_status: 'PRESENT' | 'ABSENT' | 'LATE';
      live_class_status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
      payment_status: 'PAID' | 'DUE' | 'OVERDUE';
      submission_status: 'SUBMITTED' | 'GRADED' | 'RETURNED';
    };
  };
};
