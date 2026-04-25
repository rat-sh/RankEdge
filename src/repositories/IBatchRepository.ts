export interface IBatchRepository {
  getTeacherBatches(teacherId: string): Promise<any[]>;
  getBatchById(id: string): Promise<any | null>;
  createBatch(data: any): Promise<any>;
  updateBatch(id: string, data: any): Promise<any>;
  archiveBatch(id: string): Promise<void>;
  enrollStudent(batchId: string, studentId: string): Promise<void>;
  removeStudent(batchId: string, studentId: string): Promise<void>;
  getBatchByJoinCode(code: string): Promise<any | null>;
}
