import { supabase } from '@/lib/supabase/client';

const sb = supabase as any;

// Teacher: start exam and get session token
export const startExamSession = async (examId: string, durationMinutes: number): Promise<string> => {
  const { data, error } = await sb.rpc('start_exam_session', {
    p_exam_id: examId,
    p_duration_minutes: durationMinutes,
  });
  if (error) throw error;
  return data as string;
};

// Teacher: end exam session
export const endExamSession = async (examId: string): Promise<void> => {
  const { error } = await sb.rpc('end_exam_session', {
    p_exam_id: examId,
  });
  if (error) throw error;
};

// Student: validate token before entering exam
export const validateExamSession = async (examId: string, token: string): Promise<boolean> => {
  const { data, error } = await sb.rpc('validate_exam_session', {
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
  const { data, error } = await (supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single() as any) as { data: any; error: any };
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
  const { data, error } = await (supabase
    .from('exam_attempts') as any)
    .upsert({
      exam_id: payload.examId,
      student_id: payload.studentId,
      answers: payload.answers,
      marked_for_review: payload.markedForReview,
      time_taken_seconds: payload.timeTakenSeconds,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single() as { data: any; error: any };
  if (error) throw error;
  return data;
};
