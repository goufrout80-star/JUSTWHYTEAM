DROP POLICY IF EXISTS "members see project" ON public.projects;
DROP POLICY IF EXISTS "super admin sees all projects" ON public.projects;
DROP POLICY IF EXISTS "projects access" ON public.projects;

CREATE POLICY "projects access" ON public.projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
  )
  OR (
    SELECT is_super_admin FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  ) = true
);
