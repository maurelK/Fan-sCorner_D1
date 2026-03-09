-- Incremental migration: create post_views table for content view analytics

CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enable_all_for_post_views" ON public.post_views;
CREATE POLICY "enable_all_for_post_views" ON public.post_views
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(created_at DESC);

GRANT ALL ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;
