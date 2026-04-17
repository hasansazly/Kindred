'use client';

import { useState } from 'react';
import { BookOpen, Clock, Zap, ArrowRight, Trophy } from 'lucide-react';

const COURSES = [
  {
    id: 'attachment',
    emoji: '🧠',
    title: 'Attachment Theory',
    desc: 'Understand your attachment style and how it shapes every relationship you have.',
    lessons: 8, done: 3, time: '45 min',
    color: '#a78bfa', colorBg: 'rgba(167,139,250,0.1)', colorBorder: 'rgba(167,139,250,0.2)',
    tags: ['Psychology', 'Self-awareness'],
  },
  {
    id: 'communication',
    emoji: '💬',
    title: 'Communication Mastery',
    desc: 'Say what you mean, hear what they mean. The skill that makes or breaks relationships.',
    lessons: 10, done: 1, time: '60 min',
    color: '#34d399', colorBg: 'rgba(52,211,153,0.1)', colorBorder: 'rgba(52,211,153,0.2)',
    tags: ['Communication', 'Conflict'],
  },
  {
    id: 'redflags',
    emoji: '🚩',
    title: 'Red Flags & Green Flags',
    desc: 'Learn to spot patterns early. Real examples, real situations, research-backed.',
    lessons: 6, done: 6, time: '35 min',
    color: '#fb7185', colorBg: 'rgba(251,113,133,0.1)', colorBorder: 'rgba(251,113,133,0.2)',
    tags: ['Safety', 'Awareness'],
  },
  {
    id: 'lovelanguages',
    emoji: '❤️',
    title: 'Love Languages Deep Dive',
    desc: "Chapman's 5 languages — learn how to apply them in real modern relationships.",
    lessons: 5, done: 0, time: '30 min',
    color: '#fbbf24', colorBg: 'rgba(251,191,36,0.1)', colorBorder: 'rgba(251,191,36,0.2)',
    tags: ['Intimacy', 'Connection'],
  },
  {
    id: 'confidence',
    emoji: '✨',
    title: 'Authentic Confidence',
    desc: "Real confidence that attracts the right people — not fake it till you make it.",
    lessons: 7, done: 0, time: '40 min',
    color: '#60a5fa', colorBg: 'rgba(96,165,250,0.1)', colorBorder: 'rgba(96,165,250,0.2)',
    tags: ['Mindset', 'Dating'],
  },
  {
    id: 'couples',
    emoji: '💑',
    title: 'Thriving as a Couple',
    desc: 'Research-backed habits for couples who stay deeply connected long-term.',
    lessons: 12, done: 0, time: '75 min',
    color: '#f472b6', colorBg: 'rgba(244,114,182,0.1)', colorBorder: 'rgba(244,114,182,0.2)',
    tags: ['Relationship', 'Long-term'],
  },
];

const DAILY_LESSON = {
  title: 'Why anxious and avoidant attract each other',
  course: 'Attachment Theory',
  duration: '6 min read',
  preview: "The anxious-avoidant trap is the most common relationship dynamic — and the most painful. Here's the research on why opposites attract, and how to break the cycle.",
};

type Filter = 'all' | 'inprogress' | 'done';

export default function AcademyPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const totalLessons = COURSES.reduce((s, c) => s + c.lessons, 0);
  const doneLessons  = COURSES.reduce((s, c) => s + c.done, 0);
  const pct = Math.round((doneLessons / totalLessons) * 100);

  const filtered = COURSES.filter(c => {
    if (filter === 'inprogress') return c.done > 0 && c.done < c.lessons;
    if (filter === 'done')       return c.done === c.lessons;
    return true;
  });

  return (
    <div className="app-interior-page academy-page" style={{ padding: '32px', maxWidth: 820, width: '100%', margin: '0 auto', color: '#FFFFFF' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, rgba(96,165,250,0.3), rgba(167,139,250,0.3))', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={18} color="#60a5fa" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>Vinculo Guidance</h1>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Support layer for active matches: practical guidance that helps conversations and dates go better.</p>
      </div>

      {/* Progress */}
      <div className="glass" style={{ borderRadius: 22, padding: '20px 24px', marginBottom: 20, background: '#FFFFFF', border: '1px solid #E5E3DF' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>Your progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#534AB7' }}>{doneLessons}/{totalLessons} lessons</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 3 }} />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['🔥 5-day streak', `⭐ ${pct}% complete`, '🏆 1 guide completed'].map(s => (
                <span key={s} style={{ fontSize: 12, color: '#5F5E5A' }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(96,165,250,0.2))', border: '2px solid rgba(139,92,246,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>{pct}%</span>
            <span style={{ fontSize: 9, color: '#5F5E5A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>done</span>
          </div>
        </div>
      </div>

      {/* Daily lesson */}
      <div style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(167,139,250,0.08))', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 20, padding: '20px 22px', marginBottom: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(96,165,250,0.07)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="#60a5fa" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Today&apos;s Guidance</div>
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: '#FFFFFF' }}>{DAILY_LESSON.title}</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 12 }}>{DAILY_LESSON.preview}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {DAILY_LESSON.duration}
                </span>
              <button className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>
                Read now <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
        {([['all', 'All Courses'], ['inprogress', 'In Progress'], ['done', 'Completed']] as [Filter, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${filter === val ? '#FFFFFF' : 'rgba(255,255,255,0.2)'}`, background: filter === val ? '#FFFFFF' : 'transparent', color: filter === val ? '#1A1A2E' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: filter === val ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div className="academy-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {filtered.map(course => {
          const p = course.lessons > 0 ? Math.round((course.done / course.lessons) * 100) : 0;
          const isDone = course.done === course.lessons && course.lessons > 0;
          return (
            <div
              key={course.id}
              className="glass card-lift"
              style={{ borderRadius: 20, padding: '20px', cursor: 'pointer', border: `1px solid ${isDone ? course.colorBorder : 'rgba(255,255,255,0.07)'}`, background: isDone ? course.colorBg : 'rgba(255,255,255,0.035)', position: 'relative', overflow: 'hidden' }}
            >
              {isDone && <div style={{ position: 'absolute', top: 12, right: 12 }}><Trophy size={14} color={course.color} /></div>}

              <div style={{ fontSize: 32, marginBottom: 12 }}>{course.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, paddingRight: 20 }}>{course.title}</div>
              <p style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>{course.desc}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {course.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, color: course.color, background: course.colorBg, border: `1px solid ${course.colorBorder}`, borderRadius: 999, padding: '2px 8px' }}>{t}</span>
                ))}
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)' }}>{course.done}/{course.lessons} lessons</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: course.color }}>{p}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p}%`, background: course.color, borderRadius: 2 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {course.time}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: course.color }}>{isDone ? 'Review →' : course.done > 0 ? 'Continue →' : 'Start →'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .academy-page { padding: 24px 16px 32px !important; }
          .academy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
