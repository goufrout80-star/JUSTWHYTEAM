import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { logActivity } from '../../lib/activityLogger';
import { useAuth } from '../../context/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from '../ui/Toast';

export default function WorkspaceSettings() {
  const { workspace, updateWorkspace } = useWorkspace();
  const { profile } = useAuth();
  const [form, setForm] = useState({
    name: workspace.name || 'Just Why Team',
    primary_color: workspace.primary_color || '#534AB7',
    logo_url: workspace.logo_url || '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateWorkspace(form);
      await logActivity(profile.id, null, 'update_workspace_settings', form);
      toast('Workspace settings saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h3 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Workspace Settings</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Workspace Name" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Just Why Team" />
        <Input label="Logo URL" value={form.logo_url}
          onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
          placeholder="https://example.com/logo.png" />
        <div className="space-y-1">
          <label className="block text-[11px] font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-hint)' }}>Primary Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primary_color}
              onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-input)' }} />
            <span className="text-[12px] font-mono" style={{ color: 'var(--text-hint)' }}>{form.primary_color}</span>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
