import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';

export function useProjects(userId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function createProject(project) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, owner_id: userId })
      .select()
      .single();
    if (error) throw error;
    await supabase.from('project_members').insert({
      project_id: data.id, user_id: userId, permission: 'admin',
    });
    await logActivity(userId, data.id, 'create_project', { name: data.name });
    await fetchProjects();
    return data;
  }

  async function updateProject(projectId, updates) {
    const { data, error } = await supabase
      .from('projects').update(updates).eq('id', projectId).select().single();
    if (error) throw error;
    await logActivity(userId, projectId, 'update_project', updates);
    await fetchProjects();
    return data;
  }

  async function deleteProject(projectId) {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
    await logActivity(userId, projectId, 'delete_project', {});
    await fetchProjects();
  }

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
}
