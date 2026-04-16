import type { Match, UserProfile } from '@/lib/types';

export type MatchmakingSignalType =
  | 'profile_view'
  | 'like'
  | 'pass'
  | 'message_sent'
  | 'message_received'
  | 'spark_answered'
  | 'date_planned'
  | 'report';

export interface MatchmakingSignal {
  id: string;
  idempotencyKey: string;
  actorUserId: string;
  targetUserId: string;
  type: MatchmakingSignalType;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MatchmakingBreakdown {
  values: number;
  communication: number;
  datingPace: number;
  lifestyle: number;
  interests: number;
  goals: number;
  emotional: number;
}

export interface MatchmakingExplanation {
  summary: string;
  reasons: string[];
  worthKnowing?: string;
}

export interface MatchmakingCandidateScore {
  userId: string;
  compatibilityScore: number;
  rankingScore: number;
  breakdown: MatchmakingBreakdown;
  reasons: string[]; // kept for backwards compatibility with existing UI clients
  explanation: MatchmakingExplanation;
  whySignals: string[];
  confidence: 'low' | 'medium' | 'high';
  tierLabel: 'core' | 'exploratory';
  generatedAt: string;
}

export interface MatchmakingConstraints {
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  intents: string[];
  genderPreferences: string[];
}

export interface MatchShownHistory {
  userId: string;
  candidateId: string;
  shownAt: string;
}

export interface UserReport {
  reporterUserId: string;
  targetUserId: string;
  createdAt: string;
}

export type MatchmakingTier = 'free' | 'paid';

export interface MatchmakingRun {
  id: string;
  userId: string;
  candidateCount: number;
  createdAt: string;
  durationMs: number;
  version: string;
}

export interface MatchmakingStore {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  listCandidateProfiles(userId: string): Promise<UserProfile[]>;
  listShownHistory(userId: string, lookbackDays: number): Promise<MatchShownHistory[]>;
  listBlocks(userId: string): Promise<string[]>;
  listReports(userId: string): Promise<UserReport[]>;
  isQueuedForUser(userId: string, candidateId: string): Promise<boolean>;
  saveShownHistory(entries: MatchShownHistory[]): Promise<void>;
  listPairSignals(userId: string, candidateId: string, lookbackDays: number): Promise<MatchmakingSignal[]>;
  getSignalsByIdempotencyKey(idempotencyKey: string): Promise<MatchmakingSignal | null>;
  insertSignal(signal: MatchmakingSignal): Promise<void>;
  saveRun(run: MatchmakingRun): Promise<void>;
  saveRecommendations(userId: string, recommendations: MatchmakingCandidateScore[]): Promise<void>;
  getRecommendations(userId: string, limit: number): Promise<MatchmakingCandidateScore[]>;
}

export interface MatchmakingResponse {
  userId: string;
  tier: MatchmakingTier;
  generatedAt: string;
  version: string;
  recommendations: MatchmakingCandidateScore[];
}

export interface MatchWithSignals extends Match {
  whySignals?: string[];
}
