import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useRealtime } from '../hooks/useRealtime';
import StatsCards from '../components/dashboard/StatsCards';
import ProjectCard from '../components/dashboard/ProjectCard';
import NewTaskForm from '../components/dashboard/NewTaskForm';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { profile } = useAuth();
  const { projects, loading: projectsLoading } = useProjects(profile?.id);
  const [stats, setStats] = useState({ activeProjects: 0, openTasks: 0, completedThisWeek: 0, overdue: 0 });
  const [projectTasks, setProjectTasks] = useState({});
  const [projectMembers, setProjectMembers] = useState({});
  const [showNewTask, setShowNewTask] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id || projects.length === 0) return;
    const projectIds = projects.map(p => p.id);

    const { data: allTasks } = await supabase
      .from('tasks').select('*').in('project_id', projectIds);
    const tasks = allTasks || [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const tasksByProject = {};
    tasks.forEach(t => {
      if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = [];
      tasksByProject[t.project_id].push(t);
    });
    setProjectTasks(tasksByProject);

    setStats({
      activeProjects: projects.length,
      openTasks: tasks.filter(t => t.status !== 'completed').length,
      completedThisWeek: tasks.filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= weekAgo).length,
      overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'completed').length,
    });

    const { data: allMembers } = await supabase
      .from('project_members')
      .select('project_id, user_id, profile:user_id(id, username, avatar_color)')
      .in('project_id', projectIds);

    const membersByProject = {};
    (allMembers || []).forEach(m => {
      if (!membersByProject[m.project_id]) membersByProject[m.project_id] = [];
      if (m.profile) membersByProject[m.project_id].push(m.profile);
    });
    setProjectMembers(membersByProject);
  }, [profile?.id, projects]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useRealtime('tasks', null, useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]));

  async function handleCreateTask(taskData) {
    const { error } = await supabase.from('tasks').insert({ ...taskData, created_by: profile.id });
    if (error) throw error;
    fetchDashboardData();
  }

  const tasksThisWeek = Object.values(projectTasks).flat().filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return deadline <= weekFromNow && t.status !== 'completed';
  }).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {profile?.display_name || profile?.username || 'there'}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-hint)' }}>
            You have {tasksThisWeek} task{tasksThisWeek !== 1 ? 's' : ''} due this week
          </p>
        </div>
        <Button onClick={() => setShowNewTask(true)}>
          <Plus size={16} className="mr-1.5" /> New Task
        </Button>
      </div>

      <StatsCards stats={stats} />

      <div>
        <h2 className="text-[15px] font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Projects</h2>
        {projectsLoading ? (
          <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>No projects yet. Create one from the sidebar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project}
                tasks={projectTasks[project.id] || []}
                members={projectMembers[project.id] || []} />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title="New Task">
        <NewTaskForm projects={projects} onSubmit={handleCreateTask} onClose={() => setShowNewTask(false)} />
      </Modal>
    </div>
  );
}
