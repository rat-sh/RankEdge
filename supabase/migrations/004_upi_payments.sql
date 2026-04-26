-- Migration 004: UPI QR-based payment flow
-- Adds UPI QR URL to teacher profile, enriches payments with slip/notes,
-- and creates payment_notifications for real-time teacher alerts.

-- 1. Teacher UPI QR on their profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_qr_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- 2. Enrich payments table with slip and payment reference
ALTER TABLE payments ADD COLUMN IF NOT EXISTS slip_image_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS upi_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Payment notifications table (teacher gets notified when student claims payment)
CREATE TABLE IF NOT EXISTS payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  batch_id UUID NOT NULL REFERENCES batches(id),
  amount NUMERIC(10,2) NOT NULL,
  upi_reference TEXT,
  slip_image_url TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- Teacher can read/update their own notifications
CREATE POLICY "notif_teacher_read" ON payment_notifications
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "notif_teacher_update" ON payment_notifications
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Students can insert notifications for their teacher
CREATE POLICY "notif_student_insert" ON payment_notifications
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Enable realtime on this table so teachers get live push
ALTER PUBLICATION supabase_realtime ADD TABLE payment_notifications;
