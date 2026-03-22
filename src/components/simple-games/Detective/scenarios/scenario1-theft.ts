import { Scenario } from '../types';

/**
 * SCENARIO 1: THE STOLEN PEARL
 * A priceless pearl necklace has been stolen from a locked room.
 * Investigation phase: Visit locations, collect evidence
 * Interrogation phase: Question suspects based on evidence
 * Conclusion phase: Accuse the thief
 */
export const scenario1_theft: Scenario = {
  id: 'theft_manor',
  title: 'The Stolen Pearl',
  description: 'A priceless pearl necklace has vanished from a locked room. Your job is to find it.',
  difficulty: 'medium',
  startSceneId: 'scene_arrival',
  correctSuspectId: 'suspect_butler',
  estimatedTime: 900, // 15 minutes

  suspects: [
    {
      id: 'suspect_butler',
      name: 'Thomas Butler',
      role: 'suspect',
      portrait: '🧑‍💼',
      alibi: 'I was polishing silver in the pantry when the theft occurred.',
      motivation: 'Needed money for gambling debts',
      isRedHerring: false,
      evidence: ['evidence_muddy_shoes', 'evidence_key_copy'],
    },
    {
      id: 'suspect_gardener',
      name: 'Marcus Gardener',
      role: 'suspect',
      portrait: '👨‍🌾',
      alibi: 'I was trimming hedges outside the study windows.',
      motivation: 'None (disgruntled but loyal)',
      isRedHerring: true,
      evidence: ['evidence_dirt_under_nails'],
    },
    {
      id: 'suspect_maid',
      name: 'Clara Maid',
      role: 'suspect',
      portrait: '👩‍🍳',
      alibi: 'I was cleaning upstairs, heard nothing unusual.',
      motivation: 'None (reliable employee)',
      isRedHerring: true,
      evidence: ['evidence_ribbon'],
    },
    {
      id: 'suspect_guest',
      name: 'Robert Guest',
      role: 'suspect',
      portrait: '🎩',
      alibi: 'I was in the reading room the entire time.',
      motivation: 'Visiting family friend',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_muddy_shoes',
      name: 'Muddy Footprint',
      description: 'A muddy footprint found on the study windowsill. The size matches the butler\'s shoes.',
      foundAt: 'Study Windowsill',
      relevantToSuspects: ['suspect_butler'],
      discovered: false,
    },
    {
      id: 'evidence_key_copy',
      name: 'Extra Key',
      description: 'A duplicate key to the study found in the butler\'s quarters. This allows access without forcing entry.',
      foundAt: 'Butler\'s Room',
      relevantToSuspects: ['suspect_butler'],
      discovered: false,
    },
    {
      id: 'evidence_dirt_under_nails',
      name: 'Dirt Under Nails',
      description: 'The gardener has soil under his nails from recent gardening. Not suspicious.',
      foundAt: 'Gardener\'s Hands',
      relevantToSuspects: ['suspect_gardener'],
      discovered: false,
    },
    {
      id: 'evidence_ribbon',
      name: 'Blue Ribbon',
      description: 'A blue ribbon found on the study floor, belonging to the housemaid\'s uniform.',
      foundAt: 'Study Floor',
      relevantToSuspects: ['suspect_maid'],
      discovered: false,
    },
  ],

  scenes: {
    scene_arrival: {
      id: 'scene_arrival',
      title: 'Arrival at the Manor',
      description: 'You arrive at the grand manor. The theft occurred in the locked study two hours ago.',
      backgroundUrl: 'url-to-manor-entrance',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_study',
          area: { x: 100, y: 150, width: 200, height: 300 },
          tooltip: 'Study (locked)',
          revealedText: 'You notice the door is sealed with police tape. Click to investigate.',
          evidenceId: 'evidence_muddy_shoes',
        },
        {
          id: 'hotspot_butler_quarters',
          area: { x: 400, y: 200, width: 150, height: 250 },
          tooltip: 'Butler\'s Quarters',
          revealedText: 'The butler\'s room is neat and organized. You find a copy key in the drawer.',
          evidenceId: 'evidence_key_copy',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_investigate_study',
          prompt: 'Investigate the study thoroughly',
          response: 'You examine the crime scene. The window latch was forced open.',
          consequence: 'clue',
          revealedClues: ['evidence_muddy_shoes'],
          nextSceneId: 'scene_interrogation_start',
        },
        {
          id: 'choice_interview_butler',
          prompt: 'Interview the butler immediately',
          response: 'Thomas seems nervous. He claims he was polishing silver.',
          consequence: 'suspect',
          nextSceneId: 'scene_interrogation_start',
        },
      ],
    },

    scene_interrogation_start: {
      id: 'scene_interrogation_start',
      title: 'Interrogation Room',
      description: 'All suspects are gathered. Time to ask questions.',
      backgroundUrl: 'url-to-interrogation-room',
      phase: 'interrogation',
      characters: [
        {
          id: 'suspect_butler',
          name: 'Thomas Butler',
          role: 'suspect',
          portraitUrl: '🧑‍💼',
        },
        {
          id: 'suspect_gardener',
          name: 'Marcus Gardener',
          role: 'suspect',
          portraitUrl: '👨‍🌾',
        },
      ],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_ask_butler_alibi',
          prompt: 'Ask Butler about muddy footprint',
          response: 'Butler fidgets nervously. "I... I must have stepped on the windowsill while checking the lock."',
          revealedClues: ['evidence_key_copy'],
          consequence: 'suspect',
          nextSceneId: 'scene_conclusion',
        },
        {
          id: 'choice_ask_gardener',
          prompt: 'Ask Gardener about evidence',
          response: 'Gardener appears calm. "I was trimming the hedges, I heard nothing."',
          consequence: 'clue',
          nextSceneId: 'scene_conclusion',
        },
      ],
    },

    scene_conclusion: {
      id: 'scene_conclusion',
      title: 'Final Accusation',
      description: 'Time to reveal who took the necklace.',
      backgroundUrl: 'url-to-study-final',
      phase: 'conclusion',
      characters: [
        {
          id: 'suspect_butler',
          name: 'Thomas Butler',
          role: 'suspect',
          portraitUrl: '🧑‍💼',
        },
      ],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_accuse_butler',
          prompt: 'Accuse Thomas Butler',
          response: 'Butler\'s face goes pale. "Alright, I did it. I needed money..."',
          consequence: 'phase',
          nextSceneId: 'scene_ending_correct',
        },
        {
          id: 'choice_accuse_gardener',
          prompt: 'Accuse Marcus Gardener',
          response: 'Gardener looks shocked. "What? No, I swear I didn\'t!"',
          consequence: 'phase',
          nextSceneId: 'scene_ending_wrong',
        },
      ],
    },

    scene_ending_correct: {
      id: 'scene_ending_correct',
      title: 'Case Solved!',
      description: 'You correctly identified the thief.',
      backgroundUrl: 'url-to-conclusion',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },

    scene_ending_wrong: {
      id: 'scene_ending_wrong',
      title: 'Investigation Failed',
      description: 'The real thief escapes. Investigation inconclusive.',
      backgroundUrl: 'url-to-conclusion',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },
  },

  endings: [
    {
      id: 'ending_correct',
      accusedSuspectId: 'suspect_butler',
      isCorrect: true,
      title: 'Case Solved',
      description: 'You correctly identified the butler as the thief. The necklace is recovered.',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong_gardener',
      accusedSuspectId: 'suspect_gardener',
      isCorrect: false,
      title: 'Wrong Accusation',
      description: 'The gardener was innocent. The real thief remains at large.',
      scoreMultiplier: 0.5,
    },
  ],

  
};
