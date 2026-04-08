import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Trash2, Copy, Check, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { useRealtime } from '../hooks/useRealtime';
import { logActivity } from '../lib/activityLogger';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import KanbanBoard from '../components/tasks/KanbanBoard';
import ChatWindow from '../components/chat/ChatWindow';
import AnnouncementFeed from '../components/announcements/AnnouncementFeed';
import NewTaskForm from '../components/dashboard/NewTaskForm';
import TimeTracker from '../components/tasks/TimeTracker';
import { toast } from '../components/ui/Toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin } = useAuth();
  const { tasks, fetchTasks, createTask, updateTask } = useTasks(id, profile?.id);
  const timer = useTimeTracker(profile?.id);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showNewTask, setShowNewTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single();
    if (!data) { navigate('/dashboard'); return; }
    setProject(data);
    setEditForm(data);
    setLoading(false);
  }, [id, navigate]);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('project_members')
      .select('*, profile:user_id(id, username, email, avatar_color, roles)')
      .eq('project_id', id);
    setMembers(data?.map(d => ({ ...d.profile, permission: d.permission, membership_id: d.id })) || []);
  }, [id]);

  useEffect(() => { fetchProject(); fetchMembers(); }, [fetchProject, fetchMembers]);

  useRealtime('tasks', { column: 'project_id', value: id }, useCallback(() => { fetchTasks(); }, [fetchTasks]));

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pct = project?.progress ?? (total > 0 ? Math.round((completed / total) * 100) : 0);

  const isOwner = project?.owner_id === profile?.id;
  const isProjectAdmin = members.find(m => m.id === profile?.id)?.permission === 'admin';
  const canManage = isOwner || isProjectAdmin || isSuperAdmin;

  async function generateInviteLink() {
    const { data } = await supabase.from('project_invite_links').insert({
      project_id: id, created_by: profile.id,
    }).select().single();
    if (data) {
      const link = `${window.location.origin}/join/${data.token}`;
      setInviteLink(link);
    }
  }

  async function handleSearchUser() {
    if (!searchUser.trim()) return;
    const { data } = await supabase.from('profiles').select('id, username, avatar_color')
      .ilike('username', `%${searchUser}%`).limit(5);
    setSearchResults(data || []);
  }

  async function addMember(userId, username) {
    await supabase.from('project_members').insert({ project_id: id, user_id: userId, permission: 'contributor' });
    await supabase.from('notifications').insert({
      user_id: userId, type: 'member_joined',
      title: `You were added to ${project.name}`,
      related_id: id,
    });
    await logActivity(profile.id, id, 'add_member', { username });
    await fetchMembers();
    setSearchResults([]);
    setSearchUser('');
    toast(`${username} added to project`);
  }

  async function removeMember(userId) {
    await supabase.from('project_members').delete().eq('project_id', id).eq('user_id', userId);
    await fetchMembers();
  }

  async function handleUpdateProject(e) {
    e.preventDefault();
    await supabase.from('projects').update({
      name: editForm.name, description: editForm.description,
      version: editForm.version, deadline: editForm.deadline || null,
      color: editForm.color, progress: editForm.progress,
    }).eq('id', id);
    await fetchProject();
    toast('Project updated');
  }

  async function handleDeleteProject() {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await supabase.from('projects').delete().eq('id', id);
    await logActivity(profile.id, id, 'delete_project', { name: project.name });
    navigate('/dashboard');
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>Loading...</p>;
  if (!project) return <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>Project not found</p>;

  const tabs = ['Tasks', 'Chat', 'Announcements', 'Members', ...(canManage ? ['Settings'] : [])];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <svg width="8" height="8" className="shrink-0"><circle cx="4" cy="4" r="4" fill={project.color || '#00E0C0'}/></svg>
            <h1 className="text-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
            {project.version && <span className="font-mono text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,224,192,0.06)', color: 'var(--text-accent)' }}>v{project.version}</span>}
          </div>
          {project.description && <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-mono" style={{ color: 'var(--text-hint)' }}>{pct}%</span>
          <div className="w-24 progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border-default)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
            className="px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderColor: activeTab === tab.toLowerCase() ? 'var(--text-accent)' : 'transparent',
              color: activeTab === tab.toLowerCase() ? 'var(--text-accent)' : 'var(--text-hint)',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewTask(true)}><Plus size={16} className="mr-1.5" /> New Task</Button>
          </div>
          <KanbanBoard tasks={tasks} members={members} onUpdateTask={updateTask}
            timer={timer} TimeTrackerComponent={TimeTracker} />
        </div>
      )}

      {activeTab === 'chat' && <ChatWindow projectId={id} />}

      {activeTab === 'announcements' && <AnnouncementFeed projectId={id} />}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowInvite(true)}><UserPlus size={16} className="mr-1.5" /> Invite</Button>
          </div>
          <div className="card p-0">
            {members.map((member, i) => (
              <div key={member.id} className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < members.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <Avatar username={member.username} />
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{member.username}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>{member.roles?.join(', ') || 'No role'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={member.permission === 'admin' ? 'green' : member.permission === 'viewer' ? 'gray' : 'blue'}>
                    {member.permission}
                  </Badge>
                  {canManage && member.id !== profile.id && (
                    <button onClick={() => removeMember(member.id)} className="text-[11px] transition-colors" style={{ color: 'var(--text-hint)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--status-overdue)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && canManage && (
        <div className="card p-6 space-y-4 max-w-lg">
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <Input label="Project Name" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <Textarea label="Description" value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Version" value={editForm.version || ''} onChange={e => setEditForm(f => ({ ...f, version: e.target.value }))} />
              <Input label="Deadline" type="date" value={editForm.deadline || ''} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-hint)' }}>Color</label>
                <input type="color" value={editForm.color || '#00E0C0'} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" style={{ border: '1px solid var(--border-default)' }} />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-hint)' }}>Progress ({editForm.progress || 0}%)</label>
                <input type="range" min="0" max="100" value={editForm.progress || 0} onChange={e => setEditForm(f => ({ ...f, progress: parseInt(e.target.value) }))} className="w-full accent-teal-400" />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
          {(isOwner || isSuperAdmin) && (
            <div className="pt-4" style={{ borderTop: '1px solid rgba(224,85,85,0.15)' }}>
              <p className="text-[11px] mb-2" style={{ color: 'var(--status-overdue)' }}>Danger Zone</p>
              <Button variant="danger" onClick={handleDeleteProject}><Trash2 size={16} className="mr-1.5" /> Delete Project</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title="New Task">
        <NewTaskForm projectId={id} onSubmit={createTask} onClose={() => setShowNewTask(false)} />
      </Modal>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite to Project">
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Search existing users</p>
            <div className="flex gap-2">
              <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search by username..."
                className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchUser(); } }} />
              <Button variant="secondary" size="sm" onClick={handleSearchUser}>Search</Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 rounded-lg" style={{ border: '1px solid var(--border-default)' }}>
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-2">
                      <Avatar username={u.username} size="sm" />
                      <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{u.username}</span>
                    </div>
                    <Button size="sm" onClick={() => addMember(u.id, u.username)}>Add</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
            <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Or generate a shareable link</p>
            {!inviteLink ? (
              <Button variant="secondary" onClick={generateInviteLink}><Link2 size={14} className="mr-1.5" /> Generate Link</Button>
            ) : (
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="flex-1 px-3 py-2 rounded-lg text-[11px] font-mono"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-accent)' }} />
                <Button variant="secondary" size="sm" onClick={handleCopy}>{copied ? <Check size={14} /> : <Copy size={14} />}</Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
