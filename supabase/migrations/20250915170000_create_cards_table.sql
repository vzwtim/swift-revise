CREATE TABLE IF NOT EXISTS public.cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  interval INTEGER NOT NULL,
  repetitions INTEGER NOT NULL,
  ease_factor REAL NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  last_reviewed TIMESTAMPTZ,
  consecutive_correct_answers INTEGER NOT NULL,
  needs_review BOOLEAN NOT NULL,
  mastery_level TEXT NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);
