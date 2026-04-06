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
