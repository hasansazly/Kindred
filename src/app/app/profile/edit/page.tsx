import { redirect } from 'next/navigation';
import OnboardingClient from '../../../onboarding/OnboardingClient';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

export default async function ProfileFullEditPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    const [{ data: profile }, { data: onboardingRows }, { data: preferences }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('onboarding_responses').select('category,response').eq('user_id', user.id),
      supabase.from('match_preferences').select('*').eq('user_id', user.id).maybeSingle(),
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
    const relationshipIntentResponse = responsesByCategory.get('relationship_intent') ?? {};
    const communicationStyleResponse = responsesByCategory.get('communication_style') ?? {};
    const paceResponse = responsesByCategory.get('pace') ?? {};
    const dealbreakersResponse = responsesByCategory.get('dealbreakers') ?? {};

    return (
      <OnboardingClient
        userEmail={user.email ?? ''}
        initialProfile={{
          fullName:
            profile?.first_name ??
            profile?.full_name ??
            (typeof demographics.fullName === 'string' ? demographics.fullName : '') ??
            '',
          age: profile?.age ? String(profile.age) : typeof demographics.age === 'number' ? String(demographics.age) : '',
          gender: profile?.gender ?? (typeof demographics.gender === 'string' ? demographics.gender : '') ?? '',
          location: profile?.location ?? (typeof demographics.location === 'string' ? demographics.location : '') ?? '',
          occupation: profile?.occupation ?? (typeof demographics.occupation === 'string' ? demographics.occupation : '') ?? '',
          bio: profile?.bio ?? (typeof demographics.bio === 'string' ? demographics.bio : '') ?? '',
          interests: Array.isArray((profile as { interests?: unknown } | null)?.interests)
            ? ((profile as { interests?: string[] }).interests ?? [])
            : toStringArray(demographics.interests),
          values: toStringArray(valuesResponse.values).length
            ? toStringArray(valuesResponse.values)
            : toStringArray((preferences as { values?: unknown } | null)?.values),
          lifestyle: toStringArray(lifestyleResponse.lifestyle).length
            ? toStringArray(lifestyleResponse.lifestyle)
            : toStringArray((preferences as { lifestyle?: unknown } | null)?.lifestyle),
        }}
        initialAnswers={{
          relationshipIntent:
            (preferences as { relationship_intent?: string } | null)?.relationship_intent ??
            (typeof relationshipIntentResponse.relationshipIntent === 'string'
              ? relationshipIntentResponse.relationshipIntent
              : ''),
          communicationStyle:
            (preferences as { communication_style?: string } | null)?.communication_style ??
            (typeof communicationStyleResponse.communicationStyle === 'string'
              ? communicationStyleResponse.communicationStyle
              : ''),
          pace:
            (preferences as { pace?: string } | null)?.pace ??
            (typeof paceResponse.pace === 'string' ? paceResponse.pace : ''),
          dealbreakers: toStringArray(dealbreakersResponse.dealbreakers).length
            ? toStringArray(dealbreakersResponse.dealbreakers)
            : toStringArray((preferences as { dealbreakers?: unknown } | null)?.dealbreakers),
          interestedIn: toStringArray((preferences as { interested_in?: unknown } | null)?.interested_in),
          minAge: (preferences as { min_age?: number } | null)?.min_age,
          maxAge: (preferences as { max_age?: number } | null)?.max_age,
          distanceKm: (preferences as { distance_km?: number } | null)?.distance_km,
        }}
        mode="edit"
        onBackPath="/app/profile"
        onFinishPath="/app/profile"
      />
    );
  } catch (error) {
    console.error('profile full edit page failed:', error);
    redirect('/app/profile');
  }
}
