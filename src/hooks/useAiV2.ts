'use client';

import { useMemo, useState } from 'react';
import {
  AI_V2_STORAGE,
  getAiV2Phase,
  getAiV2Rollout,
  isAiV2EnvEnabled,
  stableHashToUnit,
  type AiV2Phase,
} from '@/lib/aiV2';

type OverrideMode = 'on' | 'off' | 'auto';

export function useAiV2(userId = 'user-1') {
  const [override, setOverrideState] = useState<OverrideMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    return (localStorage.getItem(AI_V2_STORAGE.override) ?? 'auto') as OverrideMode;
  });

  const [cohortBucket] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const saved = localStorage.getItem(AI_V2_STORAGE.cohort);
    if (saved) return Number(saved);
    const bucket = stableHashToUnit(userId);
    localStorage.setItem(AI_V2_STORAGE.cohort, String(bucket));
    return bucket;
  });

  const phase: AiV2Phase = getAiV2Phase();
  const enabledByRollout = cohortBucket <= getAiV2Rollout();
  const enabled = isAiV2EnvEnabled() && (override === 'on' || (override === 'auto' && enabledByRollout));

  const setOverride = (next: OverrideMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_V2_STORAGE.override, next);
    }
    setOverrideState(next);
  };

  const releaseTrack = useMemo(() => {
    if (override === 'on') return 'manual-on';
    if (override === 'off') return 'manual-off';
    return enabled ? 'cohort-enabled' : 'cohort-control';
  }, [enabled, override]);

  return {
    enabled,
    phase,
    cohortBucket,
    override,
    releaseTrack,
    setOverride,
  };
}
