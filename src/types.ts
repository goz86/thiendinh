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

export type VisualMode = 'cosmic' | 'sacred' | 'garden';

export type MalaMaterial = 'agarwood' | 'jade' | 'tiger_eye';
