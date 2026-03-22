import { Scenario } from '../types';

/**
 * SCENARIO 5: UNDERCOVER IDENTITY
 * A dangerous criminal is hiding in plain sight. Crack the double identity.
 */
export const scenario5_identity: Scenario = {
  id: 'secret_identity',
  title: 'Double Identity',
  description: 'A notorious criminal is hiding in the city under a false identity.',
  difficulty: 'hard',
  startSceneId: 'scene_arrival',
  correctSuspectId: 'suspect_businessman',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_businessman',
      name: 'Victor Sterling',
      role: 'suspect',
      portrait: '🎩',
      alibi: 'I run legitimate import/export business.',
      motivation: 'Hiding from Interpol after art theft',
      isRedHerring: false,
      evidence: ['evidence_passport_forgery', 'evidence_stolen_paintings'],
    },
    {
      id: 'suspect_colleague',
      name: 'Andrew Colleague',
      role: 'suspect',
      portrait: '👔',
      alibi: 'I work at the same company.',
      motivation: 'None (standard employee)',
      isRedHerring: true,
      evidence: ['evidence_travel_records'],
    },
    {
      id: 'suspect_landlord',
      name: 'Mrs. Landlord',
      role: 'suspect',
      portrait: '👵',
      alibi: 'I manage the office building.',
      motivation: 'Collects rent from Victor',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_passport_forgery',
      name: 'Forged Passport',
      description: 'Victor\'s passport is a high-quality forgery under another name.',
      foundAt: 'Victor\'s Office Safe',
      relevantToSuspects: ['suspect_businessman'],
      discovered: false,
    },
    {
      id: 'evidence_stolen_paintings',
      name: 'Stolen Paintings',
      description: 'Famous stolen paintings from Interpol\'s list hidden in Victor\'s warehouse.',
      foundAt: 'Warehouse',
      relevantToSuspects: ['suspect_businessman'],
      discovered: false,
    },
    {
      id: 'evidence_travel_records',
      name: 'Travel Records',
      description: 'Andrew traveled extensively but all documented legitimately.',
      foundAt: 'Airlines Database',
      relevantToSuspects: ['suspect_colleague'],
      discovered: false,
    },
  ],

  scenes: {
    scene_arrival: {
      id: 'scene_arrival',
      title: 'Identity Crisis',
      description: 'A criminal mastermind is hiding in the city. Find them.',
      backgroundUrl: 'url-to-office',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_office_safe',
          area: { x: 100, y: 150, width: 200, height: 300 },
          tooltip: 'Office Safe',
          revealedText: 'You find a forged passport with Victor\'s photo but different name.',
          evidenceId: 'evidence_passport_forgery',
        },
        {
          id: 'hotspot_warehouse',
          area: { x: 400, y: 200, width: 150, height: 250 },
          tooltip: 'Warehouse',
          revealedText: 'The warehouse contains stolen masterpieces from world museums.',
          evidenceId: 'evidence_stolen_paintings',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_search_office',
          prompt: 'Search Victor\'s office',
          response: 'You discover a forged passport hidden in the safe.',
          consequence: 'clue',
          revealedClues: ['evidence_passport_forgery'],
          nextSceneId: 'scene_interrogation',
        },
        {
          id: 'choice_raid_warehouse',
          prompt: 'Raid the warehouse',
          response: 'Interpol\'s most wanted paintings are hidden there.',
          consequence: 'clue',
          revealedClues: ['evidence_stolen_paintings'],
          nextSceneId: 'scene_interrogation',
        },
      ],
    },

    scene_interrogation: {
      id: 'scene_interrogation',
      title: 'Confrontation',
      description: 'Face the suspects with your evidence.',
      backgroundUrl: 'url-to-interrogation',
      phase: 'interrogation',
      characters: [
        { id: 'suspect_businessman', name: 'Victor Sterling', role: 'suspect', portraitUrl: '🎩' },
        { id: 'suspect_colleague', name: 'Andrew', role: 'suspect', portraitUrl: '👔' },
      ],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_accuse_victor',
          prompt: 'Accuse Victor of being the criminal',
          response: 'Victor\'s facade crumbles. His real identity is revealed.',
          consequence: 'phase',
          nextSceneId: 'scene_ending_correct',
        },
        {
          id: 'choice_accuse_andrew',
          prompt: 'Accuse Andrew',
          response: 'Andrew proves his identity conclusively. Victor vanishes.',
          consequence: 'phase',
          nextSceneId: 'scene_ending_wrong',
        },
      ],
    },

    scene_ending_correct: {
      id: 'scene_ending_correct',
      title: 'True Identity Revealed',
      description: 'Victor\'s real identity and crimes are exposed to Interpol.',
      backgroundUrl: 'url-to-arrest',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },

    scene_ending_wrong: {
      id: 'scene_ending_wrong',
      title: 'Escape',
      description: 'The criminal masterfully escapes, leaving no trace.',
      backgroundUrl: 'url-to-end',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },
  },

  endings: [
    {
      id: 'ending_correct',
      accusedSuspectId: 'suspect_businessman',
      isCorrect: true,
      title: 'International Arrest',
      description: 'Victor is arrested and extradited to face charges in multiple countries.',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_colleague',
      isCorrect: false,
      title: 'Mastermind Escapes',
      description: 'The criminal disappears with the stolen artwork.',
      scoreMultiplier: 0.2,
    },
  ],

  
};
