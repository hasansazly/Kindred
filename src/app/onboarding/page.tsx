import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'full_name, age, gender, location, occupation, bio, interests, core_values, lifestyle_tags, onboarding_complete'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.onboarding_complete) {
    redirect('/dashboard');
  }

  return (
    <OnboardingClient
      userEmail={user.email ?? ''}
      initialProfile={{
        fullName: profile?.full_name ?? '',
        age: profile?.age ? String(profile.age) : '',
        gender: profile?.gender ?? '',
        location: profile?.location ?? '',
        occupation: profile?.occupation ?? '',
        bio: profile?.bio ?? '',
        interests: Array.isArray(profile?.interests) ? profile.interests : [],
        values: Array.isArray(profile?.core_values) ? profile.core_values : [],
        lifestyle: Array.isArray(profile?.lifestyle_tags) ? profile.lifestyle_tags : [],
      }}
    />
  );
}
