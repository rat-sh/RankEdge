-- Exam session token for secure entry
ALTER TABLE exams ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;

-- Generate unique session token when teacher starts exam
CREATE OR REPLACE FUNCTION start_exam_session(p_exam_id UUID, p_duration_minutes INT)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate 12-char alphanumeric token
  v_token := upper(substr(md5(random()::text || p_exam_id::text), 1, 6)) || 
             '-' || 
             upper(substr(md5(random()::text || now()::text), 1, 6));
  
  UPDATE exams SET
    session_token = v_token,
    session_started_at = NOW(),
    session_expires_at = NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
    is_live = TRUE
  WHERE id = p_exam_id AND teacher_id = auth.uid();
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate session token before exam entry
CREATE OR REPLACE FUNCTION validate_exam_session(p_exam_id UUID, p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM exams
    WHERE id = p_exam_id
    AND session_token = p_token
    AND is_live = TRUE
    AND session_expires_at > NOW()
  ) INTO v_valid;
  
  RETURN v_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End exam session
CREATE OR REPLACE FUNCTION end_exam_session(p_exam_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE exams SET
    is_live = FALSE,
    session_token = NULL
  WHERE id = p_exam_id AND teacher_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
