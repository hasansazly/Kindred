'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Edit3, MapPin, Briefcase, GraduationCap, Sparkles, Brain, CheckCircle, Plus } from 'lucide-react';
import { getSupabaseBrowserClient } from '../../../../utils/supabase/client';
import { getCompatibilityColor } from '@/lib/utils';

type ProfileViewUser = {
  name: string;
  age: number;
  occupation: string;
  location: string;
  education: string;
  auraScore: number;
  bio: string;
  photos: string[];
  interests: string[];
  values: string[];
  height: string;
  relationshipGoal: string;
  attachmentStyle: string;
  loveLanguage: string;
  drinking: string;
  smoking: string;
  kids: string;
  personalityTraits: string[];
};

const DEFAULT_PROFILE_PHOTO = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80';

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'aura' | 'stats'>('profile');
  const [user, setUser] = useState<ProfileViewUser | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoadError('');
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          router.push('/auth/login');
          return;
        }

        const [{ data: profile }, { data: onboardingRows }, { data: preferences }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
          supabase.from('onboarding_responses').select('category,response').eq('user_id', authUser.id),
          supabase.from('match_preferences').select('*').eq('user_id', authUser.id).maybeSingle(),
        ]);

        const responsesByCategory = new Map<string, Record<string, unknown>>();
        (onboardingRows ?? []).forEach((row: { category: string; response: unknown }) => {
          if (row && typeof row.response === 'object' && row.response !== null) {
            responsesByCategory.set(row.category, row.response as Record<string, unknown>);
          }
        });

        const demographics = responsesByCategory.get('demographics') ?? {};
        const valuesResponse = responsesByCategory.get('values') ?? {};
        const lifestyleResponse = responsesByCategory.get('lifestyle') ?? {};
        const intentResponse = responsesByCategory.get('relationship_intent') ?? {};
        const communicationResponse = responsesByCategory.get('communication_style') ?? {};

        const name =
          profile?.full_name ||
          (typeof demographics.fullName === 'string' ? demographics.fullName : '') ||
          authUser.email?.split('@')[0] ||
          'You';

        const ageRaw = profile?.age ?? (typeof demographics.age === 'number' ? demographics.age : null);
        const age = typeof ageRaw === 'number' && Number.isFinite(ageRaw) ? ageRaw : 0;
        const interests = toStringArray(profile?.interests).length
          ? toStringArray(profile?.interests)
          : toStringArray(demographics.interests);
        const values = toStringArray(profile?.core_values).length
          ? toStringArray(profile?.core_values)
          : toStringArray(valuesResponse.values).length
            ? toStringArray(valuesResponse.values)
            : toStringArray(preferences?.values);
        const lifestyle = toStringArray(profile?.lifestyle_tags).length
          ? toStringArray(profile?.lifestyle_tags)
          : toStringArray(lifestyleResponse.lifestyle).length
            ? toStringArray(lifestyleResponse.lifestyle)
            : toStringArray(preferences?.lifestyle);
        const relationshipGoal =
          preferences?.relationship_intent ||
          (typeof intentResponse.relationshipIntent === 'string' ? intentResponse.relationshipIntent : '') ||
          'Not set yet';
        const communicationStyle =
          preferences?.communication_style ||
          (typeof communicationResponse.communicationStyle === 'string' ? communicationResponse.communicationStyle : '');

        const completionSignals = [
          Boolean(profile?.bio || demographics.bio),
          interests.length >= 3,
          values.length >= 3,
          lifestyle.length >= 2,
          relationshipGoal !== 'Not set yet',
        ].filter(Boolean).length;
        const auraScore = Math.min(99, 65 + completionSignals * 6);

        const nextUser: ProfileViewUser = {
          name,
          age,
          occupation: profile?.occupation || (typeof demographics.occupation === 'string' ? demographics.occupation : '') || 'Not set yet',
          location: profile?.location || (typeof demographics.location === 'string' ? demographics.location : '') || 'Not set yet',
          education: 'Not set yet',
          auraScore,
          bio: profile?.bio || (typeof demographics.bio === 'string' ? demographics.bio : '') || 'Add your bio in onboarding.',
          photos: [DEFAULT_PROFILE_PHOTO],
          interests,
          values,
          height: 'Not set yet',
          relationshipGoal,
          attachmentStyle: 'Not set yet',
          loveLanguage: communicationStyle || 'Not set yet',
          drinking: 'Not set yet',
          smoking: 'Not set yet',
          kids: 'Not set yet',
          personalityTraits: lifestyle.length ? lifestyle : ['Intentional', 'Authentic'],
        };

        if (active) {
          setUser(nextUser);
        }
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'Failed to load profile.';
          setLoadError(message);
        }
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="profile-page" style={{ padding: '32px', maxWidth: 800, width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>Your Profile</h1>
        <p style={{ color: 'rgba(240,240,255,0.65)', fontSize: 14 }}>
          {loadError ? `Could not load profile: ${loadError}` : 'Loading your profile...'}
        </p>
      </div>
    );
  }

  const AURA_DIMENSIONS = [
    { label: 'Emotional Intelligence', score: 88, desc: 'High empathy, strong emotional awareness' },
    { label: 'Communication Style', score: 84, desc: 'Thoughtful, articulate, and warm' },
    { label: 'Adventurousness', score: 79, desc: 'Open to new experiences, moderately spontaneous' },
    { label: 'Ambition', score: 92, desc: 'Goal-oriented with healthy work-life balance' },
    { label: 'Humor', score: 86, desc: 'Playful wit, not at others\' expense' },
    { label: 'Depth', score: 91, desc: 'Prefers meaningful conversation over small talk' },
  ];

  return (
    <div className="profile-page" style={{ padding: '32px', maxWidth: 800, width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div className="profile-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Your Profile</h1>
        <button
          onClick={() => router.push('/app/settings')}
          className="btn-ghost profile-edit-btn"
          style={{ padding: '9px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Edit3 size={14} />
          Edit Profile
        </button>
      </div>

      {/* Profile hero */}
      <div className="glass" style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>
        {/* Banner */}
        <div style={{ height: 140, background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(219,39,119,0.3) 50%, rgba(251,191,36,0.2) 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.6) 0%, transparent 40%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 40%)' }} />
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', display: 'inline-block', marginTop: -48 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '4px solid #0f0f1a', boxShadow: '0 0 0 2px rgba(139,92,246,0.3)' }}>
              <img src={user.photos[0] ?? DEFAULT_PROFILE_PHOTO} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <button style={{ position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={12} color="white" />
            </button>
          </div>

          <div className="profile-hero-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{user.name}, {user.age}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 999, padding: '2px 8px' }}>
                  <CheckCircle size={11} color="#34d399" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Verified</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {user.occupation && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>
                    <Briefcase size={13} /> {user.occupation}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>
                  <MapPin size={13} /> {user.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>
                  <GraduationCap size={13} /> {user.education}
                </span>
              </div>
            </div>

            {/* Aura score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 68, height: 68 }}>
                <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="34" cy="34" r="28" fill="none" stroke="#8b5cf6" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 28 * user.auraScore / 100} ${2 * Math.PI * 28}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>{user.auraScore}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                <Sparkles size={10} color="#a78bfa" />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa' }}>Aura Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs" style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {([['profile', 'Profile'], ['aura', '✨ Aura Analysis'], ['stats', '📊 Stats']] as [string, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: activeTab === tab ? 'rgba(139,92,246,0.15)' : 'transparent', color: activeTab === tab ? '#c4b5fd' : 'rgba(240,240,255,0.45)', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', borderStyle: 'solid', borderWidth: 1, borderColor: activeTab === tab ? 'rgba(139,92,246,0.25)' : 'transparent' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Bio */}
          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>About</div>
            <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.75 }}>{user.bio}</p>
          </div>

          {/* Photos */}
          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photos</div>
            <div className="profile-photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {user.photos.map((src, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {/* Add photo */}
              <div style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Plus size={20} color="rgba(255,255,255,0.3)" />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Add</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Interests</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {user.interests.map(i => <span key={i} className="tag tag-violet" style={{ fontSize: 13 }}>{i}</span>)}
            </div>
          </div>

          {/* Values */}
          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core values</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {user.values.map(v => <span key={v} className="tag tag-rose" style={{ fontSize: 13 }}>{v}</span>)}
            </div>
          </div>

          {/* Details */}
          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Life details</div>
            <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Height', value: user.height },
                { label: 'Relationship Goal', value: user.relationshipGoal },
                { label: 'Attachment Style', value: user.attachmentStyle },
                { label: 'Love Language', value: user.loveLanguage },
                { label: 'Drinks', value: user.drinking },
                { label: 'Smokes', value: user.smoking },
                { label: 'Kids', value: user.kids },
              ].filter(d => d.value).map(d => (
                <div key={d.label}>
                  <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize', color: 'rgba(240,240,255,0.75)' }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'aura' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Brain size={16} color="#a78bfa" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>Your Aura Profile</span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.55)', lineHeight: 1.7, marginBottom: 20 }}>
              Your Aura Score is computed from your personality responses, communication patterns, and stated values. It powers how we find your most compatible matches.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {AURA_DIMENSIONS.map(dim => {
                const color = getCompatibilityColor(dim.score);
                return (
                  <div key={dim.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{dim.label}</span>
                        <span className="aura-desc" style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)', marginLeft: 8, display: 'inline' }}>{dim.desc}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>{dim.score}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${dim.score}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12 }}>Personality snapshot</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {user.personalityTraits.map(t => (
                <span key={t} className="tag" style={{ fontSize: 13, background: 'rgba(255,255,255,0.06)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { label: 'Profile Views', value: '243', icon: '👁️', change: '+12% this week' },
              { label: 'Matches', value: '12', icon: '💫', change: '+3 this week' },
              { label: 'Liked You', value: '38', icon: '❤️', change: 'Upgrade to see who' },
              { label: 'Conversations', value: '6', icon: '💬', change: '3 active' },
            ].map(s => (
              <div key={s.label} className="glass card-lift" style={{ borderRadius: 18, padding: '18px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }} className="gradient-text-violet">{s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.6)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)' }}>{s.change}</div>
              </div>
            ))}
          </div>

          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 14 }}>Profile strength</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Photos', done: true },
                { label: 'Bio written', done: true },
                { label: 'Interests added', done: true },
                { label: 'Values set', done: true },
                { label: 'Personality quiz', done: true },
                { label: 'Phone verified', done: false },
                { label: 'Instagram linked', done: false },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${item.done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.done && <CheckCircle size={12} color="#34d399" />}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? 'rgba(240,240,255,0.7)' : 'rgba(240,240,255,0.35)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 767px) {
          .profile-page { padding: 24px 16px 32px !important; }
          .profile-header-row { flex-wrap: wrap; gap: 12px; }
          .profile-edit-btn { width: 100%; justify-content: center; }
          .profile-photos-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .profile-stats-grid { grid-template-columns: 1fr !important; }
          .aura-desc { display: block !important; margin-left: 0 !important; margin-top: 2px; }
        }
      `}</style>
    </div>
  );
}
