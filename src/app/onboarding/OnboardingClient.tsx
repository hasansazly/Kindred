'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, Heart } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';

type OnboardingClientProps = {
  userEmail: string;
  initialProfile: {
    fullName: string;
    age: string;
    gender: string;
    location: string;
    occupation: string;
    bio: string;
    interests: string[];
    values: string[];
    lifestyle: string[];
  };
};

type FormState = {
  fullName: string;
  age: string;
  gender: string;
  location: string;
  occupation: string;
  bio: string;
  interests: string[];
  relationshipIntent: string;
  communicationStyle: string;
  values: string[];
  lifestyle: string[];
  pace: string;
  dealbreakers: string[];
  dealbreakerInput: string;
  interestedIn: string[];
  minAge: number;
  maxAge: number;
  distanceKm: number;
};

const TOTAL_STEPS = 7;
const INTEREST_OPTIONS = [
  'Travel',
  'Fitness',
  'Books',
  'Music',
  'Cooking',
  'Outdoors',
  'Art',
  'Tech',
  'Faith',
  'Mindfulness',
  'Family Time',
  'Entrepreneurship',
];
const VALUE_OPTIONS = ['Honesty', 'Growth', 'Kindness', 'Loyalty', 'Ambition', 'Faith', 'Humor', 'Family'];
const LIFESTYLE_OPTIONS = [
  'Homebody',
  'Social Weekends',
  'Early Riser',
  'Night Owl',
  'Active',
  'Career-Focused',
  'Balanced',
  'Spiritual',
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            borderRadius: 2,
            width: i === current - 1 ? 26 : 12,
            background:
              i < current ? 'linear-gradient(90deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.12)',
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

function TogglePills({
  options,
  selected,
  onToggle,
  max,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  max?: number;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(option => {
        const isSelected = selected.includes(option);
        const isDisabled = !isSelected && max !== undefined && selected.length >= max;
        return (
          <button
            key={option}
            type="button"
            onClick={() => !isDisabled && onToggle(option)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: `1px solid ${isSelected ? 'rgba(139,92,246,0.65)' : 'rgba(255,255,255,0.13)'}`,
              background: isSelected ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
              color: isSelected ? '#ddd6fe' : isDisabled ? 'rgba(240,240,255,0.25)' : 'rgba(240,240,255,0.65)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingClient({ userEmail, initialProfile }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState<FormState>({
    fullName: initialProfile.fullName,
    age: initialProfile.age,
    gender: initialProfile.gender,
    location: initialProfile.location,
    occupation: initialProfile.occupation,
    bio: initialProfile.bio,
    interests: initialProfile.interests,
    relationshipIntent: '',
    communicationStyle: '',
    values: initialProfile.values,
    lifestyle: initialProfile.lifestyle,
    pace: '',
    dealbreakers: [],
    dealbreakerInput: '',
    interestedIn: [],
    minAge: 24,
    maxAge: 38,
    distanceKm: 50,
  });

  const header = useMemo(() => {
    const labels = [
      'Profile Basics',
      'Relationship Intent',
      'Communication Style',
      'Core Values',
      'Lifestyle',
      'Pace & Dealbreakers',
      'Match Preferences',
    ];
    return labels[step - 1] ?? 'Onboarding';
  }, [step]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const toggleArray = (key: 'interests' | 'values' | 'lifestyle' | 'dealbreakers' | 'interestedIn', value: string) => {
    setState(prev => {
      const next = prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value];
      return { ...prev, [key]: next };
    });
    setError('');
  };

  const addDealbreaker = () => {
    const next = state.dealbreakerInput.trim();
    if (!next) return;
    if (state.dealbreakers.includes(next)) {
      setField('dealbreakerInput', '');
      return;
    }
    setState(prev => ({
      ...prev,
      dealbreakers: [...prev.dealbreakers, next],
      dealbreakerInput: '',
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!state.fullName.trim() || !state.age || !state.gender || !state.location.trim()) {
        setError('Please complete name, age, gender, and location.');
        return false;
      }
      return true;
    }
    if (step === 2 && !state.relationshipIntent) {
      setError('Please choose your relationship intent.');
      return false;
    }
    if (step === 3 && !state.communicationStyle) {
      setError('Please choose a communication style.');
      return false;
    }
    if (step === 4 && state.values.length < 3) {
      setError('Please choose at least 3 values.');
      return false;
    }
    if (step === 5 && state.lifestyle.length < 2) {
      setError('Please choose at least 2 lifestyle traits.');
      return false;
    }
    if (step === 6 && !state.pace) {
      setError('Please choose your dating pace.');
      return false;
    }
    if (step === 7 && state.interestedIn.length === 0) {
      setError('Please choose who you are interested in.');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
      setError('');
    }
  };

  const previousStep = () => {
    if (step === 1) {
      router.push('/');
      return;
    }
    setStep(prev => prev - 1);
    setError('');
  };

  const saveOnboarding = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      router.push('/auth/login');
      return;
    }

    const age = Number(state.age);

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? userEmail,
        full_name: state.fullName.trim(),
        age: Number.isNaN(age) ? null : age,
        gender: state.gender,
        location: state.location.trim(),
        occupation: state.occupation.trim() || null,
        bio: state.bio.trim() || null,
        interests: state.interests,
        core_values: state.values,
        lifestyle_tags: state.lifestyle,
        onboarding_complete: true,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      setLoading(false);
      setError(profileError.message);
      return;
    }

    const onboardingRows = [
      { user_id: user.id, category: 'demographics', response: { fullName: state.fullName, age, gender: state.gender, location: state.location, occupation: state.occupation, bio: state.bio, interests: state.interests } },
      { user_id: user.id, category: 'relationship_intent', response: { relationshipIntent: state.relationshipIntent } },
      { user_id: user.id, category: 'communication_style', response: { communicationStyle: state.communicationStyle } },
      { user_id: user.id, category: 'values', response: { values: state.values } },
      { user_id: user.id, category: 'lifestyle', response: { lifestyle: state.lifestyle } },
      { user_id: user.id, category: 'pace', response: { pace: state.pace } },
      { user_id: user.id, category: 'dealbreakers', response: { dealbreakers: state.dealbreakers } },
    ];

    const { error: responsesError } = await supabase
      .from('onboarding_responses')
      .upsert(onboardingRows, { onConflict: 'user_id,category' });

    if (responsesError) {
      setLoading(false);
      setError(responsesError.message);
      return;
    }

    const { error: preferencesError } = await supabase.from('match_preferences').upsert(
      {
        user_id: user.id,
        relationship_intent: state.relationshipIntent,
        communication_style: state.communicationStyle,
        values: state.values,
        lifestyle: state.lifestyle,
        pace: state.pace,
        dealbreakers: state.dealbreakers,
        interested_in: state.interestedIn,
        min_age: state.minAge,
        max_age: state.maxAge,
        distance_km: state.distanceKm,
      },
      { onConflict: 'user_id' }
    );

    setLoading(false);
    if (preferencesError) {
      setError(preferencesError.message);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main style={{ minHeight: '100vh', background: '#07070f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={16} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em' }}>vinculo</span>
        </div>

        <StepIndicator current={step} />

        <div className="glass" style={{ borderRadius: 22, padding: '28px 26px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'rgba(139,92,246,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Step {step} of {TOTAL_STEPS}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{header}</h1>
          </div>

          {error && (
            <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 12, color: '#fda4af', fontSize: 13, padding: '10px 12px', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'grid', gap: 12 }}>
              <input className="input-field" placeholder="Full name" value={state.fullName} onChange={e => setField('fullName', e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input className="input-field" type="number" min={18} max={90} placeholder="Age" value={state.age} onChange={e => setField('age', e.target.value)} />
                <select className="input-field" value={state.gender} onChange={e => setField('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="man">Man</option>
                  <option value="woman">Woman</option>
                  <option value="nonbinary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input className="input-field" placeholder="City, State" value={state.location} onChange={e => setField('location', e.target.value)} />
              <input className="input-field" placeholder="Occupation (optional)" value={state.occupation} onChange={e => setField('occupation', e.target.value)} />
              <textarea className="input-field" rows={3} placeholder="Short bio (optional)" value={state.bio} onChange={e => setField('bio', e.target.value)} style={{ resize: 'vertical' }} />
              <div>
                <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Interests (pick 3+)</div>
                <TogglePills options={INTEREST_OPTIONS} selected={state.interests} onToggle={value => toggleArray('interests', value)} max={8} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {['Long-term relationship', 'Marriage-minded', 'Serious but open', 'Still exploring'].map(option => (
                <button key={option} type="button" className="btn-ghost" style={{ justifyContent: 'flex-start', borderColor: state.relationshipIntent === option ? 'rgba(139,92,246,0.5)' : undefined }} onClick={() => setField('relationshipIntent', option)}>
                  {state.relationshipIntent === option ? <CheckCircle size={15} /> : <span style={{ width: 15 }} />}
                  {option}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {['Direct and clear', 'Warm and expressive', 'Thoughtful and reflective', 'Playful and light'].map(option => (
                <button key={option} type="button" className="btn-ghost" style={{ justifyContent: 'flex-start', borderColor: state.communicationStyle === option ? 'rgba(139,92,246,0.5)' : undefined }} onClick={() => setField('communicationStyle', option)}>
                  {state.communicationStyle === option ? <CheckCircle size={15} /> : <span style={{ width: 15 }} />}
                  {option}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Choose at least 3 values</div>
              <TogglePills options={VALUE_OPTIONS} selected={state.values} onToggle={value => toggleArray('values', value)} max={6} />
            </div>
          )}

          {step === 5 && (
            <div>
              <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Lifestyle markers (pick 2+)</div>
              <TogglePills options={LIFESTYLE_OPTIONS} selected={state.lifestyle} onToggle={value => toggleArray('lifestyle', value)} max={6} />
            </div>
          )}

          {step === 6 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Preferred dating pace</div>
                <select className="input-field" value={state.pace} onChange={e => setField('pace', e.target.value)}>
                  <option value="">Select pace</option>
                  <option value="slow">Slow and intentional</option>
                  <option value="balanced">Balanced weekly momentum</option>
                  <option value="fast">Fast momentum if connection is strong</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Dealbreakers</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input-field" placeholder="Type one and press Add" value={state.dealbreakerInput} onChange={e => setField('dealbreakerInput', e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDealbreaker();
                    }
                  }} />
                  <button type="button" className="btn-ghost" onClick={addDealbreaker}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {state.dealbreakers.map(item => (
                    <button key={item} type="button" onClick={() => toggleArray('dealbreakers', item)} style={{ border: '1px solid rgba(244,63,94,0.35)', color: '#fda4af', background: 'rgba(244,63,94,0.1)', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                      {item} ×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Interested in</div>
                <TogglePills options={['Men', 'Women', 'Everyone']} selected={state.interestedIn} onToggle={value => toggleArray('interestedIn', value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Minimum age</div>
                  <input className="input-field" type="number" min={18} max={80} value={state.minAge} onChange={e => setField('minAge', Number(e.target.value))} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 8 }}>Maximum age</div>
                  <input className="input-field" type="number" min={18} max={80} value={state.maxAge} onChange={e => setField('maxAge', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)' }}>Distance radius</div>
                  <div style={{ fontSize: 13, color: '#c4b5fd' }}>{state.distanceKm} km</div>
                </div>
                <input type="range" min={5} max={250} value={state.distanceKm} onChange={e => setField('distanceKm', Number(e.target.value))} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button type="button" className="btn-ghost" onClick={previousStep}>
              <ArrowLeft size={16} />
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <button type="button" className="btn-primary" onClick={nextStep}>
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={saveOnboarding} disabled={loading}>
                {loading ? 'Saving...' : 'Finish onboarding'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
