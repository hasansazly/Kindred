'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Brain, Sparkles, WandSparkles, X } from 'lucide-react';
import { useAiV2 } from '@/hooks/useAiV2';
import { AI_V2_STORAGE } from '@/lib/aiV2';

interface AiShellResult {
  title: string;
  summary: string;
  suggestions: string[];
  why: string[];
  confidence: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
}

const QUICK_COMMANDS = [
  'plan a date for Friday',
  'summarize this conversation',
  'coach my next reply',
  'what should I do next?',
];

function contextHint(pathname: string): string {
  if (pathname.includes('/messages')) return 'I can summarize this thread and draft a better next reply.';
  if (pathname.includes('/matches')) return 'I can explain match quality and suggest your next best move.';
  if (pathname.includes('/spark')) return 'I can generate a natural follow-up from today’s Spark answers.';
  if (pathname.includes('/discover')) return 'I can suggest who to prioritize and why.';
  return 'I can explain, coach, summarize, and plan actions with clear reasons.';
}

export default function AssistantShell() {
  const pathname = usePathname();
  const { enabled, phase, releaseTrack } = useAiV2('user-1');
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiShellResult | null>(null);

  const proactiveNudge = useMemo(() => {
    if (pathname.includes('/messages')) return 'Nudge: ask one specific follow-up question to keep momentum.';
    if (pathname.includes('/matches')) return 'Nudge: prioritize top 2 matches and move one conversation to a date plan.';
    if (pathname.includes('/spark')) return 'Nudge: send a follow-up within 15 minutes of Spark reveal.';
    return 'Nudge: focus on one high-intent action instead of opening new chats.';
  }, [pathname]);

  async function runAssistant(command: string) {
    if (!command.trim()) return;
    setLoading(true);
    try {
      const memory =
        phase >= 3 ? JSON.parse(localStorage.getItem(AI_V2_STORAGE.memory) ?? '[]') : [];
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assistant_shell',
          context: {
            route: pathname,
            command,
            phase,
            releaseTrack,
            memory,
          },
        }),
      });
      const data = await res.json();
      const nextResult = data.result as AiShellResult;
      setResult(nextResult);
      setInput('');

      if (phase >= 3) {
        const nextMemory = [
          ...(Array.isArray(memory) ? memory : []),
          {
            t: new Date().toISOString(),
            route: pathname,
            command,
            title: nextResult?.title ?? 'Assistant note',
          },
        ].slice(-25);
        localStorage.setItem(AI_V2_STORAGE.memory, JSON.stringify(nextMemory));
      }
    } catch {
      setResult({
        title: 'Assistant temporarily unavailable',
        summary: 'I could not complete that request just now. Try again in a moment.',
        suggestions: ['Try a shorter command', 'Retry from the same page'],
        why: ['Network or API issue'],
        confidence: 'low',
        requiresApproval: false,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))',
            width: 'min(360px, calc(100vw - 24px))',
            borderRadius: 16,
            border: '1px solid rgba(139,92,246,0.3)',
            background: 'rgba(12,12,23,0.95)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            zIndex: 1100,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={15} color="#a78bfa" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>Kindred Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(240,240,255,0.45)', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.55)', marginBottom: 8, lineHeight: 1.5 }}>
              {contextHint(pathname)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.85)', marginBottom: 10 }}>
              {proactiveNudge}
            </div>

            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
              {QUICK_COMMANDS.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => runAssistant(cmd)}
                  style={{
                    flexShrink: 0,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(240,240,255,0.75)',
                    padding: '6px 10px',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') runAssistant(input);
                }}
                placeholder="Try: plan a date for Friday"
                style={{
                  flex: 1,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#f0f0ff',
                  fontSize: 13,
                  padding: '10px 12px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => runAssistant(input)}
                disabled={loading}
                className="btn-primary"
                style={{ minWidth: 42, minHeight: 42, padding: '0 12px' }}
                title="Run assistant"
              >
                <WandSparkles size={15} />
              </button>
            </div>

            {result && (
              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', padding: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Sparkles size={12} color="#a78bfa" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>{result.title}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.72)', lineHeight: 1.5, marginBottom: 8 }}>{result.summary}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                  {result.suggestions.slice(0, 3).map((item, idx) => (
                    <div key={`${item}-${idx}`} style={{ fontSize: 12, color: 'rgba(240,240,255,0.66)' }}>
                      • {item}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.45)', marginBottom: 6 }}>Why:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.why.slice(0, 3).map((item, idx) => (
                    <div key={`${item}-${idx}`} style={{ fontSize: 11, color: 'rgba(240,240,255,0.52)' }}>
                      • {item}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(240,240,255,0.4)' }}>
                  Confidence: {result.confidence} · {result.requiresApproval ? 'Approval needed for any action' : 'Suggestions only'}
                </div>
              </div>
            )}

            {phase >= 2 && (
              <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(240,240,255,0.4)' }}>
                Phase 2 active: automations require explicit approval.
              </div>
            )}
            {phase >= 3 && (
              <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(240,240,255,0.4)' }}>
                Phase 3 active: context memory is personalized for this user.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open Kindred Assistant"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px) + 56px)',
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.45)',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.92), rgba(219,39,119,0.92))',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1100,
          boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
        }}
      >
        <Brain size={20} />
      </button>
    </>
  );
}

