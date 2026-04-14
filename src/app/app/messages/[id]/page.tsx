'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Brain, Sparkles, Coffee,
  Phone, Video, CheckCircle, Heart, Flame,
} from 'lucide-react';
import { MATCHES, DATE_IDEAS, AI_CONVERSATION_TIPS } from '@/lib/mockData';
import { formatTime, getCompatibilityColor } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { useAiV2 } from '@/hooks/useAiV2';

const CURRENT_USER_ID = 'user-1';
const CURRENT_USER_PHOTO = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80';

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', width: 60 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(240,240,255,0.4)', animation: `typing 1.2s ${i * 0.2}s ease-in-out infinite` }} />
      ))}
      <style>{`@keyframes typing { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }`}</style>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const match = MATCHES.find(m => m.id === matchId) || MATCHES[0];
  const profile = match.profile;

  const [messages, setMessages] = useState<Message[]>(match.conversation || []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showDateIdeas, setShowDateIdeas] = useState(false);
  const [aiTipIdx, setAiTipIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [threadSummaryLoading, setThreadSummaryLoading] = useState(false);
  const [threadInsight, setThreadInsight] = useState<{
    summary: string;
    tone: string;
    replyCoach: string;
    why: string[];
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { enabled: aiV2Enabled } = useAiV2(CURRENT_USER_ID);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function sendMessage(text: string = input.trim()) {
    if (!text || sending) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      content: text,
      timestamp: new Date().toISOString(),
      type: 'text',
      read: false,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setSending(true);

    // Simulate reply
    setTimeout(() => {
      setIsTyping(true);
    }, 600);
    setTimeout(() => {
      setIsTyping(false);
      setSending(false);
      const replies = [
        "That's such a great point! I was actually thinking about that the other day.",
        "Haha yes exactly! We clearly have similar taste.",
        "I love that answer. Okay, follow up question…",
        "Okay you've convinced me. When are we trying this?",
        "I didn't expect that answer but I love it 😄",
      ];
      const reply: Message = {
        id: `msg-reply-${Date.now()}`,
        senderId: profile.id,
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        type: 'text',
        read: false,
      };
      setMessages(prev => [...prev, reply]);
      setAiTipIdx(i => (i + 1) % AI_CONVERSATION_TIPS.length);
    }, 2500);
  }

  const compatColor = getCompatibilityColor(match.compatibilityScore);

  async function generateThreadInsight() {
    setThreadSummaryLoading(true);
    try {
      const raw = messages.map(m => `${m.senderId === CURRENT_USER_ID ? 'Me' : profile.name}: ${m.content}`).join('\n');
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'conversation_summary',
          context: { messages: raw },
        }),
      });
      const data = await res.json();
      if (data?.result && typeof data.result === 'object') {
        setThreadInsight(data.result as { summary: string; tone: string; replyCoach: string; why: string[] });
      }
    } catch {
      setThreadInsight({
        summary: 'Could not summarize this thread right now.',
        tone: 'Try again shortly.',
        replyCoach: '',
        why: ['API temporarily unavailable'],
      });
    } finally {
      setThreadSummaryLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }} className="chat-root">
      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat header */}
        <div className="glass-strong" style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.5)', padding: 4, display: 'flex', marginRight: 4 }}>
            <ArrowLeft size={20} />
          </button>

          <div style={{ position: 'relative' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${compatColor}50` }}>
              <img src={profile.photos[0]} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#34d399', border: '2px solid #07070f' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{profile.name}</span>
              {profile.isVerified && <CheckCircle size={13} color="#34d399" />}
              <span style={{ fontSize: 12, fontWeight: 600, color: compatColor }}>{match.compatibilityScore}% match</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>{profile.occupation} · Active now</div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn-icon"
              onClick={() => router.push(`/app/journey/${match.id}`)}
              title="Connection Journey"
              style={{ color: '#fb923c', borderColor: 'rgba(251,146,60,0.25)', background: 'rgba(251,146,60,0.08)' }}
            >
              <Flame size={16} />
            </button>
            <button className="btn-icon" title="Voice call"><Phone size={16} /></button>
            <button className="btn-icon" title="Video call"><Video size={16} /></button>
            <button
              className="btn-icon"
              onClick={() => setShowAIPanel(!showAIPanel)}
              title="AI Coach"
              style={{ background: showAIPanel ? 'rgba(139,92,246,0.15)' : undefined, borderColor: showAIPanel ? 'rgba(139,92,246,0.3)' : undefined, color: showAIPanel ? '#a78bfa' : undefined }}
            >
              <Brain size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Match banner */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: -8, alignItems: 'center' }}>
                <img src={CURRENT_USER_PHOTO} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #07070f' }} alt="" />
                <Heart size={18} color="#f43f5e" fill="#f43f5e" style={{ margin: '0 -2px', position: 'relative', zIndex: 1 }} />
                <img src={profile.photos[0]} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #07070f' }} alt="" />
              </div>
              <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.35)', fontWeight: 500 }}>You matched with {profile.name} · {formatTime(match.matchedAt)}</span>
            </div>
          </div>

          {messages.map((msg, i) => {
            const isMe = msg.senderId === CURRENT_USER_ID;
            const showAvatar = !isMe && (i === 0 || messages[i-1]?.senderId === CURRENT_USER_ID);
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  {!isMe && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, opacity: showAvatar ? 1 : 0 }}>
                      <img src={profile.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className={isMe ? 'bubble-out' : 'bubble-in'} style={{ maxWidth: '72%' }}>
                    {msg.content}
                  </div>
                  {isMe && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, opacity: showAvatar ? 1 : 0 }}>
                      <img src={CURRENT_USER_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: 'rgba(240,240,255,0.2)', marginLeft: isMe ? 0 : 36, marginRight: isMe ? 36 : 0 }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src={profile.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.2s', position: 'relative' }}
              onFocus={() => { (document.querySelector('.msg-input-wrap') as HTMLElement)?.style.setProperty('border-color', 'rgba(139,92,246,0.5)'); }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder={`Message ${profile.name}…`}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f0f0ff', fontSize: 14, fontFamily: 'inherit' }}
              />
              <button
                onClick={() => setShowDateIdeas(!showDateIdeas)}
                title="Date Ideas"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: showDateIdeas ? '#fbbf24' : 'rgba(240,240,255,0.3)', padding: 0, display: 'flex', transition: 'color 0.2s' }}
              >
                <Coffee size={17} />
              </button>
            </div>
            <button
              onClick={() => sendMessage()}
              className="btn-primary"
              style={{ width: 46, height: 46, padding: 0, borderRadius: 12, opacity: input.trim() ? 1 : 0.4, flexShrink: 0 }}
              disabled={!input.trim() || sending}
            >
              <Send size={18} />
            </button>
          </div>

          {/* Date ideas tray */}
          {showDateIdeas && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {DATE_IDEAS.map(idea => (
                <button
                  key={idea.title}
                  onClick={() => { sendMessage(`How about: ${idea.title}? ${idea.description}`); setShowDateIdeas(false); }}
                  style={{ flexShrink: 0, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '8px 14px', color: '#fde68a', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', maxWidth: 200 }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{idea.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', lineHeight: 1.4 }}>{idea.cost} · {idea.estimatedTime}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Coach panel */}
      {showAIPanel && (
        <div style={{ width: 280, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }} className="ai-panel">
          {/* Header */}
          <div style={{ padding: '18px 18px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={14} color="#a78bfa" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>AI Conversation Coach</span>
            </div>

          {/* Current tip */}
          {aiV2Enabled && (
            <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>V2 Assistant</div>
                <button
                  onClick={generateThreadInsight}
                  disabled={threadSummaryLoading}
                  style={{ border: '1px solid rgba(52,211,153,0.25)', background: 'rgba(52,211,153,0.1)', color: '#86efac', fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {threadSummaryLoading ? 'Working…' : 'Summarize'}
                </button>
              </div>
              {threadInsight ? (
                <>
                  <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.7)', lineHeight: 1.6, marginBottom: 6 }}>
                    {threadInsight.summary}
                  </div>
                  {threadInsight.replyCoach && (
                    <button
                      onClick={() => { setInput(threadInsight.replyCoach); inputRef.current?.focus(); }}
                      style={{ width: '100%', textAlign: 'left', border: '1px solid rgba(52,211,153,0.22)', background: 'rgba(52,211,153,0.08)', color: '#bbf7d0', borderRadius: 10, padding: '8px 10px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 6 }}
                    >
                      Coach reply: {threadInsight.replyCoach}
                    </button>
                  )}
                  <div style={{ fontSize: 10, color: 'rgba(240,240,255,0.42)' }}>Why: {(threadInsight.why ?? []).slice(0, 2).join(' • ')}</div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.45)' }}>
                  Generate a concise thread summary, suggested reply, and why signals.
                </div>
              )}
            </div>
          )}

          {/* Current tip */}
          <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={11} color="#a78bfa" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Suggestion</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(240,240,255,0.65)', lineHeight: 1.6, margin: 0 }}>
                {AI_CONVERSATION_TIPS[aiTipIdx]}
              </p>
            </div>

            {/* Quick replies */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick starters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  "What's been the highlight of your week?",
                  `I noticed you're into ${profile.interests[0]} — how'd you get into that?`,
                  "If you could go anywhere this weekend, where would it be?",
                  "What's your idea of a perfect Sunday?",
                ].map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(msg); inputRef.current?.focus(); }}
                    style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'rgba(240,240,255,0.55)', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.07)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.color = '#c4b5fd'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(240,240,255,0.55)'; }}
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compatibility reminder */}
          <div style={{ padding: '0 18px', marginBottom: 16 }}>
            <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#34d399', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connection strength</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 4 ? '#34d399' : 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', lineHeight: 1.5 }}>
                Conversation progressing well — avg. response time 12 min.
              </div>
            </div>
          </div>

          {/* Date ideas section */}
          <div style={{ padding: '0 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>First date ideas</div>
            {DATE_IDEAS.slice(0, 2).map(idea => (
              <div key={idea.title} style={{ marginBottom: 8, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => { setInput(`How about: ${idea.title}? ${idea.description}`); inputRef.current?.focus(); }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fde68a', marginBottom: 4 }}>{idea.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', lineHeight: 1.4 }}>{idea.description}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <span className="tag tag-amber" style={{ fontSize: 10 }}>{idea.cost}</span>
                  <span className="tag" style={{ fontSize: 10 }}>{idea.estimatedTime}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Safety note */}
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 4 }}>🛡️ Safety score</div>
              <div style={{ fontSize: 11, color: 'rgba(52,211,153,0.8)' }}>✓ No red flags detected in this conversation.</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .ai-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
