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
    } else {
      return NextResponse.json({ error: 'Unknown AI task type' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ result });

  } catch (err: unknown) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}

function getMockResponse(type: string, context: Record<string, unknown>): string {
  if (type === 'conversation_coach') {
    return `That's such a great perspective! I'd love to hear more about what drew you to that — it sounds like something you're genuinely passionate about.`;
  }
  if (type === 'compatibility_reason') {
    return `You both share a rare combination of intellectual curiosity and emotional warmth. Your complementary communication styles — one more analytical, the other more expressive — create a natural balance that deepens over time. Shared values around growth and honesty lay a strong foundation.`;
  }
  if (type === 'date_idea') {
    return JSON.stringify({ title: 'Sunrise Farmers Market', description: 'Explore the local market together, pick ingredients, and cook brunch at home.', time: '3-4 hours', cost: '$' });
  }
  return 'Mock response';
}
