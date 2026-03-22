export interface Hotspot {
  id: string;
  area: { x: number; y: number; width: number; height: number };
  tooltip: string;
  evidenceId?: string;
  revealedText: string;
}

export interface Character {
  id: string;
  name: string;
  role: 'detective' | 'suspect' | 'witness';
  portraitUrl: string;
  suspicionLevel?: number; // 0-100
}

export interface DialogueOption {
  id: string;
  prompt: string;
  response: string;
  revealedClues?: string[];
  nextSceneId?: string;
  consequence?: 'clue' | 'suspect' | 'phase';
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  backgroundUrl: string;
  characters: Character[];
  hotspots: Hotspot[];
  dialogueOptions?: DialogueOption[];
  nextSceneAuto?: string;
  phase: 'investigation' | 'interrogation' | 'conclusion';
}

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  foundAt: string;
  relevantToSuspects: string[];
  discovered: boolean;
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  portrait: string;
  alibi: string;
  motivation: string;
  isRedHerring: boolean;
  evidence: string[]; // evidence IDs pointing to this suspect
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  suspects: Suspect[];
  evidence: EvidenceItem[];
  scenes: Record<string, Scene>;
  correctSuspectId: string;
  startSceneId: string;
  endings: Ending[];
  estimatedTime: number;
}

export interface Ending {
  id: string;
  accusedSuspectId: string;
  isCorrect: boolean;
  title: string;
  description: string;
  scoreMultiplier: number;
}

export interface DetectiveGameState {
  scenarioId: string;
  currentSceneId: string;
  phase: 'investigation' | 'interrogation' | 'conclusion';

  // Investigation
  visitedLocations: string[];
  evidence: EvidenceItem[];
  discoveredEvidenceIds: string[];

  // Suspect interviews
  interviewedSuspects: Record<string, string[]>; // suspectId -> [question ids asked]
  suspectSuspicionLevels: Record<string, number>; // 0-100

  // Game state
  choicesMade: Array<{ sceneId: string; choiceId: string; timestamp: number }>;
  currentlySelectedSuspect?: string;
  accusedSuspectId?: string;
  endingId?: string;

  // Scoring
  investigationAccuracy: number; // 0-100
  timeSpent: number; // seconds
  cluesCollected: number;

  // Meta
  status: 'waiting' | 'active' | 'finished';
  mode: 'vs-partner' | 'solo';
  startTime: number;
  endTime?: number;
  recorded?: boolean;
}

export interface DetectiveResult {
  scenarioId: string;
  scenarioTitle: string;
  correctSuspectId: string;
  accusedSuspectId: string;
  endingId: string;
  investigationAccuracy: number;
  timeTaken: number;
  evidenceFound: number;
  score: number;
}
