'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, Search, CheckCircle, Sparkles } from 'lucide-react';
import { MATCHES } from '@/lib/mockData';
import { formatRelativeTime, getCompatibilityColor, truncate } from '@/lib/utils';

export default function MessagesPage() {
  const router = useRouter();

  const conversations = MATCHES.filter(m => m.conversation && m.conversation.length > 0)
    .sort((a, b) => {
      const aLast = a.conversation![a.conversation!.length - 1].timestamp;
      const bLast = b.conversation![b.conversation!.length - 1].timestamp;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    });

  return (
    <div style={{ padding: '32px', maxWidth: 780, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Messages</h1>
        <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)' }}>{conversations.length} active conversations</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input className="input-field" placeholder="Search conversations…" style={{ paddingLeft: 40 }} />
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,255,0.3)' }} />
      </div>

      {/* Conversation list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {conversations.map(match => {
          const lastMsg = match.conversation![match.conversation!.length - 1];
          const hasUnread = match.conversation!.some(m => m.senderId !== 'user-1' && !m.read);
          const compatColor = getCompatibilityColor(match.compatibilityScore);
          const isFromMe = lastMsg.senderId === 'user-1';

          return (
            <div
              key={match.id}
              onClick={() => router.push(`/app/messages/${match.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, cursor: 'pointer', background: hasUnread ? 'rgba(139,92,246,0.06)' : 'transparent', border: hasUnread ? '1px solid rgba(139,92,246,0.12)' : '1px solid transparent', transition: 'all 0.18s' }}
              onMouseEnter={e => { if (!hasUnread) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; } }}
              onMouseLeave={e => { if (!hasUnread) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${hasUnread ? compatColor : 'rgba(255,255,255,0.08)'}`, transition: 'border-color 0.2s' }}>
                  <img src={match.profile.photos[0]} alt={match.profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {match.profile.isVerified && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#34d399', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #07070f' }}>
                    <CheckCircle size={9} color="white" fill="white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 15, fontWeight: hasUnread ? 700 : 600, color: '#f0f0ff' }}>{match.profile.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: compatColor }}>{match.compatibilityScore}%</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', flexShrink: 0 }}>{formatRelativeTime(lastMsg.timestamp)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isFromMe && <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)' }}>You:</span>}
                  <span style={{ fontSize: 13, color: hasUnread ? 'rgba(240,240,255,0.7)' : 'rgba(240,240,255,0.4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: hasUnread ? 500 : 400 }}>
                    {truncate(lastMsg.content, 60)}
                  </span>
                  {hasUnread && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #db2777)', flexShrink: 0 }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {conversations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <MessageCircle size={48} color="rgba(240,240,255,0.1)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 16, color: 'rgba(240,240,255,0.4)', marginBottom: 8 }}>No conversations yet.</p>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.25)' }}>Like someone from your daily matches to start chatting.</p>
        </div>
      )}
    </div>
  );
}
