import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function MentionInput({ onSubmit, placeholder = 'Write something... (@mention users)' }) {
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef(null);

  async function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMentionStart(cursor - match[0].length);
      const query = match[1];
      if (query.length > 0) {
        const { data } = await supabase.from('profiles').select('id, username').ilike('username', `%${query}%`).limit(5);
        setSuggestions(data || []);
        setShowSuggestions(true);
      } else {
        const { data } = await supabase.from('profiles').select('id, username').limit(5);
        setSuggestions(data || []);
        setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
    }
  }

  function selectUser(username) {
    const before = content.slice(0, mentionStart);
    const after = content.slice(inputRef.current?.selectionStart || content.length);
    setContent(`${before}@${username} ${after}`);
    setShowSuggestions(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const mentioned = [...content.matchAll(/@(\w+)/g)].map(m => m[1]);
    onSubmit(content.trim(), mentioned);
    setContent('');
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input ref={inputRef} type="text" value={content} onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
        <button type="submit" disabled={!content.trim()}
          className="p-2 transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-accent)' }}>
          <Send size={14} strokeWidth={1.5} />
        </button>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 w-48 rounded-lg py-1 z-50"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          {suggestions.map(u => (
            <button key={u.id} onClick={() => selectUser(u.username)}
              className="w-full text-left px-3 py-1.5 text-[13px] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,224,192,0.05)'; e.currentTarget.style.color = 'var(--text-accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              @{u.username}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
