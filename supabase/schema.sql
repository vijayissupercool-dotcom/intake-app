-- Intake - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOOGLE CONNECTIONS TABLE
-- ============================================================
CREATE TABLE public.google_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ,
  google_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- REQUESTS TABLE
-- ============================================================
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  drive_folder_id TEXT NOT NULL,
  drive_folder_name TEXT,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  max_files INTEGER DEFAULT 10,
  max_file_size_mb INTEGER DEFAULT 50,
  allowed_file_types TEXT[],
  notify_email BOOLEAN DEFAULT TRUE,
  upload_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPLOADS TABLE
-- ============================================================
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'uploaded', 'queued', 'transferring', 'completed', 'failed', 'dead_letter')),
  drive_file_id TEXT,
  drive_file_url TEXT,
  uploader_name TEXT,
  uploader_email TEXT,
  error_message TEXT,
  transfer_attempts INTEGER DEFAULT 0,
  last_transfer_error TEXT,
  idempotency_key TEXT,
  uploaded_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSFER JOBS TABLE
-- ============================================================
CREATE TABLE public.transfer_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'claimed', 'processing', 'completed', 'failed', 'dead_letter')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  available_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_requests_user_id ON public.requests(user_id);
CREATE INDEX idx_requests_token ON public.requests(token);
CREATE INDEX idx_requests_token_hash ON public.requests(token_hash);
CREATE INDEX idx_requests_active ON public.requests(active);
CREATE INDEX idx_uploads_request_id ON public.uploads(request_id);
CREATE INDEX idx_uploads_status ON public.uploads(status);
CREATE INDEX idx_uploads_uploaded_at ON public.uploads(uploaded_at);
CREATE INDEX idx_transfer_jobs_status ON public.transfer_jobs(status);
CREATE INDEX idx_transfer_jobs_available_at ON public.transfer_jobs(available_at);
CREATE INDEX idx_transfer_jobs_upload_id ON public.transfer_jobs(upload_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Atomic check-and-increment to prevent race conditions on file count
CREATE OR REPLACE FUNCTION check_and_increment_upload_count(p_request_id UUID, p_max_files INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Lock the row to prevent concurrent inserts
  SELECT upload_count INTO current_count
  FROM public.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF current_count >= p_max_files THEN
    RETURN FALSE;
  END IF;

  UPDATE public.requests
  SET upload_count = upload_count + 1
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment upload count (legacy, kept for compatibility)
CREATE OR REPLACE FUNCTION increment_upload_count(request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.requests
  SET upload_count = upload_count + 1
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Atomic job claiming with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION claim_transfer_jobs(p_batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  upload_id UUID,
  status TEXT,
  attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.transfer_jobs AS tj
  SET
    status = 'claimed',
    started_at = NOW(),
    attempts = attempts + 1
  FROM (
    SELECT tj2.id
    FROM public.transfer_jobs tj2
    WHERE tj2.status = 'queued'
      AND tj2.available_at <= NOW()
    ORDER BY tj2.available_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ) AS claimed
  WHERE tj.id = claimed.id
  RETURNING tj.id, tj.upload_id, tj.status, tj.attempts;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Google connections: users can manage their own
CREATE POLICY "Users can view own google connection" ON public.google_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own google connection" ON public.google_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own google connection" ON public.google_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own google connection" ON public.google_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Requests: users can manage their own
CREATE POLICY "Users can view own requests" ON public.requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests" ON public.requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests" ON public.requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests" ON public.requests
  FOR DELETE USING (auth.uid() = user_id);

-- Uploads: linked to requests
CREATE POLICY "Users can view uploads for own requests" ON public.uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = uploads.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- Service role can manage all uploads (for transfer pipeline)
CREATE POLICY "Service role can manage all uploads" ON public.uploads
  FOR ALL USING (true);

-- Transfer jobs: service role only
CREATE POLICY "Service role can manage transfer jobs" ON public.transfer_jobs
  FOR ALL USING (true);

-- Notifications: users can manage their own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_google_connections_updated_at
  BEFORE UPDATE ON public.google_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transfer_jobs_updated_at
  BEFORE UPDATE ON public.transfer_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
