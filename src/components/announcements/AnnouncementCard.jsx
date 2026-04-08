import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../ui/Avatar';
import ReplyBox from './ReplyBox';

export default function AnnouncementCard({ announcement, author, replies = [], likes = [], currentUserId, onLike, onReply }) {
  const [showReplies, setShowReplies] = useState(false);
  const hasLiked = likes.some(l => l.user_id === currentUserId);

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        {author && <Avatar username={author.username} size="md" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{author?.username || 'Unknown'}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-hint)' }}>
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-[13px] mt-1 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{announcement.content}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onLike?.(announcement.id)}
          className="flex items-center gap-1 text-[11px] transition-colors"
          style={{ color: hasLiked ? 'var(--status-overdue)' : 'var(--text-hint)' }}>
          <Heart size={12} strokeWidth={1.5} fill={hasLiked ? 'currentColor' : 'none'} />
          {likes.length > 0 && likes.length}
        </button>
        <button onClick={() => setShowReplies(!showReplies)}
          className="flex items-center gap-1 text-[11px] transition-colors"
          style={{ color: 'var(--text-hint)' }}>
          <MessageCircle size={12} strokeWidth={1.5} />
          {replies.length > 0 && replies.length}
        </button>
      </div>

      {showReplies && (
        <div className="pl-12 space-y-2 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          {replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-2">
              <Avatar username={reply.author?.username} size="sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{reply.author?.username}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-hint)' }}>
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{reply.content}</p>
              </div>
            </div>
          ))}
          <ReplyBox onSubmit={(content) => onReply?.(announcement.id, content)} />
        </div>
      )}
    </div>
  );
}
