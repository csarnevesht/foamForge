export enum ViewState {
  HOME = 'HOME',
  GENERATOR = 'GENERATOR',
  LIBRARY = 'LIBRARY',
  CHAT = 'CHAT'
}

export interface GeneratedPattern {
  name: string;
  points: {x: number, y: number}[]; // Ordered list of coordinates for the continuous path
  description: string;
  difficulty: string; // "Easy", "Medium", "Hard"
  estimatedCutTime: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface MaterialInfo {
  id: string;
  name: string;
  density: string;
  meltPoint: string;
  bestFor: string;
  cuttingSpeed: string; // Arbitrary scale 1-10 or description
  wireTemp: string; // Description
}