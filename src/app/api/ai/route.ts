import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, context } = body;

    // Dynamic import to avoid build issues if key is not set
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock responses in dev without API key
      return NextResponse.json({ result: getMockResponse(type, context) });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    let prompt = '';

    if (type === 'conversation_coach') {
      prompt = `You are an empathetic dating conversation coach. Given this context: "${context.lastMessage}" from ${context.name}, suggest ONE thoughtful, genuine conversation response for the user. Keep it natural, warm, and under 100 words. Return only the suggested response text.`;
    } else if (type === 'compatibility_reason') {
      prompt = `Explain in 2-3 warm, specific sentences why these two people are compatible. User: ${JSON.stringify(context.user)}. Match: ${JSON.stringify(context.match)}. Focus on their shared values and complementary traits. Be insightful and specific, not generic.`;
    } else if (type === 'date_idea') {
      prompt = `Suggest ONE perfect first date idea for two people who share these interests: ${context.interests.join(', ')} in ${context.city}. Give a title, 1-sentence description, estimated time, and cost (free/$/$$/$$$ ). Return as JSON: { title, description, time, cost }`;
    } else if (type === 'safety_analysis') {
      prompt = `Analyze this dating app conversation for safety concerns. Look for red flags like love bombing, pressure tactics, requests for money/personal info. Conversation: "${context.messages}". Return JSON: { safetyLevel: "safe"|"caution"|"warning", flags: string[], summary: string }`;
    } else if (type === 'assistant_shell') {
      prompt = `You are Kindred Assistant, a concise and friendly AI layer for a dating app.
User command: "${context.command}"
Current route: "${context.route}"
Phase: "${context.phase}"
Memory: ${JSON.stringify(context.memory ?? [])}
Release track: "${context.releaseTrack}"

Return strict JSON with this shape:
{
  "title": "short title",
  "summary": "1-2 sentence direct response",
  "suggestions": ["3 concise next actions max"],
  "why": ["3 source-signal reasons max"],
  "confidence": "low|medium|high",
  "requiresApproval": true
}

Requirements:
- Keep suggestions to advisory text only.
- Never imply any message was sent.
- Always include why signals.
- Keep tone warm, practical, and short.`;
    } else if (type === 'conversation_summary') {
      prompt = `Summarize this dating conversation and give coaching guidance.
Conversation: "${context.messages}"
Return strict JSON:
{
  "summary": "short recap",
  "tone": "one-line tone read",
  "replyCoach": "one suggested reply under 35 words",
  "why": ["up to 3 evidence points from conversation"]
}`;
    } else if (type === 'spark_followup') {
      prompt = `Create one natural follow-up message after a Daily Spark exchange.
Question: "${context.question}"
My answer: "${context.myAnswer}"
Their answer: "${context.theirAnswer}"
Return strict JSON:
{
  "followUp": "one message under 30 words",
  "why": ["up to 3 signal-based reasons"]
}`;
    } else {
      return NextResponse.json({ error: 'Unknown AI task type' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = parseJsonIfPossible(text);
    return NextResponse.json({ result });

  } catch (err: unknown) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}

function parseJsonIfPossible(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getMockResponse(type: string, context: Record<string, unknown>): unknown {
  if (type === 'conversation_coach') {
    return `That's such a great perspective! I'd love to hear more about what drew you to that — it sounds like something you're genuinely passionate about.`;
  }
  if (type === 'compatibility_reason') {
    return `You both share a rare combination of intellectual curiosity and emotional warmth. Your complementary communication styles — one more analytical, the other more expressive — create a natural balance that deepens over time. Shared values around growth and honesty lay a strong foundation.`;
  }
  if (type === 'date_idea') {
    return JSON.stringify({ title: 'Sunrise Farmers Market', description: 'Explore the local market together, pick ingredients, and cook brunch at home.', time: '3-4 hours', cost: '$' });
  }
  if (type === 'assistant_shell') {
    return {
      title: 'Smart next step',
      summary: `I looked at your current context and command: "${String(context.command ?? '')}".`,
      suggestions: [
        'Send one specific, low-pressure follow-up.',
        'Use one question tied to their last message.',
        'Set a clear intent for your next interaction.',
      ],
      why: [
        'Recent conversation momentum is strongest with specific prompts.',
        'Short concrete asks reduce drop-off.',
        'Confidence rises when follow-ups reference shared context.',
      ],
      confidence: 'medium',
      requiresApproval: true,
    };
  }
  if (type === 'conversation_summary') {
    return {
      summary: 'The thread is warm and playful, with clear mutual curiosity.',
      tone: 'Positive momentum with room for a concrete plan.',
      replyCoach: 'Love this energy. Want to pick one spot and lock in Friday evening?',
      why: [
        'Both sides ask follow-up questions.',
        'Humor and curiosity appear in multiple turns.',
        'There is a soft date cue but no concrete plan yet.',
      ],
    };
  }
  if (type === 'spark_followup') {
    return {
      followUp: 'I love your answer. Want to turn that into a real plan this Friday?',
      why: [
        'Builds directly on shared Spark responses.',
        'Moves from abstract compatibility to a concrete next step.',
        'Keeps tone warm and low-pressure.',
      ],
    };
  }
  return 'Mock response';
}
