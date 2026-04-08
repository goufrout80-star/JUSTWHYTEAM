import { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSend }) {
  const [content, setContent] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    onSend(content.trim());
    setContent('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3"
      style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-sidebar)' }}>
      <input
        type="text"
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
      />
      <button type="submit" disabled={!content.trim()} className="btn-primary p-2 disabled:opacity-30">
        <Send size={14} strokeWidth={1.5} />
      </button>
    </form>
  );
}
