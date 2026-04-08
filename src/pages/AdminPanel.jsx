import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FolderOpen, Activity, AlertTriangle, Settings, BarChart3, UserPlus, Eye, Ban, Trash2, ShieldOff } from 'lucide-react';
import { supabase, invokeFunction } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../hooks/useRealtime';
import { logActivity } from '../lib/activityLogger';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import ActivityTable from '../components/admin/ActivityTable';
import ErrorTable from '../components/admin/ErrorTable';
import CreateUserModal from '../components/admin/CreateUserModal';
import WorkspaceSettings from '../components/admin/WorkspaceSettings';
import { toast } from '../components/ui/Toast';

const tabs = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'projects', label: 'Projects', icon: FolderOpen },
  { key: 'activity', label: 'Activity Log', icon: Activity },
  { key: 'errors', label: 'Error Log', icon: AlertTriangle },
  { key: 'workspace', label: 'Workspace', icon: Settings },
];

export default function AdminPanel() {
  const { profile, isSuperAdmin, startImpersonating } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, errorsToday: 0 });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/dashboard'); return; }
  }, [isSuperAdmin, navigate]);

  const fetchAll = useCallback(async () => {
    const [usersRes, projectsRes, activityRes, errorsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('errors_log').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    const allUsers = usersRes.data || [];
    const allProjects = projectsRes.data || [];
    const allActivity = activityRes.data || [];
    const allErrors = errorsRes.data || [];

    setUsers(allUsers);
    setProjects(allProjects);
    setActivityLogs(allActivity);
    setErrorLogs(allErrors);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStats({
      totalUsers: allUsers.length,
      totalProjects: allProjects.length,
      errorsToday: allErrors.filter(e => new Date(e.created_at) >= today).length,
    });
  }, []);

  useEffect(() => { if (isSuperAdmin) fetchAll(); }, [isSuperAdmin, fetchAll]);

  useRealtime('activity_logs', null, useCallback(() => { fetchAll(); }, [fetchAll]));

  async function handleToggleSuperAdmin(user) {
    await supabase.from('profiles').update({ is_super_admin: !user.is_super_admin }).eq('id', user.id);
    toast(`${user.username} ${!user.is_super_admin ? 'promoted to' : 'removed from'} super admin`);
    fetchAll();
  }

  async function handleImpersonate(user) {
    await startImpersonating(user.id);
    toast(`Now impersonating ${user.username}`, 'warning');
    navigate('/dashboard');
  }

  async function handleBan(user, banStatus) {
    const { error } = await supabase
      .from('profiles')
      .update({ banned: banStatus })
      .eq('id', user.id);
    
    if (error) {
      toast(`Failed to ${banStatus ? 'ban' : 'unban'} user`, 'error');
      return;
    }
    
    await logActivity(profile.id, null, banStatus ? 'user_banned' : 'user_unbanned', { 
      target_user_id: user.id, 
      username: user.username 
    });
    
    toast(`${user.username} has been ${banStatus ? 'banned' : 'unbanned'}`);
    fetchAll();
  }

  function confirmDelete(user) {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  }

  async function handleDelete() {
    if (!userToDelete) return;
    
    try {
      const data = await invokeFunction('delete-user', { userId: userToDelete.id });
      if (!data?.success) throw new Error('Failed to delete user');
      
      // Remove from project_members
      await supabase.from('project_members').delete().eq('user_id', userToDelete.id);
      
      // Log the deletion
      await logActivity(profile.id, null, 'user_deleted', { 
        target_user_id: userToDelete.id, 
        username: userToDelete.username 
      });
      
      toast(`${userToDelete.username} has been permanently deleted`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchAll();
    } catch (err) {
      toast(`Failed to delete user: ${err.message}`, 'error');
    }
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="w-48 shrink-0 space-y-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left"
            style={activeTab === tab.key ? { background: 'rgba(0,224,192,0.08)', color: 'var(--text-accent)' } : { color: 'var(--text-hint)' }}
            onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent'; }}>
            <tab.icon size={14} strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>Admin Overview</h2>
            <div className="grid grid-cols-3 gap-4">
              <Card><p className="text-[26px] font-medium" style={{ color: 'var(--text-primary)' }}>{stats.totalUsers}</p><p className="text-[11px] uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Total Users</p></Card>
              <Card><p className="text-[26px] font-medium" style={{ color: 'var(--text-primary)' }}>{stats.totalProjects}</p><p className="text-[11px] uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Total Projects</p></Card>
              <Card><p className="text-[26px] font-medium" style={{ color: stats.errorsToday > 0 ? 'var(--status-overdue)' : 'var(--text-primary)' }}>{stats.errorsToday}</p><p className="text-[11px] uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Errors Today</p></Card>
            </div>
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--text-hint)' }}>Recent Activity</h3>
              <div className="card p-0">
                <ActivityTable logs={activityLogs.slice(0, 20)} users={users} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>Users ({users.length})</h2>
              <Button onClick={() => setShowCreateUser(true)}><UserPlus size={16} className="mr-1.5" /> Invite User</Button>
            </div>
            <div className="card p-0">
              {users.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                  <div className="flex items-center gap-3">
                    <Avatar username={u.username} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                        {u.banned && <Badge color="red">Banned</Badge>}
                        {u.is_super_admin && <Badge color="purple">Super Admin</Badge>}
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>{u.email} · {u.roles?.join(', ') || 'No roles'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.two_factor_enabled && <Badge color="green">2FA</Badge>}
                    {u.id !== profile.id && (
                      <>
                        <button onClick={() => handleImpersonate(u)} className="p-1 transition-colors" style={{ color: 'var(--text-hint)' }} title="Impersonate"
                          onMouseEnter={e => e.currentTarget.style.color = '#E07050'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}
                        >
                          <Eye size={14} strokeWidth={1.5} />
                        </button>
                        <button onClick={() => handleToggleSuperAdmin(u)} className="text-[11px] transition-colors px-2 py-1" style={{ color: 'var(--text-hint)' }} title="Toggle Super Admin"
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}
                        >
                          {u.is_super_admin ? 'Demote' : 'Promote'}
                        </button>
                        <button onClick={() => handleBan(u, !u.banned)} className="p-1 transition-colors" style={{ color: u.banned ? 'var(--status-done)' : 'var(--text-hint)' }} title={u.banned ? 'Unban User' : 'Ban User'}
                          onMouseEnter={e => e.currentTarget.style.color = u.banned ? '#2ECC71' : '#F39C12'}
                          onMouseLeave={e => e.currentTarget.style.color = u.banned ? 'var(--status-done)' : 'var(--text-hint)'}
                        >
                          {u.banned ? <ShieldOff size={14} strokeWidth={1.5} /> : <Ban size={14} strokeWidth={1.5} />}
                        </button>
                        <button onClick={() => confirmDelete(u)} className="p-1 transition-colors" style={{ color: 'var(--text-hint)' }} title="Delete User"
                          onMouseEnter={e => e.currentTarget.style.color = '#E74C3C'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>All Projects ({projects.length})</h2>
            <div className="card p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th className="text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Name</th>
                    <th className="text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Owner</th>
                    <th className="text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Progress</th>
                    <th className="text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Version</th>
                    <th className="text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => {
                    const owner = users.find(u => u.id === p.owner_id);
                    return (
                      <tr key={p.id} className="cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid var(--border-default)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => navigate(`/projects/${p.id}`)}>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <svg width="6" height="6" className="shrink-0"><circle cx="3" cy="3" r="3" fill={p.color || '#00E0C0'}/></svg>
                            <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{owner?.username || '-'}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 progress-track">
                              <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
                            </div>
                            <span className="text-[11px] font-mono" style={{ color: 'var(--text-hint)' }}>{p.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] font-mono" style={{ color: 'var(--text-hint)' }}>{p.version || '-'}</td>
                        <td className="py-2.5 px-3 text-[11px] font-mono" style={{ color: 'var(--text-hint)' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>Activity Log</h2>
            <div className="card p-0">
              <ActivityTable logs={activityLogs} users={users} />
            </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>Error Log</h2>
            <div className="card p-0">
              <ErrorTable errors={errorLogs} users={users} />
            </div>
          </div>
        )}

        {activeTab === 'workspace' && <WorkspaceSettings />}
      </div>

      <Modal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} title="Invite New User">
        <CreateUserModal onClose={() => setShowCreateUser(false)} />
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete User">
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)' }}>
            <p className="text-[13px]" style={{ color: '#E74C3C' }}>
              Are you sure you want to permanently delete <strong>{userToDelete?.username}</strong>?<br />
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button onClick={handleDelete} style={{ background: '#E74C3C' }}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
