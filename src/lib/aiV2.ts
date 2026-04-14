export type AiV2Phase = 1 | 2 | 3;

export const AI_V2_STORAGE = {
  override: 'kindred_ai_v2_override',
  cohort: 'kindred_ai_v2_cohort',
  memory: 'kindred_ai_v2_memory',
} as const;

export function stableHashToUnit(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return Math.abs(hash >>> 0) / 4294967295;
}

export function getAiV2Phase(): AiV2Phase {
  const raw = Number(process.env.NEXT_PUBLIC_AI_V2_PHASE ?? '1');
  if (raw >= 3) return 3;
  if (raw === 2) return 2;
  return 1;
}

export function getAiV2Rollout(): number {
  const raw = Number(process.env.NEXT_PUBLIC_AI_V2_ROLLOUT ?? '0.12');
  if (!Number.isFinite(raw)) return 0.12;
  return Math.min(1, Math.max(0, raw));
}

export function isAiV2EnvEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_V2_ENABLED !== 'false';
}

