-- Fix: project_members RLS infinite recursion
-- The old policy used pm.project_id = project_id which was self-referential.
-- Use fully-qualified table name to avoid ambiguous column reference.

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
