import { formatDistanceToNow } from 'date-fns';
import Avatar from '../ui/Avatar';

export default function ChatMessage({ message, isOwn }) {
  const author = message.author;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Avatar username={author?.username} size="sm" />
      <div className="min-w-0 flex-1 rounded-lg px-3 py-2"
        style={{
          background: 'var(--bg-elevated)',
          borderLeft: isOwn ? '2px solid var(--text-accent)' : '2px solid transparent',
        }}>
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{author?.username || 'Unknown'}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-hint)' }}>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-[13px] whitespace-pre-wrap break-words mt-0.5" style={{ color: 'var(--text-secondary)' }}>{message.content}</p>
      </div>
    </div>
  );
}
