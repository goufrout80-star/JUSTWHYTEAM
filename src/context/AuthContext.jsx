import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(null);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Session timeout for inactivity
  useEffect(() => {
    if (!user) return;

    const resetTimeout = () => {
      lastActivityRef.current = Date.now();
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // 60 minutes of inactivity - sign out
        supabase.auth.signOut();
        navigate('/login');
      }, SESSION_TIMEOUT);
    };

    // Track user activity
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetTimeout));
    
    // Initial timeout
    resetTimeout();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimeout));
      clearTimeout(timeoutRef.current);
    };
  }, [user, navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else { setProfile(null); setImpersonating(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    console.log('[AuthContext] Fetching profile for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('[AuthContext] Profile fetch error:', error.message);
    }
    if (!error && data) {
      console.log('[AuthContext] Profile loaded:', data.username, '| is_super_admin:', data.is_super_admin);
      setProfile(data);
      if (data.is_impersonating) {
        const { data: imp } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.is_impersonating)
          .single();
        setImpersonating(imp || null);
      }
    } else {
      console.warn('[AuthContext] No profile data returned');
    }
    setLoading(false);
  }, []);

  async function signIn(identifier, password) {
    let email = identifier;
    if (!identifier.includes('@')) {
      const { data: resolvedEmail, error: rpcError } = await supabase
        .rpc('get_email_by_username', { p_username: identifier });
      if (rpcError || !resolvedEmail) throw new Error('User not found');
      email = resolvedEmail;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: { skipEmailConfirmation: true }
    });
    if (error) {
      // If email not confirmed, try to auto-confirm by calling auth admin
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Account pending verification. Please check your email or contact admin.');
      }
      throw error;
    }
    return data;
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (impersonating) await stopImpersonating();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setImpersonating(null);
  }

  async function updateProfile(updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  async function startImpersonating(targetUserId) {
    // Log impersonation start
    const { data: target } = await supabase.from('profiles').select('username').eq('id', targetUserId).single();
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'impersonate_start',
      metadata: { impersonated_user: target?.username, impersonated_user_id: targetUserId }
    });
    
    await supabase.from('profiles').update({ is_impersonating: targetUserId }).eq('id', user.id);
    const { data: imp } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
    setImpersonating(imp);
  }

  async function stopImpersonating() {
    // Log impersonation end
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'impersonate_end',
      metadata: { impersonated_user: impersonating?.username, impersonated_user_id: impersonating?.id }
    });
    
    await supabase.from('profiles').update({ is_impersonating: null }).eq('id', user.id);
    setImpersonating(null);
  }

  // Wrapper for actions that logs when impersonating
  async function logActionWithImpersonation(action, projectId = null, metadata = {}) {
    const enrichedMetadata = impersonating 
      ? { ...metadata, impersonated_by: user.id, impersonated_username: impersonating.username }
      : metadata;
    
    await supabase.from('activity_logs').insert({
      user_id: impersonating?.id || user.id,
      project_id: projectId,
      action,
      metadata: enrichedMetadata
    });
  }

  const activeProfile = impersonating || profile;

  const value = {
    session,
    user,
    profile,
    activeProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    fetchProfile,
    isSuperAdmin: profile?.is_super_admin === true,
    mustChangePassword: profile?.must_change_password === true,
    impersonating,
    isImpersonating: !!impersonating,
    startImpersonating,
    stopImpersonating,
    logActionWithImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
