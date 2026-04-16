import { NextRequest, NextResponse } from 'next/server';
import { getMatchmakingRecommendations, runMatchmaking } from '@/server/matchmaking/service';

const DEFAULT_LIMIT = 10;

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') ?? 'user-1';
    const tier = req.nextUrl.searchParams.get('tier') === 'paid' ? 'paid' : 'free';
    const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : DEFAULT_LIMIT;
    const response = await getMatchmakingRecommendations(userId, limit, tier);
    return NextResponse.json(response);
  } catch (err) {
    console.error('GET matchmaking recommendations error:', err);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId ?? 'user-1');
    const tier = body.tier === 'paid' ? 'paid' : 'free';
    const limitRaw = Number(body.limit ?? DEFAULT_LIMIT);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : DEFAULT_LIMIT;
    const response = await runMatchmaking(userId, limit, tier);
    return NextResponse.json(response);
  } catch (err) {
    console.error('POST matchmaking run error:', err);
    const message = err instanceof Error ? err.message : 'Failed to run matchmaking';
    const status = message === 'User not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
