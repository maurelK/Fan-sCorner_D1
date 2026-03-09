-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('fan', 'creator', 'admin')) DEFAULT 'fan' NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Creators profile table
CREATE TABLE IF NOT EXISTS public.creators_profile (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT,
  price_fcfa INTEGER DEFAULT 500 NOT NULL,
  category TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fan_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(fan_id, creator_id)
);

-- Payment requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  fan_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_provider TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending' NOT NULL,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  provider TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Post likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Post views table
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes avant de les recréer
-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view creators" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Creators profile policies
DROP POLICY IF EXISTS "Anyone can view creator profiles" ON public.creators_profile;
DROP POLICY IF EXISTS "Creators can update their own profile" ON public.creators_profile;
DROP POLICY IF EXISTS "Creators can insert their own profile" ON public.creators_profile;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Fans can create subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Fans can update their own subscriptions" ON public.subscriptions;

-- Payment requests policies
DROP POLICY IF EXISTS "Fans can create payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can update their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can manage all payment requests" ON public.payment_requests;

-- Payments policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- Posts policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can delete their own posts" ON public.posts;

-- Messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

-- Post interactions policies
DROP POLICY IF EXISTS "enable_all_for_post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "enable_all_for_post_comments" ON public.post_comments;
DROP POLICY IF EXISTS "enable_all_for_post_views" ON public.post_views;

-- Maintenant recréer TOUTES les politiques

-- 1. Users policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Creators profile policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_creators_profile" ON public.creators_profile
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Subscriptions policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_subscriptions" ON public.subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Payment requests policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_payment_requests" ON public.payment_requests
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Payments policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_payments" ON public.payments
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Posts policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_posts" ON public.posts
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Messages policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_messages" ON public.messages
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Post likes policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_post_likes" ON public.post_likes
  FOR ALL USING (true) WITH CHECK (true);

-- 9. Post comments policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_post_comments" ON public.post_comments
  FOR ALL USING (true) WITH CHECK (true);

-- 10. Post views policies (SIMPLE - pour tester)
CREATE POLICY "enable_all_for_post_views" ON public.post_views
  FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'fan')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_creators_profile_user_id ON public.creators_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_profile_category ON public.creators_profile(category);
CREATE INDEX IF NOT EXISTS idx_creators_profile_price ON public.creators_profile(price_fcfa);

CREATE INDEX IF NOT EXISTS idx_subscriptions_fan_id ON public.subscriptions(fan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON public.subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_requests_fan_id ON public.payment_requests(fan_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_creator_id ON public.payment_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON public.payment_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.creators_profile TO authenticated;
GRANT ALL ON public.creators_profile TO service_role;
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
GRANT ALL ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
GRANT ALL ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;

-- Insérer quelques données de test
INSERT INTO public.users (id, email, full_name, role) 
VALUES 
  ('fb645fa5-24d9-4959-8fb9-32e65e429110', 'test@creator.com', 'Test Creator', 'creator'),
  ('11111111-1111-1111-1111-111111111111', 'test@fan.com', 'Test Fan', 'fan')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.creators_profile (user_id, bio, price_fcfa, category)
VALUES 
  ('fb645fa5-24d9-4959-8fb9-32e65e429110', 'Créateur de test', 500, 'humor')
ON CONFLICT (user_id) DO UPDATE 
SET bio = EXCLUDED.bio, price_fcfa = EXCLUDED.price_fcfa, category = EXCLUDED.category;