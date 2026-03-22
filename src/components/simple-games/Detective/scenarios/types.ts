/**
 * Detective Game Scenario Type Definitions
 * Imported by all scenario files
 */

export interface Suspect {
  id: string;
  name: string;
  role: string;
  portrait: string;
  alibi: string;
  motivation: string;
  isRedHerring: boolean;
  evidence: string[];
}

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  foundAt: string;
  relevantToSuspects: string[];
  discovered: boolean;
}

export interface Hotspot {
  id: string;
  area: { x: number; y: number; width: number; height: number };
  tooltip: string;
  revealedText: string;
  evidenceId: string;
}

export interface DialogueOption {
  id: string;
  prompt: string;
  response: string;
  consequence: 'clue' | 'solved' | 'redirect';
  revealedClues: string[];
  nextSceneId: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  backgroundUrl: string;
  phase: 'investigation' | 'interrogation' | 'resolution';
  characters: string[];
  hotspots: Hotspot[];
  dialogueOptions: DialogueOption[];
}

export interface Ending {
  emoji: string;
  title: string;
  description: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  startSceneId: string;
  correctSuspectId: string;
  suspects: Suspect[];
  evidence: EvidenceItem[];
  scenes: Record<string, Scene>;
  endings: {
    correct_suspect: Ending;
    wrong_suspect: Ending;
    timeout: Ending;
  };
}
