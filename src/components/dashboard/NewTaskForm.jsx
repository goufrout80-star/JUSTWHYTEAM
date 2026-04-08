import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Input from '../ui/Input';
import { Select } from '../ui/Input';
import Button from '../ui/Button';

export default function NewTaskForm({ projectId, onSubmit, onClose, projects = [] }) {
  const { profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    title: '',
    assigned_to: '',
    priority: 'medium',
    deadline: '',
    version: '',
    type: 'required',
    project_id: projectId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentProjectId = form.project_id || projectId;

  useEffect(() => {
    if (!currentProjectId) return;
    supabase
      .from('project_members')
      .select('user_id, users:user_id(id, username)')
      .eq('project_id', currentProjectId)
      .then(({ data }) => setMembers(data?.map(d => d.users).filter(Boolean) || []));
  }, [currentProjectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Task title is required');
    if (!currentProjectId) return setError('Select a project');
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        title: form.title.trim(),
        assigned_to: form.assigned_to || null,
        priority: form.priority,
        deadline: form.deadline || null,
        version: form.version,
        type: form.type,
        project_id: currentProjectId,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-[13px]" style={{ color: 'var(--status-overdue)' }}>{error}</p>}

      {!projectId && projects.length > 0 && (
        <Select
          label="Project"
          value={form.project_id}
          onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
        >
          <option value="">Select project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      )}

      <Input
        label="Task Title"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="What needs to be done?"
        required
      />

      <Select
        label="Assign To"
        value={form.assigned_to}
        onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
      >
        <option value="">Unassigned</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.username}</option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Priority"
          value={form.priority}
          onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select
          label="Type"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          <option value="required">Required</option>
          <option value="optional">Optional</option>
          <option value="bug">Bug</option>
          <option value="chore">Chore</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Version"
          value={form.version}
          onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
          placeholder="1.0.0"
        />
        <Input
          label="Deadline"
          type="date"
          value={form.deadline}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
