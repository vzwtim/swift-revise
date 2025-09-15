-- cardsテーブルの行レベルセキュリティを一時的に無効にします。
-- TRUNCATEを実行するために必要です。
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;

-- cardsテーブルのすべてのデータを高速に削除します。
TRUNCATE TABLE public.cards;

-- cardsテーブルの行レベルセキュリティを再度有効にします。
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;