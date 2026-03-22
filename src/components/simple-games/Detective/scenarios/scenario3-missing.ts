import { Scenario } from '../types';

/**
 * SCENARIO 3: MISSING PERSON
 * Time is running out. A person has disappeared. Find them before it's too late.
 */
export const scenario3_missing: Scenario = {
  id: 'missing_person',
  title: 'Time Is Running Out',
  description: 'A person has disappeared. You have 24 hours to find them.',
  difficulty: 'medium',
  startSceneId: 'scene_arrival',
  correctSuspectId: 'suspect_accomplice',

  suspects: [
    {
      id: 'suspect_accomplice',
      name: 'Mark Collins',
      role: 'Accomplice (GUILTY)',
      portrait: '🧑‍🤝',
      alibi: 'I was at home all day.',
      motivation: 'Financial dispute with the victim',
      isRedHerring: false,
      evidence: ['evidence_ransom_note', 'evidence_van_tracking'],
    },
    {
      id: 'suspect_friend',
      name: 'Alex Friend',
      role: 'Close Friend (Innocent)',
      portrait: '👫',
      alibi: 'I was with them that morning.',
      motivation: 'None (loyal friend)',
      isRedHerring: true,
      evidence: ['evidence_phone_records'],
    },
    {
      id: 'suspect_employer',
      name: 'Mr. Boss',
      role: 'Employer (Innocent)',
      portrait: '👨‍💼',
      alibi: 'I was at the office.',
      motivation: 'Recent promotion given',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_ransom_note',
      name: 'Ransom Note',
      description: 'A ransom note with Mark\'s handwriting patterns.',
      foundAt: 'Victim\'s Apartment',
      relevantToSuspects: ['suspect_accomplice'],
      discovered: false,
    },
    {
      id: 'evidence_van_tracking',
      name: 'GPS Tracking Data',
      description: 'Mark\'s van was near the warehouse where victim is being held.',
      foundAt: 'Traffic Camera',
      relevantToSuspects: ['suspect_accomplice'],
      discovered: false,
    },
    {
      id: 'evidence_phone_records',
      name: 'Phone Records',
      description: 'Alex was seen at the office during the time of disappearance.',
      foundAt: 'Phone Company',
      relevantToSuspects: ['suspect_friend'],
      discovered: false,
    },
  ],

  scenes: {
    scene_arrival: {
      id: 'scene_arrival',
      title: 'Missing Person Report',
      description: 'A person has gone missing. Racing against the clock to find them.',
      backgroundUrl: 'url-to-apartment',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_apartment',
          area: { x: 100, y: 150, width: 200, height: 300 },
          tooltip: 'Apartment',
          revealedText: 'You find a ransom note. Someone is holding them hostage.',
          evidenceId: 'evidence_ransom_note',
        },
        {
          id: 'hotspot_traffic_camera',
          area: { x: 400, y: 200, width: 150, height: 250 },
          tooltip: 'Traffic Camera Footage',
          revealedText: 'GPS data shows Mark\'s van near an abandoned warehouse.',
          evidenceId: 'evidence_van_tracking',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_check_apartment',
          prompt: 'Search the apartment',
          response: 'You find evidence of forced entry and a ransom note.',
          consequence: 'clue',
          revealedClues: ['evidence_ransom_note'],
          nextSceneId: 'scene_interrogation',
        },
        {
          id: 'choice_check_warehouse',
          prompt: 'Go to the warehouse (risky)',
          response: 'GPS data leads to an abandoned warehouse on the outskirts.',
          consequence: 'clue',
          revealedClues: ['evidence_van_tracking'],
          nextSceneId: 'scene_interrogation',
        },
      ],
    },

    scene_interrogation: {
      id: 'scene_interrogation',
      title: 'Urgent Questioning',
      description: 'Question the suspects to find the victim\'s location.',
      backgroundUrl: 'url-to-police-station',
      phase: 'interrogation',
      characters: [
        { id: 'suspect_accomplice', name: 'Mark Collins', role: 'suspect', portraitUrl: '🧑‍🤝' },
        { id: 'suspect_friend', name: 'Alex', role: 'suspect', portraitUrl: '👫' },
      ],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_accuse_mark',
          prompt: 'Accuse Mark',
          response: 'Mark breaks under pressure and reveals the warehouse location.',
          consequence: 'phase',
          nextSceneId: 'scene_ending_correct',
        },
        {
          id: 'choice_accuse_friend',
          prompt: 'Accuse Alex',
          response: 'Alex is shocked and denies it. Mark escapes.',
          consequence: 'phase',
          nextSceneId: 'scene_ending_wrong',
        },
      ],
    },

    scene_ending_correct: {
      id: 'scene_ending_correct',
      title: 'Rescue Mission',
      description: 'The victim is rescued just in time!',
      backgroundUrl: 'url-to-rescue',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },

    scene_ending_wrong: {
      id: 'scene_ending_wrong',
      title: 'Too Late',
      description: 'The victim could not be found in time.',
      backgroundUrl: 'url-to-end',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },
  },

  endings: [
    {
      id: 'ending_correct',
      accusedSuspectId: 'suspect_accomplice',
      isCorrect: true,
      title: 'Rescue Success',
      description: 'You save the victim with minutes to spare!',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_friend',
      isCorrect: false,
      title: 'Failed Rescue',
      description: 'Your mistake allowed the real criminal to escape.',
      scoreMultiplier: 0.4,
    },
  ],

  estimatedTime: 20,
};
