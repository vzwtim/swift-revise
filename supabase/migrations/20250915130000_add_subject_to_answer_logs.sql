-- Add the subject column, allowing NULLs for now
ALTER TABLE public.answer_logs
ADD COLUMN subject TEXT;

-- Update existing rows with a default subject
-- Assuming all existing questions are for 'ares'
UPDATE public.answer_logs
SET subject = 'ares'
WHERE subject IS NULL;

-- Now that all rows have a value, add the NOT NULL constraint
ALTER TABLE public.answer_logs
ALTER COLUMN subject SET NOT NULL;

-- Add an index for efficient querying by user and subject.
CREATE INDEX idx_answer_logs_user_id_subject ON public.answer_logs (user_id, subject);
