import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../lib/activityLogger';
import AnnouncementCard from './AnnouncementCard';
import ReplyBox from './ReplyBox';

export default function AnnouncementFeed({ projectId }) {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    const { data: anns } = await supabase
      .from('announcements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!anns) { setLoading(false); return; }

    const enriched = await Promise.all(
      anns.map(async (ann) => {
        const { data: author } = await supabase.from('users').select('*').eq('id', ann.user_id).single();
        const { data: replies } = await supabase
          .from('announcement_replies')
          .select('*')
          .eq('announcement_id', ann.id)
          .order('created_at', { ascending: true });
        const enrichedReplies = await Promise.all(
          (replies || []).map(async (r) => {
            const { data: rAuthor } = await supabase.from('users').select('*').eq('id', r.user_id).single();
            return { ...r, author: rAuthor };
          })
        );
        const { data: likes } = await supabase
          .from('announcement_likes')
          .select('*')
          .eq('announcement_id', ann.id);
        return { ...ann, author, replies: enrichedReplies, likes: likes || [] };
      })
    );

    setAnnouncements(enriched);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  async function handlePost(content) {
    await supabase.from('announcements').insert({
      project_id: projectId,
      user_id: profile.id,
      content,
    });
    await logActivity(profile.id, projectId, 'posted_announcement', { content: content.slice(0, 100) });
    fetchAnnouncements();
  }

  async function handleLike(announcementId) {
    const existing = announcements.find(a => a.id === announcementId);
    const alreadyLiked = existing?.likes.some(l => l.user_id === profile.id);

    if (alreadyLiked) {
      await supabase.from('announcement_likes').delete()
        .eq('announcement_id', announcementId)
        .eq('user_id', profile.id);
    } else {
      await supabase.from('announcement_likes').insert({
        announcement_id: announcementId,
        user_id: profile.id,
      });
    }
    fetchAnnouncements();
  }

  async function handleReply(announcementId, content) {
    await supabase.from('announcement_replies').insert({
      announcement_id: announcementId,
      user_id: profile.id,
      content,
    });
    fetchAnnouncements();
  }

  if (loading) return <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>Loading announcements...</p>;

  return (
    <div className="space-y-4">
      <div className="card">
        <ReplyBox
          onSubmit={handlePost}
          placeholder="Post an announcement..."
        />
      </div>
      {announcements.length === 0 && (
        <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-hint)' }}>No announcements yet</p>
      )}
      {announcements.map(ann => (
        <AnnouncementCard
          key={ann.id}
          announcement={ann}
          author={ann.author}
          replies={ann.replies}
          likes={ann.likes}
          currentUserId={profile?.id}
          onLike={handleLike}
          onReply={handleReply}
        />
      ))}
    </div>
  );
}
