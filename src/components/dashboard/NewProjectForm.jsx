import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import Input from '../ui/Input';
import { Textarea } from '../ui/Input';
import Button from '../ui/Button';

export default function NewProjectForm({ onClose }) {
  const { profile } = useAuth();
  const { createProject } = useProjects(profile?.id);
  const [form, setForm] = useState({ name: '', description: '', version: '1.0.0', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setLoading(true);
    setError('');
    try {
      await createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        version: form.version.trim(),
        deadline: form.deadline || null,
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
      <Input
        label="Project Name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="My Awesome Project"
        required
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="What is this project about?"
      />
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
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
