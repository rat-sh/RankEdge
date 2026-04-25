import { supabase } from '@/lib/supabase/client';

// Teacher: start exam and get session token
export const startExamSession = async (examId: string, durationMinutes: number) => {
  const { data, error } = await supabase.rpc('start_exam_session', {
    p_exam_id: examId,
    p_duration_minutes: durationMinutes,
  });
  if (error) throw error;
  return data as string; // returns token like "ABC123-DEF456"
};

// Teacher: end exam session
export const endExamSession = async (examId: string) => {
  const { error } = await supabase.rpc('end_exam_session', {
    p_exam_id: examId,
  });
  if (error) throw error;
};

// Student: validate token before entering exam
export const validateExamSession = async (examId: string, token: string) => {
  const { data, error } = await supabase.rpc('validate_exam_session', {
    p_exam_id: examId,
    p_token: token.toUpperCase(),
  });
  if (error) throw error;
  return data as boolean;
};

// Student: get live exams for their batches
export const getLiveExams = async (batchIds: string[]) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('is_live', true)
    .overlaps('batch_ids', batchIds);
  if (error) throw error;
  return data ?? [];
};

// Get exam by id
export const getExamById = async (examId: string) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();
  if (error) throw error;
  return data;
};

// Submit exam attempt
export const submitExamAttempt = async (payload: {
  examId: string;
  studentId: string;
  answers: Record<string, any>;
  markedForReview: string[];
  timeTakenSeconds: number;
}) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .upsert({
      exam_id: payload.examId,
      student_id: payload.studentId,
      answers: payload.answers,
      marked_for_review: payload.markedForReview,
      time_taken_seconds: payload.timeTakenSeconds,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};
