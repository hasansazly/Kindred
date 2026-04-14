export type Gender = 'man' | 'woman' | 'nonbinary' | 'other';
export type RelationshipGoal = 'relationship' | 'casual' | 'friendship' | 'unsure';
export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';
export type LoveLanguage = 'words' | 'acts' | 'gifts' | 'time' | 'touch';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  location: string;
  bio: string;
  occupation: string;
  education: string;
  photos: string[];
  interests: string[];
  values: string[];
  personalityTraits: string[];
  relationshipGoal: RelationshipGoal;
  attachmentStyle: AttachmentStyle;
  loveLanguage: LoveLanguage;
  height?: string;
  religion?: string;
  politics?: string;
  drinking?: string;
  smoking?: string;
  kids?: string;
  auraScore: number; // 0-100, AI-computed personality score
  isVerified: boolean;
  lastActive: string;
  distance?: number; // km
}

export interface Match {
  id: string;
  profile: UserProfile;
  compatibilityScore: number; // 0-100
  compatibilityBreakdown: CompatibilityBreakdown;
  matchedAt: string;
  aiReason: string; // Why AI matched you
  conversation?: Message[];
  isNew?: boolean;
}

export interface CompatibilityBreakdown {
  values: number;
  communication: number;
  lifestyle: number;
  interests: number;
  goals: number;
  emotional: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'ai_suggestion' | 'date_idea';
  read?: boolean;
}

export interface AIDateIdea {
  title: string;
  description: string;
  category: 'outdoor' | 'food' | 'culture' | 'adventure' | 'cozy';
  estimatedTime: string;
  cost: 'free' | '$' | '$$' | '$$$';
}

export interface OnboardingData {
  name: string;
  age: string;
  gender: Gender | '';
  photos: string[];
  bio: string;
  occupation: string;
  education: string;
  location: string;
  interests: string[];
  values: string[];
  relationshipGoal: RelationshipGoal | '';
  attachmentStyle: AttachmentStyle | '';
  loveLanguages: LoveLanguage[];
  height: string;
  // preferences
  minAge: number;
  maxAge: number;
  distance: number;
  genderPreference: string[];
}

export interface SafetyFlag {
  type: 'red_flag' | 'yellow_flag' | 'green_flag';
  label: string;
  description: string;
}
