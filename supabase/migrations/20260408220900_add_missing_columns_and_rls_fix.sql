-- ============================================================
-- Migration: add missing columns + RLS fix + data integrity
-- ============================================================

-- 1. Add banned column to profiles (used in auth but missing from schema)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false;

-- 2. Fix project_members RLS infinite recursion (re-apply with correct alias)
DROP POLICY IF EXISTS "members see members" ON public.project_members;
CREATE POLICY "members see members" ON public.project_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = public.project_members.project_id
    AND pm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- 3. Ensure workspace row exists
INSERT INTO public.workspace (id, name)
VALUES (1, 'Just Why Team')
ON CONFLICT (id) DO NOTHING;

-- 4. Ensure abdu is super admin (safe — only updates if user exists)
UPDATE public.profiles
SET is_super_admin = true
WHERE username = 'abdu' AND is_super_admin = false;

-- 5. Add CHECK constraints for data integrity
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS valid_priority,
  ADD CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low'));

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS valid_status,
  ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed'));

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS valid_type,
  ADD CONSTRAINT valid_type CHECK (type IN ('required', 'optional', 'bug', 'improvement'));

ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS valid_permission,
  ADD CONSTRAINT valid_permission CHECK (permission IN ('viewer', 'contributor', 'admin'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS username_length,
  ADD CONSTRAINT username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 30);

-- 6. Add index on profiles.banned for fast ban checks on login
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(banned) WHERE banned = true;

-- 7. Clean up expired verification codes (keep DB tidy)
DELETE FROM public.verification_codes
WHERE expires_at < now() OR used = true;
