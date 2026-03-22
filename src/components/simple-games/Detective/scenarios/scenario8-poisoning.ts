import { Scenario } from '../types';

/**
 * SCENARIO 8: THE POISONING AT THE GALA
 * A prominent businessman is poisoned at a charity gala. Hard difficulty case.
 */
export const scenario8_poisoning: Scenario = {
  id: 'poisoning_gala',
  title: 'The Poisoning at the Gala',
  description: 'A prominent businessman collapses during a charity event. Investigate who poisoned him.',
  difficulty: 'hard',
  startSceneId: 'scene_gala_hall',
  correctSuspectId: 'suspect_ex_wife',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_ex_wife',
      name: 'Isabella Moretti',
      role: 'suspect',
      portrait: '👩‍🦱',
      alibi: 'I was mingling with guests all evening.',
      motivation: 'Revenge over custody battle and lost fortune',
      isRedHerring: false,
      evidence: ['evidence_poison_origins', 'evidence_love_letters', 'evidence_insurance_policy'],
    },
    {
      id: 'suspect_rival',
      name: 'Gregory Stone',
      role: 'suspect',
      portrait: '🧑‍💼',
      alibi: 'I was discussing contracts in the VIP lounge.',
      motivation: 'Competition in business, but no personal vendetta',
      isRedHerring: true,
      evidence: ['evidence_business_emails'],
    },
    {
      id: 'suspect_daughter',
      name: 'Victoria Sinclair',
      role: 'suspect',
      portrait: '👩‍🎓',
      alibi: 'I was with my father most of the evening.',
      motivation: 'Loves her father',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_server',
      name: 'Marcus Williams',
      role: 'suspect',
      portrait: '🧑‍🍳',
      alibi: 'I was serving food at the buffet table.',
      motivation: 'Just working',
      isRedHerring: true,
      evidence: ['evidence_catering_logs'],
    },
    {
      id: 'suspect_secretary',
      name: 'Amanda Foster',
      role: 'suspect',
      portrait: '👩‍💼',
      alibi: 'I attended the gala as a guest of the company.',
      motivation: 'None, loyal employee',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_poison_origins',
      name: 'Poison Analysis',
      description: 'Rare poison found in drink. Traces match chemicals found in Isabella\'s apartment laboratory.',
      foundAt: 'Toxicology Lab',
      relevantToSuspects: ['suspect_ex_wife'],
      discovered: false,
    },
    {
      id: 'evidence_love_letters',
      name: 'Intercepted Letters',
      description: 'Love letters between Isabella and a mysterious contact discussing "taking him down" in detail.',
      foundAt: 'Isabella\'s Residence',
      relevantToSuspects: ['suspect_ex_wife'],
      discovered: false,
    },
    {
      id: 'evidence_insurance_policy',
      name: 'Insurance Documents',
      description: 'Isabella stands to gain $50 million as beneficiary of hidden life insurance policy.',
      foundAt: 'Insurance Company Records',
      relevantToSuspects: ['suspect_ex_wife'],
      discovered: false,
    },
    {
      id: 'evidence_business_emails',
      name: 'Business Correspondence',
      description: 'Emails between Gregory and the victim discuss aggressive but legal competition.',
      foundAt: 'Company Email Server',
      relevantToSuspects: ['suspect_rival'],
      discovered: false,
    },
    {
      id: 'evidence_catering_logs',
      name: 'Catering Timeline',
      description: 'Detailed logs show Marcus was continuously monitored by kitchen manager. No opportunity to poison.',
      foundAt: 'Gala Records',
      relevantToSuspects: ['suspect_server'],
      discovered: false,
    },
  ],

  scenes: {
    scene_gala_hall: {
      id: 'scene_gala_hall',
      title: 'Grand Ballroom of the Metropolitan Gala',
      description: 'A man lies unconscious on the ballroom floor. Paramedics are working on him. Poison suspected.',
      backgroundUrl: 'url-to-gala',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_victim_drink',
          area: { x: 200, y: 150, width: 100, height: 100 },
          tooltip: 'Victim\'s Drink Glass',
          revealedText: 'The champagne glass contains residue of a rare poison.',
          evidenceId: 'evidence_poison_origins',
        },
        {
          id: 'hotspot_isabella',
          area: { x: 400, y: 300, width: 150, height: 150 },
          tooltip: 'Isabella Moretti',
          revealedText: 'She looks nervous but composed. Recently divorced from the victim.',
          evidenceId: 'evidence_insurance_policy',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_analyze_poison',
          prompt: 'Send the drink for toxicology analysis',
          response: 'The lab confirms a rare botanical poison. Very difficult to obtain.',
          consequence: 'clue',
          revealedClues: ['evidence_poison_origins'],
          nextSceneId: 'scene_investigation_deep',
        },
      ],
    },

    scene_investigation_deep: {
      id: 'scene_investigation_deep',
      title: 'Extended Investigation',
      description: 'You dig deeper into the suspects\' backgrounds and relationships.',
      backgroundUrl: 'url-to-investigation-room',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_isabella_home',
          prompt: 'Search Isabella\'s residence',
          response: 'You find chemical equipment and letters discussing the poisoning plan in detail.',
          consequence: 'phase',
          revealedClues: ['evidence_love_letters', 'evidence_insurance_policy'],
          nextSceneId: 'scene_resolution',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Justice Served',
      description: 'The poisoner has been identified and apprehended.',
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
      accusedSuspectId: 'suspect_ex_wife',
      isCorrect: true,
      title: 'Poisoner Caught!',
      description: 'Isabella Moretti\'s revenge plot was exposed. Justice prevails.',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_rival',
      isCorrect: false,
      title: 'Wrong Conclusion',
      description: 'You accused the wrong person. The real poisoner escaped.',
      scoreMultiplier: 0.5,
    },
    {
      id: 'ending_timeout',
      accusedSuspectId: 'none',
      isCorrect: false,
      title: 'Time\'s Up',
      description: 'The investigation could not be completed in time.',
      scoreMultiplier: 0.0,
    },
  ],
};
