CREATE TABLE public.answer_logs (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id bigint NOT NULL,
    is_correct boolean NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.answer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert their own answers"
ON public.answer_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to read their own answers"
ON public.answer_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
