import { Scenario } from '../types';

/**
 * SCENARIO 7: THE MISSING HEIRLOOM
 * A family heirloom goes missing during a dinner party. Easy difficulty for beginners.
 */
export const scenario7_heirloom: Scenario = {
  id: 'heirloom_missing',
  title: 'The Missing Heirloom',
  description: 'A priceless family ring vanishes during a dinner party. Find the thief among the guests.',
  difficulty: 'easy',
  startSceneId: 'scene_dining_room',
  correctSuspectId: 'suspect_cousin',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_cousin',
      name: 'Michael Sterling',
      role: 'suspect',
      portrait: '👨‍💼',
      alibi: 'I was in the garden getting fresh air.',
      motivation: 'Deep gambling debts, desperate for money',
      isRedHerring: false,
      evidence: ['evidence_ring_in_pocket', 'evidence_gambling_receipts'],
    },
    {
      id: 'suspect_sister',
      name: 'Sophie Anderson',
      role: 'suspect',
      portrait: '👩‍🦰',
      alibi: 'I was helping mom in the kitchen.',
      motivation: 'None (family)',
      isRedHerring: true,
      evidence: ['evidence_flour_on_dress'],
    },
    {
      id: 'suspect_boyfriend',
      name: 'James Mitchell',
      role: 'suspect',
      portrait: '🧔',
      alibi: 'I was watching the game on TV in the living room.',
      motivation: 'Dating Sophie, no reason to steal',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_hired_help',
      name: 'Lisa Brown',
      role: 'suspect',
      portrait: '👩‍🍳',
      alibi: 'I was serving drinks the entire evening.',
      motivation: 'Just doing her job',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_ring_in_pocket',
      name: 'Ring Found in Pocket',
      description: 'Security footage shows Michael putting something in his pocket during dinner. Search reveals the ring!',
      foundAt: 'Michael\'s Jacket Pocket',
      relevantToSuspects: ['suspect_cousin'],
      discovered: false,
    },
    {
      id: 'evidence_gambling_receipts',
      name: 'Gambling Receipts',
      description: 'Research shows Michael owes significant money to loan sharks. Clear financial motive.',
      foundAt: 'Police Records',
      relevantToSuspects: ['suspect_cousin'],
      discovered: false,
    },
    {
      id: 'evidence_flour_on_dress',
      name: 'Flour on Dress',
      description: 'Sophie has flour on her dress from baking. Confirms her alibi in the kitchen.',
      foundAt: 'Visible on Clothing',
      relevantToSuspects: ['suspect_sister'],
      discovered: false,
    },
  ],

  scenes: {
    scene_dining_room: {
      id: 'scene_dining_room',
      title: 'The Dining Room',
      description: 'The family dinner party has just ended. The ring, which was being displayed, is gone!',
      backgroundUrl: 'url-to-dining-room',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_display_case',
          area: { x: 150, y: 200, width: 100, height: 150 },
          tooltip: 'Ring Display Case',
          revealedText: 'The glass case is unlocked. Anyone could have taken it during dinner.',
          evidenceId: 'evidence_ring_in_pocket',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_search_guests',
          prompt: 'Search all the guests\' belongings',
          response: 'You find the ring in Michael\'s jacket pocket! Case solved.',
          consequence: 'phase',
          revealedClues: ['evidence_ring_in_pocket'],
          nextSceneId: 'scene_resolution',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Case Closed',
      description: 'The thief has been caught!',
      backgroundUrl: 'url-to-resolution',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
      dialogueOptions: [],
    },
  },

  endings: {
    correct_suspect: {
      portraitUrl: '🎉',
      title: 'Heirloom Recovered!',
      description: 'Michael Sterling confessed. The family heirloom is safe.',
    },
    wrong_suspect: {
      portraitUrl: '❌',
      title: 'Wrong Conclusion',
      description: 'The real thief is still out there.',
    },
    timeout: {
      portraitUrl: '⏰',
      title: 'Time\'s Up',
      description: 'The case could not be solved in time.',
    },
  },
};
