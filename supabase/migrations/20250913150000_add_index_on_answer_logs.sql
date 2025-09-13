-- answer_historyテーブルのuser_idカラムにインデックスを作成し、検索パフォーマンスを向上させます。
CREATE INDEX IF NOT EXISTS idx_answer_logs_user_id ON public.answer_logs (user_id);
