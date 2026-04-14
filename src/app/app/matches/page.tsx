'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Brain, Star, ChevronRight, Filter, Search, Sparkles, CheckCircle, GitBranch, Flame } from 'lucide-react';
import { MATCHES } from '@/lib/mockData';
import { getCompatibilityColor, getCompatibilityLabel, formatRelativeTime } from '@/lib/utils';
import type { Match } from '@/lib/types';

type FilterType = 'all' | 'new' | 'high-compat' | 'replied';

function CompatRing({ score, size = 56 }: { score: number; size?: number }) {
  const color = getCompatibilityColor(score);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${circ * score / 100} ${circ}`} strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 48 ? 14 : 11, fontWeight: 800, color }}>
        {score}
      </div>
    </div>
  );
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const router = useRouter();
  const lastMsg = match.conversation?.[match.conversation.length - 1];
  const hasUnread = match.conversation?.some(m => m.senderId !== 'user-1' && !m.read);
  const compatColor = getCompatibilityColor(match.compatibilityScore);

  return (
    <div
      className="glass card-lift"
      onClick={onClick}
      style={{ borderRadius: 20, padding: '20px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {match.isNew && (
        <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>
          NEW
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${compatColor}40` }}>
            <img src={match.profile.photos[0]} alt={match.profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {match.profile.isVerified && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#34d399', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f0f1a' }}>
              <CheckCircle size={10} color="white" fill="white" />
            </div>
          )}
          {hasUnread && (
            <div style={{ position: 'absolute', top: -2, left: -2, background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: '50%', width: 14, height: 14, border: '2px solid #0f0f1a' }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{match.profile.name}, {match.profile.age}</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginBottom: 6 }}>
            {match.profile.occupation} · {match.profile.location.split(',')[0]}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {match.profile.interests.slice(0, 3).map(i => (
              <span key={i} className="tag" style={{ fontSize: 10, padding: '2px 8px' }}>{i}</span>
            ))}
          </div>
        </div>

        {/* Compat ring */}
        <CompatRing score={match.compatibilityScore} size={50} />
      </div>

      {/* Compat label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: compatColor }}>{getCompatibilityLabel(match.compatibilityScore)}</span>
        <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.3)' }}>Matched {formatRelativeTime(match.matchedAt)}</span>
      </div>

      {/* Compat bars mini */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
        {Object.entries(match.compatibilityBreakdown).slice(0, 3).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', width: 80, flexShrink: 0, textTransform: 'capitalize' }}>{key}</span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${val}%`, background: getCompatibilityColor(val), borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: getCompatibilityColor(val), width: 24, textAlign: 'right' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* AI reason snippet */}
      <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8 }}>
        <Brain size={13} color="#a78bfa" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'rgba(240,240,255,0.5)', lineHeight: 1.5, margin: 0 }}>
          {match.aiReason.slice(0, 120)}…
        </p>
      </div>

      {/* Last message */}
      {lastMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 14 }}>
          <MessageCircle size={13} color="rgba(240,240,255,0.3)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lastMsg.senderId === 'user-1' ? 'You: ' : `${match.profile.name}: `}{lastMsg.content}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.25)', flexShrink: 0 }}>{formatRelativeTime(lastMsg.timestamp)}</span>
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={e => { e.stopPropagation(); router.push(`/app/journey/${match.id}`); }}
          className="btn-ghost"
          style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '10px', gap: 5 }}
        >
          <span style={{ fontSize: 13 }}>🔥</span> Journey
        </button>
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          className="btn-primary"
          style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '10px' }}
        >
          <MessageCircle size={14} />
          Message
        </button>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = MATCHES.filter(m => {
    if (search && !m.profile.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'new') return m.isNew;
    if (filter === 'high-compat') return m.compatibilityScore >= 90;
    if (filter === 'replied') return m.conversation && m.conversation.length > 2;
    return true;
  });

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Your Matches</h1>
        <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)' }}>{MATCHES.length} compatible matches · {MATCHES.filter(m => m.isNew).length} new</p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            className="input-field"
            placeholder="Search matches…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,255,0.3)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['all', 'All'], ['new', 'New ✨'], ['high-compat', 'High Match'], ['replied', 'Active']] as [FilterType, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{ padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${filter === val ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: filter === val ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)', color: filter === val ? '#c4b5fd' : 'rgba(240,240,255,0.55)', fontSize: 13, fontWeight: filter === val ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { icon: Heart, label: 'Total Matches', value: MATCHES.length, color: '#fb7185' },
          { icon: Star, label: 'Avg Compatibility', value: '91%', color: '#a78bfa' },
          { icon: MessageCircle, label: 'Active Chats', value: MATCHES.filter(m => m.conversation?.length).length, color: '#34d399' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass" style={{ borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={() => router.push(`/app/messages/${match.id}`)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ fontSize: 16, color: 'rgba(240,240,255,0.4)' }}>No matches found for this filter.</p>
        </div>
      )}
    </div>
  );
}
