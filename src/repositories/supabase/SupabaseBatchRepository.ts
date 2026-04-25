import { supabase } from '@/lib/supabase/client';
import type { IBatchRepository } from '../IBatchRepository';

export class SupabaseBatchRepository implements IBatchRepository {
  async getTeacherBatches(teacherId: string) {
    const { data, error } = await supabase.from('batches').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  async getBatchById(id: string) {
    const { data, error } = await supabase.from('batches').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }
  async createBatch(data: any) {
    const { data: batch, error } = await supabase.from('batches').insert(data).select().single();
    if (error) throw error;
    return batch;
  }
  async updateBatch(id: string, data: any) {
    const { data: batch, error } = await supabase.from('batches').update(data).eq('id', id).select().single();
    if (error) throw error;
    return batch;
  }
  async archiveBatch(id: string) {
    const { error } = await supabase.from('batches').update({ status: 'ARCHIVED' }).eq('id', id);
    if (error) throw error;
  }
  async enrollStudent(batchId: string, studentId: string) {
    const { error } = await supabase.rpc('enroll_student', { p_batch_id: batchId, p_student_id: studentId });
    if (error) throw error;
  }
  async removeStudent(batchId: string, studentId: string) {
    const { error } = await supabase.rpc('remove_student', { p_batch_id: batchId, p_student_id: studentId });
    if (error) throw error;
  }
  async getBatchByJoinCode(code: string) {
    const { data, error } = await supabase.from('batches').select('*').eq('join_code', code.toUpperCase()).eq('status', 'ACTIVE').single();
    if (error) return null;
    return data;
  }
}
