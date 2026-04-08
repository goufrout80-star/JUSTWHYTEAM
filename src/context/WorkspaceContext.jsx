import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState({ name: 'Just Why Team', primary_color: '#534AB7', logo_url: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('workspace').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setWorkspace(data);
      setLoading(false);
    });
  }, []);

  async function updateWorkspace(updates) {
    const { data, error } = await supabase
      .from('workspace')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    setWorkspace(data);
    return data;
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, loading, updateWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
