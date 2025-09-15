CREATE OR REPLACE FUNCTION public.get_my_stats(p_subject TEXT DEFAULT NULL)
RETURNS TABLE (
    total_answers BIGINT,
    correct_answers BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(al.id) AS total_answers,
        COUNT(CASE WHEN al.is_correct THEN 1 END) AS correct_answers
    FROM
        public.answer_logs AS al
    WHERE
        al.user_id = auth.uid()
        AND (p_subject IS NULL OR al.subject = p_subject);
END;
$$;
