import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

export default async function OnboardingPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    const { data: preferenceRow } = await supabase
      .from('match_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (preferenceRow) {
      redirect('/dashboard');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return (
      <OnboardingClient
        userEmail={user.email ?? ''}
        initialProfile={{
          fullName: profile?.first_name ?? profile?.full_name ?? '',
          age: profile?.age ? String(profile.age) : '',
          gender: profile?.gender ?? '',
          location: profile?.location ?? '',
          occupation: profile?.occupation ?? '',
          bio: profile?.bio ?? '',
          interests: Array.isArray((profile as { interests?: unknown } | null)?.interests)
            ? ((profile as { interests?: string[] }).interests ?? [])
            : [],
          values: [],
          lifestyle: [],
        }}
      />
    );
  } catch (error) {
    console.error('onboarding page failed:', error);
    redirect('/auth/login');
  }
}
