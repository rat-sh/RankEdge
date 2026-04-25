-- Auto-score exam attempts when submitted
-- This trigger calculates score, correct/incorrect/unattempted counts
-- and assigns ranks after each submission

CREATE OR REPLACE FUNCTION score_exam_attempt()
RETURNS TRIGGER AS $$
DECLARE
  v_questions JSONB;
  v_question RECORD;
  v_question_ids TEXT[];
  v_correct INT := 0;
  v_incorrect INT := 0;
  v_unattempted INT := 0;
  v_score NUMERIC := 0;
  v_student_answer JSONB;
  v_correct_answer JSONB;
  v_pos_marks NUMERIC;
  v_neg_marks NUMERIC;
  v_total_q INT;
BEGIN
  -- Get exam question_ids
  SELECT question_ids INTO v_question_ids
  FROM exams WHERE id = NEW.exam_id;

  IF v_question_ids IS NULL OR array_length(v_question_ids, 1) = 0 THEN
    RETURN NEW;
  END IF;

  v_total_q := array_length(v_question_ids, 1);

  -- Process each question
  FOR v_question IN
    SELECT id, correct_answer, positive_marks, negative_marks, type
    FROM questions
    WHERE id = ANY(v_question_ids)
  LOOP
    v_student_answer := NEW.answers -> v_question.id::text;
    v_correct_answer := v_question.correct_answer;
    v_pos_marks := COALESCE(v_question.positive_marks, 4);
    v_neg_marks := COALESCE(v_question.negative_marks, 0);

    IF v_student_answer IS NULL OR v_student_answer = 'null'::jsonb THEN
      v_unattempted := v_unattempted + 1;
    ELSIF v_student_answer = v_correct_answer THEN
      v_correct := v_correct + 1;
      v_score := v_score + v_pos_marks;
    ELSE
      v_incorrect := v_incorrect + 1;
      v_score := v_score - v_neg_marks;
    END IF;
  END LOOP;

  -- Update counts and score
  NEW.score := GREATEST(v_score, 0);
  NEW.correct_count := v_correct;
  NEW.incorrect_count := v_incorrect;
  NEW.unattempted_count := v_unattempted;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_score_exam_attempt ON exam_attempts;

-- Create trigger to fire on insert or update of answers
CREATE TRIGGER trg_score_exam_attempt
  BEFORE INSERT OR UPDATE OF answers
  ON exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION score_exam_attempt();

-- Function to recalculate ranks for all students in an exam (call after all submissions)
CREATE OR REPLACE FUNCTION update_exam_ranks(p_exam_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE exam_attempts ea
  SET rank = sub.row_num
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY exam_id ORDER BY score DESC, time_taken_seconds ASC NULLS LAST) as row_num
    FROM exam_attempts
    WHERE exam_id = p_exam_id
  ) sub
  WHERE ea.id = sub.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
