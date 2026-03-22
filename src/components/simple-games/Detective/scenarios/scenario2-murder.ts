import { Scenario } from '../types';

/**
 * SCENARIO 2: LOCKED ROOM MURDER
 * Someone was murdered in a locked study. Three suspects with alibis.
 */
export const scenario2_murder: Scenario = {
  id: 'murder_locked_room',
  title: 'Locked Room Mystery',
  description: 'Someone was murdered in a locked room. The door was bolted from inside.',
  difficulty: 'hard',
  startSceneId: 'scene_arrival',
  correctSuspectId: 'suspect_doctor',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_doctor',
      name: 'Dr. Elizabeth',
      role: 'suspect',
      portrait: '👨‍⚕️',
      alibi: 'I was in my office making notes.',
      motivation: 'Business rival owed me money',
      isRedHerring: false,
      evidence: ['evidence_poison_bottle', 'evidence_key_mold'],
    },
    {
      id: 'suspect_lawyer',
      name: 'James Lawyer',
      role: 'suspect',
      portrait: '👨‍⚖️',
      alibi: 'I was reviewing contracts downstairs.',
      motivation: 'None (professional acquaintance)',
      isRedHerring: true,
      evidence: ['evidence_muddy_shoes'],
    },
    {
      id: 'suspect_assistant',
      name: 'Sarah Assistant',
      role: 'suspect',
      portrait: '👩‍💼',
      alibi: 'I was organizing files in the archive.',
      motivation: 'Recently promoted',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_poison_bottle',
      name: 'Empty Poison Bottle',
      description: 'A bottle of rare poison found in Dr. Elizabeth\'s drawer.',
      foundAt: 'Doctor\'s Office',
      relevantToSuspects: ['suspect_doctor'],
      discovered: false,
    },
    {
      id: 'evidence_key_mold',
      name: 'Key Impression',
      description: 'An impression of a key in clay. Matches Dr. Elizabeth\'s master key.',
      foundAt: 'Study Floor',
      relevantToSuspects: ['suspect_doctor'],
      discovered: false,
    },
    {
      id: 'evidence_muddy_shoes',
      name: 'Muddy Footprints',
      description: 'Muddy prints on the study floor. Size matches the lawyer\'s shoes.',
      foundAt: 'Study Floor',
      relevantToSuspects: ['suspect_lawyer'],
      discovered: false,
    },
  ],

  scenes: {
    scene_arrival: {
      id: 'scene_arrival',
      title: 'Crime Scene',
      description: 'The victim is found in the locked study. The door was bolted from inside.',
      backgroundUrl: 'url-to-study',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_study',
          area: { x: 100, y: 150, width: 200, height: 300 },
          tooltip: 'Locked Study',
          revealedText: 'The study is locked from inside. How did the murderer escape?',
          evidenceId: 'evidence_key_mold',
        },
        {
          id: 'hotspot_doctor_office',
          area: { x: 400, y: 200, width: 150, height: 250 },
          tooltip: 'Doctor\'s Office',
          revealedText: 'You find a bottle of rare poison in a drawer.',
          evidenceId: 'evidence_poison_bottle',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_examine_poison',
          prompt: 'Examine the poison bottle',
          response: 'The poison matches the victim\'s symptoms exactly.',
          consequence: 'clue',
          revealedClues: ['evidence_poison_bottle'],
          nextSceneId: 'scene_interrogation',
        },
        {
          id: 'choice_interview_doctor',
          prompt: 'Question Dr. Elizabeth',
          response: 'She seems nervous about the inquiry.',
          consequence: 'suspect',
          nextSceneId: 'scene_interrogation',
        },
      ],
    },

    scene_interrogation: {
      id: 'scene_interrogation',
      title: 'Interrogation',
      description: 'Time to question suspects.',
      backgroundUrl: 'url-to-interrogation',
      phase: 'interrogation',
      characters: [
        { id: 'suspect_doctor', name: 'Dr. Elizabeth', role: 'suspect', portraitUrl: '👨‍⚕️' },
        { id: 'suspect_lawyer', name: 'James', role: 'suspect', portraitUrl: '👨‍⚖️' },
      ],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_accuse_doctor',
          prompt: 'Accuse Dr. Elizabeth',
          response: 'Doctor\'s hands shake. "Fine... I did it."',
          consequence: 'phase',
          nextSceneId: 'scene_ending_correct',
        },
        {
          id: 'choice_accuse_lawyer',
          prompt: 'Accuse James the Lawyer',
          response: 'He denies everything vehemently.',
          consequence: 'phase',
          nextSceneId: 'scene_ending_wrong',
        },
      ],
    },

    scene_ending_correct: {
      id: 'scene_ending_correct',
      title: 'Confession',
      description: 'Dr. Elizabeth confesses to the murder.',
      backgroundUrl: 'url-to-end',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },

    scene_ending_wrong: {
      id: 'scene_ending_wrong',
      title: 'Investigation Failed',
      description: 'The real murderer escapes.',
      backgroundUrl: 'url-to-end',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },
  },

  endings: [
    {
      id: 'ending_correct',
      accusedSuspectId: 'suspect_doctor',
      isCorrect: true,
      title: 'Justice Served',
      description: 'Dr. Elizabeth is arrested for the murder.',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_lawyer',
      isCorrect: false,
      title: 'Wrong Suspect',
      description: 'The real murderer escapes due to your error.',
      scoreMultiplier: 0.5,
    },
  ],

  
};
