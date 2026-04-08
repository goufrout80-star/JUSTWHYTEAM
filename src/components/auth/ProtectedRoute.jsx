import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/Toast';

export function ProtectedRoute({ children, requireAdmin = false, requireProjectMember = false }) {
  const { user, profile, loading } = useAuth();
  const { id: projectId } = useParams();
  const [isMember, setIsMember] = useState(null);
  const [checking, setChecking] = useState(requireProjectMember);

  useEffect(() => {
    if (requireProjectMember && projectId && user) {
      checkProjectMembership();
    } else {
      setChecking(false);
    }
  }, [requireProjectMember, projectId, user]);

  async function checkProjectMembership() {
    const { data } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (!data) {
      toast.error('Access denied: You are not a member of this project');
    }
    setIsMember(!!data);
    setChecking(false);
  }

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '2px solid var(--border-default)', borderTopColor: 'var(--text-accent)' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  if (requireAdmin && !profile?.is_super_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireProjectMember && !isMember) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
