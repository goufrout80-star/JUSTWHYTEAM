import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';

export function useTasks(projectId, userId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      }, () => { fetchTasks(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchTasks]);

  async function createTask(task) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, project_id: projectId, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    await logActivity(userId, projectId, 'create_task', { title: data.title });
    if (task.assigned_to && task.assigned_to !== userId) {
      await supabase.from('notifications').insert({
        user_id: task.assigned_to,
        type: 'task_assigned',
        title: 'New task assigned to you',
        body: data.title,
        related_id: data.id,
      });
    }
    await fetchTasks();
    return data;
  }

  async function updateTask(taskId, updates) {
    const upd = { ...updates };
    if (updates.status === 'completed') upd.completed_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('tasks').update(upd).eq('id', taskId).select().single();
    if (error) throw error;
    const action = updates.status === 'completed' ? 'complete_task' : 'update_task';
    await logActivity(userId, projectId, action, { title: data.title });
    await fetchTasks();
    return data;
  }

  async function deleteTask(taskId) {
    await supabase.from('tasks').delete().eq('id', taskId);
    await fetchTasks();
  }

  return { tasks, loading, fetchTasks, createTask, updateTask, deleteTask };
}

export function useAllMyTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*, projects:project_id(id, name, color)')
      .eq('assigned_to', userId)
      .order('deadline', { ascending: true, nullsFirst: false });
    setTasks(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchMyTasks(); }, [fetchMyTasks]);
  return { tasks, loading, fetchMyTasks };
}
