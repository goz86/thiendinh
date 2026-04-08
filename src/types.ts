export interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  benefit: string;
  pattern: {
    inhale: number; // seconds
    hold1: number;
    exhale: number;
    hold2: number;
  };
  color: string;
}

export interface MeditationSession {
  id: string;
  date: string;
  techniqueId: string;
  techniqueName: string;
  durationSeconds: number;
}

export type Mood = 'peaceful' | 'calm' | 'anxious' | 'tired' | 'sad' | 'neutral';

export interface JournalEntry {
  id: string;
  date: string;
  mood: Mood;
  note: string;
  sessionId?: string; // Optional link to a session
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedDate: string;
  icon?: string;
}

export interface DailyHistoryPoint {
  label: string;
  minutes: number;
}

export interface MeditationStats {
  totalMinutes: number;
  sessionCount: number;
  monthlySessions: number;
  totalDuration: number;
  streak: number;
  favoriteTechnique: string;
  dailyHistory: DailyHistoryPoint[];
  badges: Badge[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  updated_at?: string;
}

export interface SiteVisit {
  id: string;
  visitor_id: string;
  user_id?: string | null;
  page_path: string;
  created_at: string;
}

export type VisualMode = 'cosmic' | 'sacred' | 'garden';

export type MalaMaterial = 'agarwood' | 'jade' | 'tiger_eye';
