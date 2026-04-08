import { useState } from 'react';
import { Send } from 'lucide-react';

export default function ReplyBox({ onSubmit, placeholder = 'Write a reply...' }) {
  const [content, setContent] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 rounded-lg text-[13px] outline-none"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
      />
      <button type="submit" disabled={!content.trim()}
        className="p-1.5 transition-colors disabled:opacity-30"
        style={{ color: 'var(--text-accent)' }}>
        <Send size={14} strokeWidth={1.5} />
      </button>
    </form>
  );
}
