import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getCompatibilityColor(score: number): string {
  if (score >= 85) return '#34d399'; // green
  if (score >= 70) return '#8b5cf6'; // violet
  if (score >= 55) return '#fbbf24'; // amber
  return '#f43f5e'; // rose
}

export function getCompatibilityLabel(score: number): string {
  if (score >= 90) return 'Exceptional Match';
  if (score >= 80) return 'High Compatibility';
  if (score >= 70) return 'Good Match';
  if (score >= 60) return 'Moderate Match';
  return 'Low Compatibility';
}

export function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const QA_ACCESS_ALLOWLIST = new Set([
  'sarkarrony777@gmail.com',
  'sarkarronnie008@gmail.com',
]);

export function isQaAccessEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return QA_ACCESS_ALLOWLIST.has(normalized) || normalized.endsWith('@temple.edu');
}

export function isTempleEmail(email: string): boolean {
  return isQaAccessEmail(email);
}

export function isTempleUniversityEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.endsWith('@temple.edu');
}

export const INTERESTS = [
  'Hiking', 'Photography', 'Cooking', 'Travel', 'Music', 'Art', 'Reading',
  'Fitness', 'Gaming', 'Film', 'Coffee', 'Wine', 'Yoga', 'Meditation',
  'Cycling', 'Dancing', 'Surfing', 'Rock Climbing', 'Skiing', 'Tennis',
  'Running', 'Swimming', 'Foodie', 'Concerts', 'Theater', 'Museums',
  'Startups', 'Tech', 'Fashion', 'Interior Design', 'Gardening', 'Volunteering',
  'Astrology', 'Podcasts', 'Comedy', 'Anime', 'Board Games', 'Camping',
];

export const VALUES = [
  'Family', 'Ambition', 'Honesty', 'Adventure', 'Creativity', 'Kindness',
  'Independence', 'Loyalty', 'Growth', 'Spirituality', 'Humor', 'Health',
  'Sustainability', 'Education', 'Community', 'Freedom', 'Security', 'Equality',
];

export const PERSONALITY_TRAITS = [
  'Adventurous', 'Thoughtful', 'Ambitious', 'Empathetic', 'Playful',
  'Intellectual', 'Creative', 'Nurturing', 'Spontaneous', 'Grounded',
  'Passionate', 'Calm', 'Curious', 'Warm', 'Analytical',
];
