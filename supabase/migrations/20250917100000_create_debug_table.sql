CREATE TABLE public.debug_raw_user_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    meta_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);