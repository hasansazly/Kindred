'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Edit3,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Brain,
  CheckCircle,
  Plus,
  X,
  User,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '../../../../utils/supabase/client';
import { getCompatibilityColor } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

type ProfileMeta = {
  education?: string;
  height?: string;
  drinking?: string;
  smoking?: string;
  kids?: string;
  photos?: string[];
  attachmentStyle?: string;
  loveLanguage?: string;
  personalityTraits?: string[];
};

type ProfileViewUser = {
  userId: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  auraScore: number;
  bio: string;
  photos: string[];
  interests: string[];
  values: string[];
  relationshipGoal: string;
  personalityTraits: string[];
  loveLanguage: string;
  meta: ProfileMeta;
};

type EditFormState = {
  fullName: string;
  bio: string;
  location: string;
  occupation: string;
  education: string;
  height: string;
  drinking: string;
  smoking: string;
  kids: string;
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'aura' | 'stats'>('profile');
  const [user, setUser] = useState<ProfileViewUser | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [bucketPhotoCount, setBucketPhotoCount] = useState(0);
  const [editForm, setEditForm] = useState<EditFormState>({
    fullName: '',
    bio: '',
    location: '',
    occupation: '',
    education: '',
    height: '',
    drinking: '',
    smoking: '',
    kids: '',
  });

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

        const { data: bucketFiles } = await supabase.storage.from('profile-photos').list(authUser.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'desc' },
        });
        setBucketPhotoCount((bucketFiles ?? []).length);

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
        const profileMeta = responsesByCategory.get('profile_meta') ?? {};

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
          '';

        const communicationStyle =
          preferences?.communication_style ||
          (typeof communicationResponse.communicationStyle === 'string' ? communicationResponse.communicationStyle : '') ||
          '';

        const meta: ProfileMeta = {
          education: typeof profileMeta.education === 'string' ? profileMeta.education : '',
          height: typeof profileMeta.height === 'string' ? profileMeta.height : '',
          drinking: typeof profileMeta.drinking === 'string' ? profileMeta.drinking : '',
          smoking: typeof profileMeta.smoking === 'string' ? profileMeta.smoking : '',
          kids: typeof profileMeta.kids === 'string' ? profileMeta.kids : '',
          photos: toStringArray(profileMeta.photos),
          attachmentStyle: typeof profileMeta.attachmentStyle === 'string' ? profileMeta.attachmentStyle : '',
          loveLanguage: typeof profileMeta.loveLanguage === 'string' ? profileMeta.loveLanguage : communicationStyle,
          personalityTraits: toStringArray(profileMeta.personalityTraits),
        };

        const completionSignals = [
          Boolean(profile?.bio || demographics.bio),
          interests.length >= 3,
          values.length >= 3,
          lifestyle.length >= 2,
          Boolean(relationshipGoal),
          Boolean(meta.photos?.length),
        ].filter(Boolean).length;
        const auraScore = Math.min(99, 62 + completionSignals * 6);

        const nextUser: ProfileViewUser = {
          userId: authUser.id,
          name,
          age,
          occupation: profile?.occupation || (typeof demographics.occupation === 'string' ? demographics.occupation : '') || '',
          location: profile?.location || (typeof demographics.location === 'string' ? demographics.location : '') || '',
          auraScore,
          bio: profile?.bio || (typeof demographics.bio === 'string' ? demographics.bio : '') || '',
          photos: meta.photos?.length ? meta.photos : [],
          interests,
          values,
          relationshipGoal,
          personalityTraits: meta.personalityTraits?.length ? meta.personalityTraits : lifestyle,
          loveLanguage: meta.loveLanguage || communicationStyle,
          meta,
        };

        if (active) {
          setUser(nextUser);
          setEditForm({
            fullName: nextUser.name,
            bio: nextUser.bio,
            location: nextUser.location,
            occupation: nextUser.occupation,
            education: nextUser.meta.education ?? '',
            height: nextUser.meta.height ?? '',
            drinking: nextUser.meta.drinking ?? '',
            smoking: nextUser.meta.smoking ?? '',
            kids: nextUser.meta.kids ?? '',
          });
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

  const profileStrengthItems = useMemo(() => {
    if (!user) return [];
    return [
      { label: 'Photo added', done: user.photos.length > 0 },
      { label: 'Bio written', done: user.bio.trim().length >= 40 },
      { label: 'Interests added', done: user.interests.length >= 3 },
      { label: 'Values set', done: user.values.length >= 3 },
      { label: 'Relationship goal set', done: Boolean(user.relationshipGoal) },
      { label: 'Location set', done: Boolean(user.location) },
      { label: 'Occupation set', done: Boolean(user.occupation) },
    ];
  }, [user]);

  const openEditModal = () => {
    if (!user) return;
    setFeedback('');
    setEditForm({
      fullName: user.name,
      bio: user.bio,
      location: user.location,
      occupation: user.occupation,
      education: user.meta.education ?? '',
      height: user.meta.height ?? '',
      drinking: user.meta.drinking ?? '',
      smoking: user.meta.smoking ?? '',
      kids: user.meta.kids ?? '',
    });
    setIsEditOpen(true);
  };

  const setEditField = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setFeedback('');

    try {
      const supabase = getSupabaseBrowserClient();

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.userId,
            full_name: editForm.fullName.trim(),
            bio: editForm.bio.trim(),
            location: editForm.location.trim(),
            occupation: editForm.occupation.trim(),
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        throw new Error(profileError.message);
      }

      const nextMeta: ProfileMeta = {
        ...user.meta,
        education: editForm.education.trim(),
        height: editForm.height.trim(),
        drinking: editForm.drinking.trim(),
        smoking: editForm.smoking.trim(),
        kids: editForm.kids.trim(),
        photos: user.photos,
      };

      const { error: metaError } = await supabase
        .from('onboarding_responses')
        .upsert(
          [{ user_id: user.userId, category: 'profile_meta', response: nextMeta }],
          { onConflict: 'user_id,category' }
        );

      if (metaError) {
        throw new Error(metaError.message);
      }

      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          name: editForm.fullName.trim() || prev.name,
          bio: editForm.bio.trim(),
          location: editForm.location.trim(),
          occupation: editForm.occupation.trim(),
          meta: nextMeta,
        };
      });

      setIsEditOpen(false);
      setFeedback('Profile updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save profile.';
      setFeedback(message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveMetaOnly = async (nextMeta: ProfileMeta, nextPhotos: string[]) => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    const { error: metaError } = await supabase
      .from('onboarding_responses')
      .upsert(
        [{ user_id: user.userId, category: 'profile_meta', response: nextMeta }],
        { onConflict: 'user_id,category' }
      );

    if (metaError) {
      throw new Error(metaError.message);
    }

    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        photos: nextPhotos,
        meta: nextMeta,
      };
    });
  };

  const getStoragePathFromPublicUrl = (publicUrl: string) => {
    const marker = '/profile-photos/';
    const idx = publicUrl.indexOf(marker);
    if (idx < 0) return null;
    return decodeURIComponent(publicUrl.slice(idx + marker.length));
  };

  const deletePhoto = async (photoUrl: string) => {
    if (!user) return;
    setFeedback('');
    setDeletingPhotoUrl(photoUrl);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser) {
        throw new Error('Please sign in again before deleting a photo.');
      }

      const filePath = getStoragePathFromPublicUrl(photoUrl);
      if (!filePath || !filePath.startsWith(`${authUser.id}/`)) {
        throw new Error('Could not identify this photo path.');
      }

      const { error: deleteError } = await supabase.storage.from('profile-photos').remove([filePath]);
      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const remainingPhotos = user.photos.filter(photo => photo !== photoUrl);
      const nextMeta: ProfileMeta = {
        ...user.meta,
        photos: remainingPhotos,
      };

      await saveMetaOnly(nextMeta, remainingPhotos);
      setBucketPhotoCount(prev => Math.max(0, prev - 1));
      setFeedback('Photo deleted.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Photo deletion failed.';
      setFeedback(message);
    } finally {
      setDeletingPhotoUrl('');
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setIsUploadingPhoto(true);
    setFeedback('');

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser) {
        throw new Error('Please sign in again before uploading a photo.');
      }

      const { data: existingFiles, error: listError } = await supabase.storage.from('profile-photos').list(authUser.id, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'desc' },
      });

      if (listError) {
        throw new Error(listError.message);
      }

      const photoCount = (existingFiles ?? []).length;
      setBucketPhotoCount(photoCount);
      if (photoCount >= 10) {
        setFeedback('You can upload up to 10 photos.');
        return;
      }

      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type || file.type });
      const filePath = `${authUser.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes('bucket')) {
          throw new Error('Photo upload is not ready yet. Create a Supabase Storage bucket named "profile-photos" first.');
        }
        throw new Error(uploadError.message);
      }

      const { data: publicData } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;
      const nextPhotos = [publicUrl, ...user.photos].slice(0, 6);
      const nextMeta: ProfileMeta = {
        ...user.meta,
        photos: nextPhotos,
      };

      await saveMetaOnly(nextMeta, nextPhotos);
      setBucketPhotoCount(photoCount + 1);
      setFeedback('Photo uploaded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Photo upload failed.';
      setFeedback(message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const onPhotoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Please upload an image file. Video uploads are not supported.');
      return;
    }
    await uploadPhoto(file);
  };

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
    { label: 'Emotional Intelligence', score: Math.min(98, user.auraScore + 1), desc: 'Shows empathy and thoughtful responses' },
    { label: 'Communication Style', score: Math.min(97, user.auraScore - 2), desc: 'Clear intent and message consistency' },
    { label: 'Lifestyle Fit', score: Math.min(95, user.auraScore - 4), desc: 'Aligned pace and routine preferences' },
    { label: 'Values Alignment', score: Math.min(98, user.auraScore + 2), desc: 'Strong overlap in priorities and values' },
    { label: 'Depth', score: Math.min(96, user.auraScore), desc: 'Signals meaningful connection potential' },
  ];

  const detailItems = [
    { label: 'Height', value: user.meta.height ?? '' },
    { label: 'Relationship Goal', value: user.relationshipGoal },
    { label: 'Attachment Style', value: user.meta.attachmentStyle ?? '' },
    { label: 'Love Language', value: user.loveLanguage },
    { label: 'Drinks', value: user.meta.drinking ?? '' },
    { label: 'Smokes', value: user.meta.smoking ?? '' },
    { label: 'Kids', value: user.meta.kids ?? '' },
  ].filter(item => item.value.trim().length > 0);
  const galleryPhotos = user.photos;

  return (
    <div className="app-interior-page profile-page" style={{ padding: '32px', maxWidth: 800, width: '100%', margin: '0 auto' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={onPhotoFileChange}
      />

      <div className="profile-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Your Profile</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => router.push('/app/profile/edit')}
            className="btn-primary profile-edit-btn"
            style={{ padding: '9px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Edit3 size={14} />
            Edit 7-step profile
          </button>
          <button
            onClick={openEditModal}
            className="btn-ghost profile-edit-btn"
            style={{ padding: '9px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Quick edit
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ marginBottom: 16, borderRadius: 12, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.12)', color: '#ddd6fe', padding: '10px 12px', fontSize: 13 }}>
          {feedback}
        </div>
      )}

      <div className="glass" style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 140, background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(219,39,119,0.3) 50%, rgba(251,191,36,0.2) 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.6) 0%, transparent 40%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 40%)' }} />
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginTop: -48 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '4px solid #0f0f1a', boxShadow: '0 0 0 2px rgba(139,92,246,0.3)' }}>
              {user.photos[0] ? (
                <img src={user.photos[0]} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(31,41,55,0.95), rgba(17,24,39,0.9))' }}>
                  <User size={30} color="rgba(226,232,240,0.65)" />
                </div>
              )}
            </div>
              <button
                type="button"
                onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                disabled={isUploadingPhoto || bucketPhotoCount >= 10}
                style={{ position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', cursor: isUploadingPhoto ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Camera size={12} color="white" />
              </button>
          </div>

          <div className="profile-hero-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {user.name}{user.age > 0 ? `, ${user.age}` : ''}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 999, padding: '2px 8px' }}>
                  <CheckCircle size={11} color="#34d399" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Verified</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {user.occupation && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(240,240,255,0.6)' }}>
                    <Briefcase size={13} /> {user.occupation}
                  </span>
                )}
                {user.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(240,240,255,0.6)' }}>
                    <MapPin size={13} /> {user.location}
                  </span>
                )}
                {user.meta.education && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(240,240,255,0.6)' }}>
                    <GraduationCap size={13} /> {user.meta.education}
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 68, height: 68 }}>
                <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle
                    cx="34"
                    cy="34"
                    r="28"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="6"
                    strokeDasharray={`${(2 * Math.PI * 28 * user.auraScore) / 100} ${2 * Math.PI * 28}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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

      <div className="profile-tabs" style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {([
          ['profile', 'Profile'],
          ['aura', '✨ Aura Analysis'],
          ['stats', '📊 Stats'],
        ] as [string, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: activeTab === tab ? 'rgba(139,92,246,0.15)' : 'transparent', color: activeTab === tab ? '#c4b5fd' : 'rgba(240,240,255,0.45)', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', borderStyle: 'solid', borderWidth: 1, borderColor: activeTab === tab ? 'rgba(139,92,246,0.25)' : 'transparent' }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="profile-section glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div className="section-label" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>About</div>
            {user.bio ? (
              <p className="about-text" style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.75 }}>{user.bio}</p>
            ) : (
              <p className="placeholder" style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)', lineHeight: 1.75 }}>Add a short bio so your matches understand your vibe quickly.</p>
            )}
          </div>

          <div className="profile-section glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div className="section-label" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photos</div>
            <div className="profile-photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {galleryPhotos.map((src, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => deletingPhotoUrl !== src && void deletePhoto(src)}
                    disabled={deletingPhotoUrl === src}
                    title="Delete photo"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      border: '1px solid rgba(244,63,94,0.45)',
                      background: 'rgba(7,7,15,0.72)',
                      color: '#fda4af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: deletingPhotoUrl === src ? 'wait' : 'pointer',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                disabled={isUploadingPhoto || bucketPhotoCount >= 10}
                style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed rgba(91,79,207,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploadingPhoto ? 'wait' : bucketPhotoCount >= 10 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', background: 'rgba(127,119,221,0.08)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Plus size={20} color="#5B4FCF" />
                  <span style={{ fontSize: 11, color: '#5B4FCF' }}>
                    {isUploadingPhoto ? 'Uploading...' : bucketPhotoCount >= 10 ? 'Limit reached' : 'Add'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="profile-section glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div className="section-label" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Interests</div>
            {user.interests.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {user.interests.map(interest => (
                  <span key={interest} className="interest-tag tag tag-violet" style={{ fontSize: 13 }}>{interest}</span>
                ))}
              </div>
            ) : (
              <p className="empty" style={{ fontSize: 13, color: 'rgba(240,240,255,0.45)' }}>No interests saved yet.</p>
            )}
          </div>

          <div className="profile-section glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div className="section-label" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core values</div>
            {user.values.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {user.values.map(value => (
                  <span key={value} className="value-tag tag tag-rose" style={{ fontSize: 13 }}>{value}</span>
                ))}
              </div>
            ) : (
              <p className="empty" style={{ fontSize: 13, color: 'rgba(240,240,255,0.45)' }}>No values saved yet.</p>
            )}
          </div>

          {detailItems.length > 0 && (
            <div className="profile-section glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
              <div className="section-label" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Life details</div>
              <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {detailItems.map(item => (
                  <div key={item.label}>
                    <div className="detail-label" style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                    <div className="detail-value" style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize', color: 'rgba(240,240,255,0.75)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              Aura reflects how complete and aligned your profile is across intent, values, and communication preferences.
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

          {user.personalityTraits.length > 0 && (
            <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 12 }}>Personality snapshot</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {user.personalityTraits.map(trait => (
                  <span key={trait} className="tag" style={{ fontSize: 13, background: 'rgba(255,255,255,0.06)' }}>{trait}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 14 }}>Profile strength</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profileStrengthItems.map(item => (
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

      {isEditOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <button
            type="button"
            onClick={() => setIsEditOpen(false)}
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(7,7,15,0.82)' }}
            aria-label="Close"
          />
          <div className="glass" style={{ position: 'relative', width: '100%', maxWidth: 620, borderRadius: 18, padding: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Edit Profile</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <input className="input-field" placeholder="Full name" value={editForm.fullName} onChange={e => setEditField('fullName', e.target.value)} />
              <textarea className="input-field" rows={3} placeholder="Bio" value={editForm.bio} onChange={e => setEditField('bio', e.target.value)} style={{ resize: 'vertical' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="input-field" placeholder="Location" value={editForm.location} onChange={e => setEditField('location', e.target.value)} />
                <input className="input-field" placeholder="Occupation" value={editForm.occupation} onChange={e => setEditField('occupation', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="input-field" placeholder="Education" value={editForm.education} onChange={e => setEditField('education', e.target.value)} />
                <input className="input-field" placeholder="Height" value={editForm.height} onChange={e => setEditField('height', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <input className="input-field" placeholder="Drinking" value={editForm.drinking} onChange={e => setEditField('drinking', e.target.value)} />
                <input className="input-field" placeholder="Smoking" value={editForm.smoking} onChange={e => setEditField('smoking', e.target.value)} />
                <input className="input-field" placeholder="Kids" value={editForm.kids} onChange={e => setEditField('kids', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn-ghost" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-page .glass {
          background: #F4F1FF !important;
          border: 1px solid #DCD5FF !important;
        }
        .profile-page .glass p,
        .profile-page .glass h2,
        .profile-page .glass h3,
        .profile-page .glass span,
        .profile-page .glass div {
          color: #1A1A2E;
        }
        .profile-page .profile-hero-meta h2 {
          color: #1A1A2E !important;
        }
        .profile-page .profile-hero-meta span {
          color: #4A4761 !important;
        }
        .profile-page .glass [style*="text-transform: uppercase"] {
          color: #6B5EA8 !important;
        }
        .profile-page .glass .tag {
          color: #4B3FA0 !important;
        }
        .profile-page .about-text {
          color: #2D2848 !important;
        }
        .profile-page .empty,
        .profile-page .placeholder {
          color: #7E779E !important;
        }
        .profile-page .glass button,
        .profile-page .glass button * {
          color: inherit;
        }
        @media (max-width: 767px) {
          .profile-page { padding: 24px 16px 32px !important; }
          .profile-header-row { flex-wrap: wrap; gap: 12px; }
          .profile-edit-btn { width: 100%; justify-content: center; }
          .profile-photos-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .profile-details-grid { grid-template-columns: 1fr !important; }
          .aura-desc { display: block !important; margin-left: 0 !important; margin-top: 2px; }
        }
      `}</style>
    </div>
  );
}
