import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseBatchRepository } from '@/repositories/supabase/SupabaseBatchRepository';
import { useAuthStore } from '@/store/auth/authStore';

const repo = new SupabaseBatchRepository();

export const batchKeys = {
  all: ['batches'] as const,
  teacher: (id: string) => ['batches', 'teacher', id] as const,
  detail: (id: string) => ['batches', 'detail', id] as const,
};

export const useTeacherBatches = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: batchKeys.teacher(user?.id ?? ''),
    queryFn: () => repo.getTeacherBatches(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
};

export const useBatchDetail = (batchId: string) =>
  useQuery({
    queryKey: batchKeys.detail(batchId),
    queryFn: () => repo.getBatchById(batchId),
    enabled: !!batchId,
  });

export const useCreateBatch = () => {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: repo.createBatch.bind(repo),
    onSuccess: () => qc.invalidateQueries({ queryKey: batchKeys.teacher(user?.id ?? '') }),
  });
};
