-- 日次・週次ランキングをDB側で集計する関数（3クエリ→1クエリに削減）

CREATE OR REPLACE FUNCTION get_daily_study_ranking_v2(
  from_time timestamptz,
  p_categories text[] DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  count bigint,
  username text,
  avatar_url text,
  bio text,
  department text,
  acquired_qualifications text[],
  studying_categories text[],
  total_answers bigint,
  correct_answers bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT al.user_id, COUNT(*) AS answer_count
    FROM answer_logs al
    WHERE al.created_at >= from_time
      AND (p_categories IS NULL OR cardinality(p_categories) = 0 OR al.subject = ANY(p_categories))
    GROUP BY al.user_id
    ORDER BY answer_count DESC
    LIMIT 10
  ),
  stats AS (
    SELECT al.user_id,
           COUNT(*) AS total_answers,
           COUNT(*) FILTER (WHERE al.is_correct) AS correct_answers
    FROM answer_logs al
    WHERE al.user_id IN (SELECT r.user_id FROM ranked r)
    GROUP BY al.user_id
  )
  SELECT
    r.user_id,
    r.answer_count,
    COALESCE(p.username, '名無しさん'),
    p.avatar_url,
    p.bio,
    p.department,
    p.acquired_qualifications,
    COALESCE(p.studying_categories, ARRAY['ares', 'takken']),
    COALESCE(s.total_answers, 0),
    COALESCE(s.correct_answers, 0)
  FROM ranked r
  LEFT JOIN profiles p ON p.id = r.user_id
  LEFT JOIN stats s ON s.user_id = r.user_id
  ORDER BY r.answer_count DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_weekly_study_ranking_v2(
  from_time timestamptz,
  p_categories text[] DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  count bigint,
  username text,
  avatar_url text,
  bio text,
  department text,
  acquired_qualifications text[],
  studying_categories text[],
  total_answers bigint,
  correct_answers bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT al.user_id, COUNT(*) AS answer_count
    FROM answer_logs al
    WHERE al.created_at >= from_time
      AND (p_categories IS NULL OR cardinality(p_categories) = 0 OR al.subject = ANY(p_categories))
    GROUP BY al.user_id
    ORDER BY answer_count DESC
    LIMIT 10
  ),
  stats AS (
    SELECT al.user_id,
           COUNT(*) AS total_answers,
           COUNT(*) FILTER (WHERE al.is_correct) AS correct_answers
    FROM answer_logs al
    WHERE al.user_id IN (SELECT r.user_id FROM ranked r)
    GROUP BY al.user_id
  )
  SELECT
    r.user_id,
    r.answer_count,
    COALESCE(p.username, '名無しさん'),
    p.avatar_url,
    p.bio,
    p.department,
    p.acquired_qualifications,
    COALESCE(p.studying_categories, ARRAY['ares', 'takken']),
    COALESCE(s.total_answers, 0),
    COALESCE(s.correct_answers, 0)
  FROM ranked r
  LEFT JOIN profiles p ON p.id = r.user_id
  LEFT JOIN stats s ON s.user_id = r.user_id
  ORDER BY r.answer_count DESC;
END;
$$;

-- created_atにインデックスを追加（時間範囲クエリの高速化）
CREATE INDEX IF NOT EXISTS idx_answer_logs_created_at ON public.answer_logs (created_at);
