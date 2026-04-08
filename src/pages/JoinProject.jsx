import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function JoinProject() {
  const { token } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState(null);
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!user) {
        navigate(`/login?redirect=/join/${token}`);
        return;
      }
      const { data: link } = await supabase
        .from('project_invite_links')
        .select('*, project:project_id(id, name, description, color)')
        .eq('token', token)
        .single();
      if (!link || (link.expires_at && new Date(link.expires_at) < new Date())) {
        setStatus('invalid');
        return;
      }
      setInviteLink(link);
      setProject(link.project);
      const { data: existing } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', link.project_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        navigate(`/projects/${link.project_id}`);
        return;
      }
      setStatus('ready');
    }
    load();
  }, [token, user]);

  async function handleJoin() {
    setStatus('joining');
    try {
      await supabase.from('project_members').insert({
        project_id: inviteLink.project_id,
        user_id: user.id,
        permission: inviteLink.permission || 'contributor',
      });
      await supabase.from('notifications').insert({
        user_id: project.owner_id || inviteLink.created_by,
        type: 'member_joined',
        title: `${profile?.username} joined ${project.name}`,
        related_id: inviteLink.project_id,
      });
      await logActivity(user.id, inviteLink.project_id, 'joined_project', { via: 'invite_link' });
      navigate(`/projects/${inviteLink.project_id}`);
    } catch (err) {
      setError(err.message);
      setStatus('ready');
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border-default)', borderTopColor: 'var(--text-accent)' }} />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center max-w-sm fade-in">
          <h1 className="text-[18px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Invalid invite link</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>This project invite link is invalid or has expired.</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm fade-in">
        <Card>
          <div className="text-center space-y-4 py-4">
            <svg width="48" height="48" className="mx-auto"><circle cx="24" cy="24" r="22" fill={project?.color || '#00E0C0'} opacity="0.15"/><text x="24" y="30" textAnchor="middle" fill={project?.color || '#00E0C0'} fontSize="18" fontWeight="600">{project?.name?.[0]}</text></svg>
            <h1 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>{project?.name}</h1>
            {project?.description && <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>{project.description}</p>}
            {error && <p className="text-[13px]" style={{ color: 'var(--status-overdue)' }}>{error}</p>}
            <Button className="w-full" onClick={handleJoin} disabled={status === 'joining'}>
              {status === 'joining' ? 'Joining...' : 'Join Project'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
