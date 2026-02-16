-- Ensure pg_cron is available (reset drops extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Create ai_usage table for rate limiting AI pattern generation
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  tokens_used integer
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage records
CREATE POLICY "Users can read own usage" ON public.ai_usage
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Allow inserts from authenticated users (edge function uses service role,
-- but the policy covers direct access scenarios)
CREATE POLICY "Users can insert own usage" ON public.ai_usage
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Index for rate limit queries: lookup by user within a time window
CREATE INDEX idx_ai_usage_user_created ON public.ai_usage (user_id, created_at);

-- Schedule daily cleanup of records older than 48 hours (runs at 3:00 AM UTC)
SELECT cron.schedule(
  'cleanup-ai-usage',
  '0 3 * * *',
  $$DELETE FROM public.ai_usage WHERE created_at < now() - interval '48 hours'$$
);
