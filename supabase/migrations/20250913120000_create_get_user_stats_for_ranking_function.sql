CREATE OR REPLACE FUNCTION get_user_stats_for_ranking(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  total_answers bigint,
  correct_answers bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ah.user_id,
    count(ah.id) AS total_answers,
    count(CASE WHEN ah.is_correct THEN 1 END) AS correct_answers
  FROM
    answer_history AS ah
  WHERE
    ah.user_id = ANY(p_user_ids)
  GROUP BY
    ah.user_id;
END;
$$ LANGUAGE plpgsql;
