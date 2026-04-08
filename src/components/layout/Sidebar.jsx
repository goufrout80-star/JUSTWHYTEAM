import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import Avatar from '../ui/Avatar';
import NewProjectForm from '../dashboard/NewProjectForm';
import Modal from '../ui/Modal';

export default function Sidebar() {
  const { profile, isSuperAdmin } = useAuth();
  console.log('[Sidebar] profile:', profile?.username, '| isSuperAdmin:', isSuperAdmin, '| is_super_admin raw:', profile?.is_super_admin);
  const { projects } = useProjects(profile?.id);
  const [showNewProject, setShowNewProject] = useState(false);
  const [members, setMembers] = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from('profiles').select('id, username, avatar_color, roles').then(({ data }) => {
      setMembers(data || []);
    });
  }, [profile?.id]);

  const sectionLabel = 'text-[10px] font-medium uppercase tracking-[0.08em] px-3 mb-2';

  return (
    <>
      <aside className="w-[220px] flex flex-col h-full overflow-hidden shrink-0"
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-default)' }}>
        <div className="p-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <button onClick={() => setShowNewProject(true)}
            className="w-full flex items-center gap-2 px-3 py-[7px] text-[13px] font-medium rounded-md transition-colors"
            style={{ color: 'var(--text-accent)', border: '1px solid var(--border-default)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,224,192,0.06)'; e.currentTarget.style.borderColor = 'var(--border-active)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
            <Plus size={14} strokeWidth={1.5} /> New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className={sectionLabel} style={{ color: 'var(--text-hint)' }}>Projects</p>
          {projects.length === 0 && <p className="text-[11px] px-3" style={{ color: 'var(--text-hint)' }}>No projects yet</p>}
          {projects.map(project => {
            const active = location.pathname === `/projects/${project.id}`;
            return (
              <Link key={project.id} to={`/projects/${project.id}`}
                title={project.name}
                className="group flex items-center gap-2 px-3 py-[7px] rounded-md text-[13px] transition-all duration-200"
                style={{
                  color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
                  background: active ? 'rgba(0,224,192,0.1)' : 'transparent',
                  borderLeft: active ? '2px solid var(--text-accent)' : '2px solid transparent',
                  boxShadow: active ? 'inset 0 0 12px rgba(0,224,192,0.06)' : 'none',
                }}>
                <svg width="6" height="6" className="shrink-0"><circle cx="3" cy="3" r="3" fill={project.color || '#00E0C0'}/></svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{project.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          <p className={sectionLabel} style={{ color: 'var(--text-hint)' }}>Team</p>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {members.slice(0, 10).map(m => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-1" title={m.username}>
                <Avatar username={m.username} size="sm" />
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.username}</span>
              </div>
            ))}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="p-3" style={{ borderTop: '1px solid var(--border-default)' }}>
            <Link to="/admin"
              className="flex items-center gap-2 px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors"
              style={{
                color: location.pathname.startsWith('/admin') ? 'var(--text-accent)' : 'var(--text-hint)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-accent)'; e.currentTarget.style.textShadow = '0 0 8px rgba(0,224,192,0.4)'; }}
              onMouseLeave={e => { if (!location.pathname.startsWith('/admin')) e.currentTarget.style.color = 'var(--text-hint)'; e.currentTarget.style.textShadow = 'none'; }}>
              <Shield size={14} strokeWidth={1.5} /> Admin Panel
            </Link>
          </div>
        )}
      </aside>

      <Modal isOpen={showNewProject} onClose={() => setShowNewProject(false)} title="New Project">
        <NewProjectForm onClose={() => setShowNewProject(false)} />
      </Modal>
    </>
  );
}
