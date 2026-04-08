import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useAllMyTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import TaskRow from '../components/tasks/TaskRow';
import AnnouncementFeed from '../components/announcements/AnnouncementFeed';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';

export default function MyWork() {
  const { profile } = useAuth();
  const { tasks, loading: tasksLoading, fetchMyTasks } = useAllMyTasks(profile?.id);
  const { projects } = useProjects(profile?.id);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectProgress, setProjectProgress] = useState(0);

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const fetchProjectDetails = useCallback(async () => {
    if (!activeProjectId) return;
    const { data: project } = await supabase.from('projects').select('*').eq('id', activeProjectId).single();
    setActiveProject(project);

    const { data: members } = await supabase
      .from('project_members')
      .select('*, profile:user_id(id, username, avatar_color, roles)')
      .eq('project_id', activeProjectId);
    setProjectMembers(members?.map(m => m.profile).filter(Boolean) || []);

    const { data: projectTasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', activeProjectId);
    const total = projectTasks?.length || 0;
    const completed = projectTasks?.filter(t => t.status === 'completed').length || 0;
    setProjectProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
  }, [activeProjectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  async function handleToggleTask(task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    }).eq('id', task.id);
    fetchMyTasks();
    fetchProjectDetails();
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] max-w-6xl">
      <div className="w-1/2 overflow-y-auto space-y-3 pr-3">
        <h2 className="text-[15px] font-medium sticky top-0 py-2" style={{ color: 'var(--text-primary)', background: 'var(--bg-base)' }}>My Tasks</h2>
        {tasksLoading ? (
          <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-hint)' }}>No tasks assigned to you</p>
        ) : (
          tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              showProject
              onToggle={handleToggleTask}
            />
          ))
        )}
      </div>

      <div className="w-1/2 overflow-y-auto space-y-4 pl-3" style={{ borderLeft: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between sticky top-0 py-2" style={{ background: 'var(--bg-base)' }}>
          <h2 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Project Details</h2>
          <select
            value={activeProjectId || ''}
            onChange={e => setActiveProjectId(e.target.value)}
            className="text-[13px] rounded-lg px-2 py-1 outline-none"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {activeProject ? (
          <div className="space-y-4">
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{activeProject.name}</h3>
                <Badge status={activeProject.status || 'active'} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-hint)' }}>
                  <span>Progress</span>
                  <span>{projectProgress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${projectProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-hint)' }}>Team Members</h4>
              <div className="space-y-2">
                {projectMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar username={m.username} size="sm" />
                    <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{m.username}</span>
                    <Badge color="gray" className="ml-auto">{m.roles?.[0] || 'Member'}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-hint)' }}>Announcements</h4>
              <AnnouncementFeed projectId={activeProjectId} />
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-hint)' }}>Select a project</p>
        )}
      </div>
    </div>
  );
}
