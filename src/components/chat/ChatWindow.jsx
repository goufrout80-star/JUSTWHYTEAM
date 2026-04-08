import { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatWindow({ projectId }) {
  const { profile } = useAuth();
  const { messages, loading, sendMessage } = useChat(projectId, profile?.id);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px] rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {loading && <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-hint)' }}>Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-[11px] text-center py-8" style={{ color: 'var(--text-hint)' }}>No messages yet. Start the conversation!</p>
        )}
        {messages.map(msg => <ChatMessage key={msg.id} message={msg} isOwn={msg.user_id === profile?.id} />)}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
