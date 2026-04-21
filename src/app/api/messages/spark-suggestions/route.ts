import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

type Kind = 'startEasy' | 'goDeeper' | 'suggestPlan';

type PromptContext = {
  reason: string;
  intent: string;
};

type MessageRow = {
  sender_user_id: string;
  body: string | null;
  created_at: string;
};

async function callAnthropic(apiKey: string, prompt: string) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 420,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0]?.type === 'text' ? message.content[0].text : '';
}

async function callOpenAI(apiKey: string, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'spark_suggestions',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              startEasy: {
                type: 'array',
                minItems: 3,
                items: { type: 'string' },
              },
              goDeeper: {
                type: 'array',
                minItems: 3,
                items: { type: 'string' },
              },
              suggestPlan: {
                type: 'array',
                minItems: 3,
                items: { type: 'string' },
              },
            },
            required: ['startEasy', 'goDeeper', 'suggestPlan'],
          },
          strict: true,
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You generate concise dating conversation suggestions. Respond with strict JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? '';
}

function cleanSuggestionArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function parseJsonLoose(text: string): unknown | null {
  const direct = text.trim();
  try {
    return JSON.parse(direct);
  } catch {
    // keep trying fallbacks
  }

  const fenceMatch = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  const start = direct.indexOf('{');
  const end = direct.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = direct.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  return null;
}

function parseSuggestions(text: string): Record<Kind, string[]> | null {
  const jsonRaw = parseJsonLoose(text);
  if (!jsonRaw || typeof jsonRaw !== 'object' || jsonRaw === null) {
    return null;
  }

  const json = jsonRaw as Record<string, unknown>;
  const startEasy = cleanSuggestionArray(json.startEasy ?? json.start_easy ?? json['start easy']);
  const goDeeper = cleanSuggestionArray(json.goDeeper ?? json.go_deeper ?? json['go deeper']);
  const suggestPlan = cleanSuggestionArray(json.suggestPlan ?? json.suggest_plan ?? json['suggest a plan']);

  if (!startEasy.length || !goDeeper.length || !suggestPlan.length) {
    return null;
  }

  return { startEasy, goDeeper, suggestPlan };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      conversationId?: string;
      compatibilityReasons?: string[];
      relationshipIntent?: string;
    };

    const conversationId = body.conversationId?.trim();
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: participants, error: participantError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (participantError) {
      return NextResponse.json({ error: participantError.message }, { status: 400 });
    }

    const participantIds = (participants ?? []).map((row: { user_id: string }) => row.user_id);
    if (!participantIds.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const otherUserId = participantIds.find(id => id !== user.id) ?? null;

    const { data: messagesRaw } = await supabase
      .from('messages')
      .select('sender_user_id,body,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);

    const messages = ((messagesRaw ?? []) as MessageRow[]).filter(message => typeof message.body === 'string');
    const recentOther = messages.filter(message => message.sender_user_id !== user.id).slice(0, 5);
    const recentMine = messages.filter(message => message.sender_user_id === user.id).slice(0, 5);

    const { data: otherProfile } =
      otherUserId
        ? await supabase.from('profiles').select('first_name,email').eq('id', otherUserId).maybeSingle()
        : { data: null };

    const otherName =
      otherProfile?.first_name?.trim() ||
      (typeof otherProfile?.email === 'string' ? otherProfile.email.split('@')[0] : '') ||
      'your match';

    const reason = (Array.isArray(body.compatibilityReasons) && body.compatibilityReasons[0]) || 'shared priorities';
    const intent = body.relationshipIntent?.trim() ?? '';
    const context: PromptContext = { reason, intent };

    const openAIKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!openAIKey && !anthropicKey) {
      return NextResponse.json(
        { error: 'AI suggestions are unavailable. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    const prompt = `Generate 3 suggestions each for Start Easy, Go Deeper, and Suggest a Plan.

Context:
- Match name: ${otherName}
- Compatibility reason: ${reason}
- Relationship intent: ${intent || 'not shared'}
- Recent messages from match: ${JSON.stringify(recentOther.map(message => message.body))}
- Recent messages from me: ${JSON.stringify(recentMine.map(message => message.body))}

Rules:
- Suggestions must be natural, concise (under 22 words each), and respectful.
- Reflect the latest replies when possible.
- No pressure, no manipulation, no explicit content.
- Start Easy = light openers.
- Go Deeper = values/intent/communication clarity.
- Suggest a Plan = low-pressure next-step suggestions.
- Return strict JSON with keys: startEasy, goDeeper, suggestPlan (arrays of exactly 3 strings each).`;

    let text = '';
    try {
      if (openAIKey) {
        text = await callOpenAI(openAIKey, prompt);
      } else if (anthropicKey) {
        text = await callAnthropic(anthropicKey, prompt);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI request failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const parsed = parseSuggestions(text);
    if (!parsed) {
      return NextResponse.json({ error: 'AI returned invalid suggestion format.' }, { status: 502 });
    }

    return NextResponse.json({ source: 'ai', suggestions: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not generate suggestions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
