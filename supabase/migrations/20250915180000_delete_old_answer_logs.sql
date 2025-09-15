-- question_idがUUID形式（古いデータ）のレコードを削除します。
-- これにより、新しいテキストベースのIDを持つレコードのみが残ります。
DELETE FROM public.answer_logs 
WHERE question_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';