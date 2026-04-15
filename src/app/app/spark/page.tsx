'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Clock, Send, Eye, EyeOff, Lock, Sparkles,
  Star, ArrowRight, Brain, CheckCircle, Heart, BookOpen,
} from 'lucide-react';
import { TODAY_SPARKS, PAST_SPARKS, CATEGORY_COLORS } from '@/lib/sparkData';
import type { SparkEntry } from '@/lib/sparkData';
import { useAiV2 } from '@/hooks/useAiV2';

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m left`);
      setIsUrgent(diff < 3 * 3600000);
    }
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: isUrgent ? '#fb7185' : 'rgba(240,240,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
      <Clock size={11} />
      {timeLeft}
    </span>
  );
}

function StreakBadge({ days }: { days: number }) {
  const flames = days >= 7 ? 3 : days >= 3 ? 2 : 1;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 999, padding: '4px 10px' }}>
      {'🔥'.repeat(flames)}
      <span style={{ fontSize: 12, fontWeight: 700, color: '#fb923c' }}>{days} day streak</span>
    </div>
  );
}

function RevealedCard({ spark, aiV2Enabled }: { spark: SparkEntry; aiV2Enabled: boolean }) {
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [followUpWhy, setFollowUpWhy] = useState<string[]>([]);
  const colors = CATEGORY_COLORS[spark.question.category];

  async function generateFollowUp() {
    setFollowUpLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'spark_followup',
          context: {
            question: spark.question.question,
            myAnswer: spark.myAnswer,
            theirAnswer: spark.theirAnswer,
          },
        }),
      });
      const data = await res.json();
      const result = data?.result;
      if (result && typeof result === 'object') {
        setFollowUpText(String(result.followUp ?? ''));
        setFollowUpWhy(Array.isArray(result.why) ? result.why.slice(0, 3) : []);
      }
    } catch {
      setFollowUpText('I love your answer. Want to continue this in chat?');
      setFollowUpWhy(['Uses shared Spark context', 'Turns insight into action']);
    } finally {
      setFollowUpLoading(false);
    }
  }

  return (
    <div className="glass" style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
              <img src={spark.matchPhoto} alt={spark.matchName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{spark.matchName}</div>
              <StreakBadge days={spark.streakDay} />
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: colors.bg, border: `1px solid ${colors.border}` }}>
            <Sparkles size={11} color={colors.text} />
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{CATEGORY_COLORS[spark.question.category].label}</span>
          </div>
        </div>

        <p style={{ fontSize: 17, fontWeight: 700, color: '#f0f0ff', lineHeight: 1.45, letterSpacing: '-0.01em' }}>{spark.question.question}</p>
      </div>

      {/* Answers */}
      <div className="spark-answers-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* My answer */}
        <div style={{ padding: '18px 22px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>You</div>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.75)', lineHeight: 1.65 }}>{spark.myAnswer}</p>
        </div>
        {/* Their answer */}
        <div style={{ padding: '18px 22px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{spark.matchName}</div>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.75)', lineHeight: 1.65 }}>{spark.theirAnswer}</p>
        </div>
      </div>

      {/* AI follow-up + actions */}
      <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(139,92,246,0.04)' }}>
        {spark.question.followUp && (
          <button
            onClick={() => setShowFollowUp(!showFollowUp)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, marginBottom: showFollowUp ? 10 : 0, padding: 0 }}
          >
            <Brain size={13} />
            {showFollowUp ? 'Hide' : 'AI Insight'} ↓
          </button>
        )}
        {showFollowUp && spark.question.followUp && (
          <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10 }}>
            {spark.question.followUp}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => {}}
            style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(240,240,255,0.55)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Heart size={13} /> React
          </button>
          <button
            onClick={() => {}}
            style={{ flex: 2, padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ArrowRight size={13} /> Continue in chat
          </button>
        </div>
        {aiV2Enabled && (
          <div style={{ marginTop: 10, borderRadius: 10, border: '1px solid rgba(52,211,153,0.18)', background: 'rgba(52,211,153,0.06)', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.06em' }}>V2 Follow-up Generator</div>
              <button
                onClick={generateFollowUp}
                disabled={followUpLoading}
                style={{ border: '1px solid rgba(52,211,153,0.24)', background: 'rgba(52,211,153,0.08)', color: '#bbf7d0', borderRadius: 999, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {followUpLoading ? 'Generating…' : 'Generate'}
              </button>
            </div>
            {followUpText ? (
              <>
                <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.75)', lineHeight: 1.6, marginBottom: 6 }}>{followUpText}</div>
                <div style={{ fontSize: 10, color: 'rgba(240,240,255,0.45)' }}>Why: {followUpWhy.join(' • ')}</div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.5)' }}>Create one natural message to continue this Spark in chat.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WaitingCard({ spark, pinLockCta = false }: { spark: SparkEntry; pinLockCta?: boolean }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const colors = CATEGORY_COLORS[spark.question.category];
  const theyAnswered = spark.theirAnswer !== null;

  function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="glass" style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                <img src={spark.matchPhoto} alt={spark.matchName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {theyAnswered && (
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#34d399', border: '2px solid #0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={8} color="white" />
                </div>
              )}
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{spark.matchName}</span>
              <div style={{ fontSize: 11, color: theyAnswered ? '#34d399' : 'rgba(240,240,255,0.35)', marginTop: 2 }}>
                {theyAnswered ? '✓ Already answered — waiting for you!' : 'Waiting for both of you…'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StreakBadge days={spark.streakDay} />
            <CountdownTimer expiresAt={spark.expiresAt} />
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: colors.bg, border: `1px solid ${colors.border}`, marginBottom: 14 }}>
          <Sparkles size={11} color={colors.text} />
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{CATEGORY_COLORS[spark.question.category].label}</span>
        </div>

        <p style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', lineHeight: 1.45, letterSpacing: '-0.01em' }}>
          {spark.question.question}
        </p>
      </div>

      {/* Answer area */}
      <div style={{ padding: '18px 22px' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle size={26} color="#34d399" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              {theyAnswered ? '🎉 Both answered! Revealing…' : 'Answer sent!'}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.45)', lineHeight: 1.6 }}>
              {theyAnswered
                ? "You'll both see each other's answers now."
                : `You'll see ${spark.matchName}'s answer the moment they reply. Their answer is hidden until then.`}
            </p>
            {theyAnswered && (
              <div style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#34d399', marginBottom: 6 }}>{spark.matchName} said:</div>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.65 }}>
                  I dream about a place where I can have a garden and still be close to a great food scene. Somewhere that feels like a community, not just a place.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Privacy note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 10, padding: '8px 12px', marginBottom: 14 }}>
              <Lock size={12} color="#fde68a" />
              <span style={{ fontSize: 12, color: '#fde68a' }}>Your answer is hidden until {spark.matchName} also replies. No peeking.</span>
            </div>

            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your honest answer… there are no wrong ones."
              rows={4}
              maxLength={500}
              className="input-field"
              style={{ resize: 'none', lineHeight: 1.65, width: '100%', minHeight: 120, marginBottom: 10 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.25)' }}>{answer.length}/500</span>
              {answer.length > 0 && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.4)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}
                >
                  {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPreview ? 'Hide preview' : 'Preview'}
                </button>
              )}
            </div>

            {showPreview && answer.length > 0 && (
              <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 6 }}>How {spark.matchName} will see it</div>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.65 }}>{answer}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className={`btn-primary ${pinLockCta ? 'spark-lock-cta' : ''}`}
              style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '13px', opacity: answer.trim() ? 1 : 0.4 }}
            >
              <Send size={15} />
              Lock in your answer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SparkPage() {
  const router = useRouter();
  const { enabled: aiV2Enabled } = useAiV2('user-1');
  const [tab, setTab] = useState<'today' | 'archive'>('today');

  const pending = TODAY_SPARKS.filter(s => !s.bothAnswered);
  const revealed = TODAY_SPARKS.filter(s => s.bothAnswered);
  const totalStreak = Math.max(...TODAY_SPARKS.map(s => s.streakDay));

  // Compute hours until midnight reset
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / 3600000);
  const minsLeft = Math.floor(((midnight.getTime() - now.getTime()) % 3600000) / 60000);

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 780, width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, rgba(251,146,60,0.3), rgba(244,63,94,0.3))', border: '1px solid rgba(251,146,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={18} color="#fb923c" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Daily Spark</h1>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>
          One question per match, every day. Answers reveal only when both of you reply.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }} className="spark-stats">
        {[
          { icon: '🔥', label: 'Best Streak', value: `${totalStreak} days`, sub: 'with Sophie' },
          { icon: '⏳', label: 'Resets in', value: `${hoursLeft}h ${minsLeft}m`, sub: 'new questions at midnight' },
          { icon: '✅', label: 'Revealed Today', value: `${revealed.length}/${TODAY_SPARKS.length}`, sub: 'both answered' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(240,240,255,0.35)', lineHeight: 1.4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* How it works — shown when nothing pending */}
      {pending.length === 0 && revealed.length === 0 && (
        <div className="glass" style={{ borderRadius: 20, padding: '32px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your Sparks arrive at midnight</h3>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 20px' }}>
            Every day, Vinculo generates one AI-curated question for each of your active matches — tailored to your compatibility profile. Both of you answer independently. Neither can see the other&apos;s response until both have replied.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', margin: '0 auto' }}>
            {['Answer privately', 'Both reply to reveal', 'Go deeper in chat'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="spark-tabs" style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
        {([['today', `Today (${TODAY_SPARKS.length})`], ['archive', 'Archive']] as [string, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as typeof tab)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: tab === t ? 'rgba(251,146,60,0.15)' : 'transparent', color: tab === t ? '#fb923c' : 'rgba(240,240,255,0.4)', fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', borderStyle: 'solid', borderWidth: 1, borderColor: tab === t ? 'rgba(251,146,60,0.25)' : 'transparent' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <div className="spark-today-pane">
          {/* Pending (waiting for both) */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Waiting for answers ({pending.length})
              </div>
              {pending.map((spark, idx) => <WaitingCard key={spark.matchId} spark={spark} pinLockCta={idx === 0} />)}
            </div>
          )}

          {/* Revealed */}
          {revealed.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Both answered ✓ ({revealed.length})
              </div>
              {revealed.map(spark => <RevealedCard key={spark.matchId} spark={spark} aiV2Enabled={aiV2Enabled} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'archive' && (
        <div>
          {PAST_SPARKS.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(240,240,255,0.3)', fontSize: 14 }}>
              No past Sparks yet. Keep answering daily to build your archive.
            </div>
          ) : (
            PAST_SPARKS.map(spark => <RevealedCard key={`${spark.matchId}-${spark.date}`} spark={spark} aiV2Enabled={aiV2Enabled} />)
          )}
        </div>
      )}

      {/* AI Coach + Guidance promo cards */}
      <div className="spark-promo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
        <div onClick={() => router.push('/app/coach')} className="card-lift" style={{ borderRadius: 18, padding: '18px', cursor: 'pointer', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <Brain size={22} color="#a78bfa" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>AI Coach</div>
          <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', lineHeight: 1.4, marginBottom: 10 }}>Pre-date prep, debrief, match intelligence.</div>
          <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>Open →</span>
        </div>
        <div onClick={() => router.push('/app/academy')} className="card-lift" style={{ borderRadius: 18, padding: '18px', cursor: 'pointer', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <BookOpen size={22} color="#60a5fa" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Match Guidance</div>
          <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', lineHeight: 1.4, marginBottom: 10 }}>Short playbooks to help this match go better.</div>
          <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>Open →</span>
        </div>
      </div>

      {/* Upgrade prompt */}
      <div style={{ marginTop: 16, background: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(244,63,94,0.06))', border: '1px solid rgba(251,146,60,0.18)', borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Star size={20} color="#fb923c" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Spark Plus — coming with Spark plan</div>
          <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>Send bonus questions anytime, choose question categories, and see streak leaderboards.</div>
        </div>
        <button className="btn-primary" style={{ fontSize: 12, padding: '9px 16px', flexShrink: 0 }}>Upgrade</button>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .spark-answers-grid { grid-template-columns: 1fr !important; }
          .spark-answers-grid > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .spark-tabs { width: 100%; }
          .spark-today-pane { padding-bottom: 86px; }
          .spark-promo-grid { grid-template-columns: 1fr 1fr !important; }
          .spark-lock-cta {
            position: fixed;
            left: 16px;
            right: 16px;
            bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 8px);
            z-index: 999;
          }
        }
      `}</style>
    </div>
  );
}
