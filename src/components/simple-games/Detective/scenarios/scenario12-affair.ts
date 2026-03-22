import { Scenario } from '../types';

/**
 * SCENARIO 12: THE SECRET AFFAIR BLACKMAIL
 * A politician is being blackmailed over an affair. Easy difficulty.
 */
export const scenario12_affair: Scenario = {
  id: 'affair_blackmail',
  title: 'The Secret Affair',
  description: 'A prominent politician is blackmailed over a secret relationship. Uncover the blackmailer.',
  difficulty: 'easy',
  startSceneId: 'scene_political_office',
  correctSuspectId: 'suspect_lobbyist',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_lobbyist',
      name: 'Margaret Hayes',
      role: 'suspect',
      portrait: '👩‍💼',
      alibi: 'I was at a conference in New York.',
      motivation: 'Political rivalry, trying to force policy changes',
      isRedHerring: false,
      evidence: ['evidence_photos_found', 'evidence_hotel_keycard', 'evidence_ransom_note'],
    },
    {
      id: 'suspect_journalist',
      name: 'Daniel Press',
      role: 'suspect',
      portrait: '👨‍💻',
      alibi: 'I was investigating a different corruption story.',
      motivation: 'Professional journalism, not blackmail',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_chief_of_staff',
      name: 'Ellen Murphy',
      role: 'suspect',
      portrait: '👩‍💼',
      alibi: 'I was organizing the political campaign.',
      motivation: 'Loyalty to the politician',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_bodyguard',
      name: 'Thomas Bradley',
      role: 'suspect',
      portrait: '🕵️',
      alibi: 'I was providing security detail.',
      motivation: 'Job responsibility',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_photos_found',
      name: 'Hidden Photos',
      description: 'Professional quality photos of the affair were discovered. They match Margaret\'s photography style.',
      foundAt: 'Anonymous Email',
      relevantToSuspects: ['suspect_lobbyist'],
      discovered: false,
    },
    {
      id: 'evidence_hotel_keycard',
      name: 'Hotel Keycard',
      description: 'Margaret\'s hotel keycard found near the politician\'s apartment. She was surveilling the location.',
      foundAt: 'Building Hallway',
      relevantToSuspects: ['suspect_lobbyist'],
      discovered: false,
    },
    {
      id: 'evidence_ransom_note',
      name: 'Ransom Note Analysis',
      description: 'Handwriting on the ransom note matches Margaret\'s signature from business documents.',
      foundAt: 'Handwriting Analysis Lab',
      relevantToSuspects: ['suspect_lobbyist'],
      discovered: false,
    },
  ],

  scenes: {
    scene_political_office: {
      id: 'scene_political_office',
      title: 'The Politician\'s Office',
      description: 'A sensitive blackmail demand has just arrived. The politician needs your help immediately.',
      backgroundUrl: 'url-to-political-office',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_ransombote',
          area: { x: 200, y: 150, width: 150, height: 100 },
          tooltip: 'Blackmail Letter',
          revealedText: 'The ransom note contains professional photographs. Someone was specifically surveilling.',
          evidenceId: 'evidence_ransom_note',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_analyze_letter',
          prompt: 'Analyze the blackmail letter for clues',
          response: 'The ransom note is professionally written. This is someone with specific knowledge and resources.',
          consequence: 'clue',
          revealedClues: ['evidence_ransom_note'],
          nextSceneId: 'scene_suspect_check',
        },
      ],
    },

    scene_suspect_check: {
      id: 'scene_suspect_check',
      title: 'Suspect Investigation',
      description: 'You investigate who would benefit from this blackmail.',
      backgroundUrl: 'url-to-investigation-room',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_check_locations',
          prompt: 'Check security footage around the apartment',
          response: 'You spot Margaret Hayes near the location multiple times. She was definitely surveilling.',
          consequence: 'clue',
          revealedClues: ['evidence_hotel_keycard'],
          nextSceneId: 'scene_confrontation',
        },
      ],
    },

    scene_confrontation: {
      id: 'scene_confrontation',
      title: 'Confronting the Blackmailer',
      description: 'Time to confront Margaret with the evidence.',
      backgroundUrl: 'url-to-interrogation',
      phase: 'interrogation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_confront_margaret',
          prompt: 'Confront Margaret with the evidence',
          response: 'She breaks down and confesses to the blackmail scheme.',
          consequence: 'phase',
          revealedClues: ['evidence_photos_found'],
          nextSceneId: 'scene_resolution',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Case Resolved',
      description: 'The blackmailer has been caught.',
      backgroundUrl: 'url-to-police-station',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
      dialogueOptions: [],
    },
  },

  endings: [
    {
      id: 'ending_correct',
      accusedSuspectId: 'suspect_lobbyist',
      isCorrect: true,
      title: 'Blackmailer Exposed!',
      description: 'Margaret Hayes\'s scheme was uncovered. The politician is safe.',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_journalist',
      isCorrect: false,
      title: 'Wrong Conclusion',
      description: 'The photographs have been released. The politician\'s career is over.',
      scoreMultiplier: 0.5,
    },
    {
      id: 'ending_timeout',
      accusedSuspectId: 'none',
      isCorrect: false,
      title: 'Time\'s Up',
      description: 'The blackmailer obtained the payoff before you solved the case.',
      scoreMultiplier: 0.0,
    },
  ],
};
