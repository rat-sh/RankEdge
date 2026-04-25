CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('TEACHER', 'STUDENT');
CREATE TYPE batch_status AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE question_type AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'NUMERICAL', 'THEORETICAL', 'FILL_BLANK');
CREATE TYPE difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE');
CREATE TYPE live_class_status AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED');
CREATE TYPE payment_status AS ENUM ('PAID', 'DUE', 'OVERDUE');
CREATE TYPE submission_status AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'GRADED');

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT,
  role user_role NOT NULL, pin_hash TEXT NOT NULL,
  subject_list TEXT[] DEFAULT '{}', batch_ids UUID[] DEFAULT '{}',
  institution TEXT, city TEXT, state TEXT, avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL, subject TEXT NOT NULL, exam_category TEXT NOT NULL,
  join_code CHAR(8) NOT NULL UNIQUE, student_ids UUID[] DEFAULT '{}',
  schedule TEXT, max_students INT DEFAULT 100, status batch_status DEFAULT 'ACTIVE',
  fee_amount NUMERIC(10,2), fee_cycle TEXT, block_on_overdue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_ids UUID[] NOT NULL, teacher_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, duration_minutes INT NOT NULL, scheduled_at TIMESTAMPTZ,
  negative_marking_enabled BOOLEAN DEFAULT FALSE, shuffle_questions BOOLEAN DEFAULT FALSE,
  shuffle_options BOOLEAN DEFAULT FALSE, attempt_limit INT DEFAULT 1,
  cutoff_score NUMERIC(5,2), auto_publish_results BOOLEAN DEFAULT TRUE,
  is_results_released BOOLEAN DEFAULT FALSE, exam_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id), exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  type question_type NOT NULL, text TEXT NOT NULL, image_url TEXT, options TEXT[], option_images TEXT[],
  correct_answer JSONB, tolerance_min NUMERIC, tolerance_max NUMERIC,
  positive_marks NUMERIC NOT NULL DEFAULT 4, negative_marks NUMERIC NOT NULL DEFAULT 0,
  difficulty difficulty DEFAULT 'MEDIUM', chapter_tag TEXT NOT NULL, topic_tag TEXT, explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id), student_id UUID NOT NULL REFERENCES users(id),
  answers JSONB DEFAULT '{}', marked_for_review TEXT[] DEFAULT '{}',
  score NUMERIC(6,2) DEFAULT 0, correct_count INT DEFAULT 0, incorrect_count INT DEFAULT 0,
  unattempted_count INT DEFAULT 0, time_taken_seconds INT, rank INT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id), teacher_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, description TEXT, deadline TIMESTAMPTZ NOT NULL,
  max_marks NUMERIC(6,2) NOT NULL, attachment_urls TEXT[] DEFAULT '{}',
  accepts_file_upload BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id), student_id UUID NOT NULL REFERENCES users(id),
  file_url TEXT, text_content TEXT, submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_late BOOLEAN DEFAULT FALSE, status submission_status DEFAULT 'SUBMITTED',
  grade NUMERIC(6,2), feedback TEXT, graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id), teacher_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, file_url TEXT NOT NULL, file_type TEXT NOT NULL,
  subject TEXT NOT NULL, chapter TEXT NOT NULL, topic TEXT,
  is_pinned BOOLEAN DEFAULT FALSE, visible_to_all BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id), teacher_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, video_url TEXT NOT NULL, is_external BOOLEAN DEFAULT FALSE,
  lecture_number INT NOT NULL, subject TEXT NOT NULL, chapter TEXT NOT NULL,
  topic TEXT, exam_category TEXT, timestamps JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id), student_id UUID NOT NULL REFERENCES users(id),
  progress_percent NUMERIC(5,2) DEFAULT 0, last_position_seconds INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(lecture_id, student_id)
);

CREATE TABLE live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id), teacher_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, platform TEXT NOT NULL, meeting_link TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL, duration_minutes INT NOT NULL,
  status live_class_status DEFAULT 'SCHEDULED', recording_link TEXT,
  notes_urls TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES live_classes(id), batch_id UUID NOT NULL REFERENCES batches(id),
  student_id UUID NOT NULL REFERENCES users(id), status attendance_status NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(), is_auto_marked BOOLEAN DEFAULT FALSE,
  UNIQUE(class_id, student_id)
);

CREATE TABLE doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id), student_id UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL, chapter TEXT NOT NULL, content TEXT NOT NULL,
  image_url TEXT, is_resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doubt_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id UUID NOT NULL REFERENCES doubts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL, image_url TEXT, video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id), batch_id UUID NOT NULL REFERENCES batches(id),
  teacher_id UUID NOT NULL REFERENCES users(id), amount NUMERIC(10,2) NOT NULL,
  status payment_status DEFAULT 'DUE', paid_at TIMESTAMPTZ, due_date TIMESTAMPTZ NOT NULL,
  receipt_url TEXT, transaction_id TEXT, method TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id), title TEXT NOT NULL,
  company TEXT, type TEXT NOT NULL, difficulty difficulty DEFAULT 'MEDIUM',
  duration_minutes INT DEFAULT 30, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES interview_packs(id), student_id UUID NOT NULL REFERENCES users(id),
  score NUMERIC(6,2) NOT NULL, total_marks NUMERIC(6,2) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "batches_teacher" ON batches FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "batches_student" ON batches FOR SELECT USING (auth.uid() = ANY(student_ids));
CREATE POLICY "exams_teacher" ON exams FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "exams_student" ON exams FOR SELECT USING (
  EXISTS (SELECT 1 FROM batches b WHERE b.id = ANY(exams.batch_ids) AND auth.uid() = ANY(b.student_ids))
);
CREATE POLICY "attempts_student" ON exam_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "attempts_teacher" ON exam_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_attempts.exam_id AND e.teacher_id = auth.uid())
);

CREATE OR REPLACE FUNCTION generate_join_code() RETURNS TEXT AS $$
DECLARE chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; result TEXT := ''; i INT;
BEGIN
  FOR i IN 1..8 LOOP result := result || substr(chars, floor(random()*length(chars)+1)::int, 1); END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_batch_join_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL OR NEW.join_code = '' THEN
    LOOP NEW.join_code := generate_join_code(); EXIT WHEN NOT EXISTS (SELECT 1 FROM batches WHERE join_code = NEW.join_code); END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_join_code_trigger BEFORE INSERT ON batches FOR EACH ROW EXECUTE FUNCTION set_batch_join_code();
