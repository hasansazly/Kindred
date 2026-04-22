import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { getCoupleModeState } from '@/server/couples/mode';
import { generateDatePlanWithAI } from '@/server/couples/planner';

type PlannerPayload = {
  vibe?: string;
  budget?: string;
  duration?: string;
  locationHint?: string;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mode = await getCoupleModeState(supabase, user.id);
    if (!mode.featureEnabled || !mode.hasCouple || !mode.coupleId) {
      return NextResponse.json({ error: 'Couple context is required.' }, { status: 403 });
    }
    if (mode.pairUnavailable) {
      return NextResponse.json({ error: 'This pair is unavailable due to a safety state.' }, { status: 403 });
    }
    if (!mode.selfEnabled) {
      return NextResponse.json({ error: 'Turn Couple Mode ON to generate date plans.' }, { status: 403 });
    }

    const payload = (await req.json().catch(() => ({}))) as PlannerPayload;
    const vibe = typeof payload.vibe === 'string' && payload.vibe.trim() ? payload.vibe.trim() : 'cozy';
    const budget = typeof payload.budget === 'string' && payload.budget.trim() ? payload.budget.trim() : '$$';
    const duration = typeof payload.duration === 'string' && payload.duration.trim() ? payload.duration.trim() : '2-3h';
    const locationHint = typeof payload.locationHint === 'string' ? payload.locationHint.trim() : '';

    const { plan, source } = await generateDatePlanWithAI({
      vibe,
      budget,
      duration,
      locationHint,
    });

    const { data: inserted, error: insertError } = await supabase
      .from('couple_date_plans')
      .insert({
        couple_id: mode.coupleId,
        created_by_user_id: user.id,
        vibe,
        budget,
        duration,
        location_hint: locationHint,
        title: plan.title,
        summary: plan.summary,
        plan_steps: plan.steps,
      })
      .select('id,title,summary,plan_steps,created_at')
      .single();

    if (insertError) {
      if (looksLikeMissingTable(insertError, 'couple_date_plans')) {
        return NextResponse.json({ error: 'Date planner tables are not initialized yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      source,
      plan: {
        id: inserted.id,
        title: inserted.title,
        summary: inserted.summary,
        steps: Array.isArray(inserted.plan_steps) ? inserted.plan_steps : [],
        createdAt: inserted.created_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mode = await getCoupleModeState(supabase, user.id);
    if (!mode.featureEnabled || !mode.hasCouple || !mode.coupleId) {
      return NextResponse.json({ error: 'Couple context is required.' }, { status: 403 });
    }

    const planId = req.nextUrl.searchParams.get('planId')?.trim() ?? '';
    if (!planId) {
      return NextResponse.json({ error: 'planId is required.' }, { status: 400 });
    }

    const { data: deleted, error: deleteError } = await supabase
      .from('couple_date_plans')
      .delete()
      .eq('id', planId)
      .eq('couple_id', mode.coupleId)
      .eq('created_by_user_id', user.id)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (deleteError) {
      if (looksLikeMissingTable(deleteError, 'couple_date_plans')) {
        return NextResponse.json({ error: 'Date planner tables are not initialized yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Date plan not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: deleted.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
