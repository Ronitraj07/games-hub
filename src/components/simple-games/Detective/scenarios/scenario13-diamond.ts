import { Scenario } from '../types';

/**
 * SCENARIO 13: THE DIAMOND SWITCH
 * A world-renowned diamond goes missing during an exhibition. Hard difficulty.
 */
export const scenario13_diamond: Scenario = {
  id: 'diamond_switch',
  title: 'The Diamond Switch',
  description: 'The world\'s largest diamond vanishes from a prestigious exhibition replaced with a fake.',
  difficulty: 'hard',
  startSceneId: 'scene_diamond_exhibition',
  correctSuspectId: 'suspect_exhibition_manager',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_exhibition_manager',
      name: 'Richard Sterling',
      role: 'Exhibition Manager (GUILTY)',
      portrait: '🎩',
      alibi: 'I was coordinating the opening ceremony in the main hall.',
      motivation: 'Replaced diamond with fake to sell the real one for $50M',
      isRedHerring: false,
      evidence: ['evidence_fake_diamond', 'evidence_offshore_account', 'evidence_gemologist_contact'],
    },
    {
      id: 'suspect_security',
      name: 'Patricia Williams',
      role: 'Head of Security (Innocent)',
      portrait: '👮‍♀️',
      alibi: 'I was monitoring all security systems throughout the evening.',
      motivation: 'Professional duty',
      isRedHerring: true,
      evidence: ['evidence_security_logs'],
    },
    {
      id: 'suspect_jeweler',
      name: 'Antoine Dupree',
      role: 'Master Jeweler (Innocent)',
      portrait: '💎',
      alibi: 'I was in the back room inspecting restoration work.',
      motivation: 'Passionate about preserving gems',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_insurance',
      name: 'Christopher Hall',
      role: 'Insurance Adjuster (Innocent)',
      portrait: '📋',
      alibi: 'I was completing final documentation for the exhibition',
      motivation: 'Professional responsibility',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_intern',
      name: 'Sophia Mills',
      role: 'Exhibition Intern (Innocent)',
      portrait: '👩‍🎓',
      alibi: 'I was assisting with guest registration.',
      motivation: 'Just learning the business',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_fake_diamond',
      name: 'Expert Gemstone Analysis',
      description: 'Laboratory analysis confirms the diamond on display is a synthetic replica, not the authentic gem.',
      foundAt: 'Gemology Laboratory',
      relevantToSuspects: ['suspect_exhibition_manager'],
      discovered: false,
    },
    {
      id: 'evidence_offshore_account',
      name: 'Offshore Bank Transfer',
      description: 'Richard transferred $50M to a cryptocurrency wallet hours after the switch. Very suspicious timing.',
      foundAt: 'Financial Records',
      relevantToSuspects: ['suspect_exhibition_manager'],
      discovered: false,
    },
    {
      id: 'evidence_gemologist_contact',
      name: 'Communication with Master Forger',
      description: 'Encrypted messages between Richard and a master gem forger discussing the replica creation and payment.',
      foundAt: 'Phone Records',
      relevantToSuspects: ['suspect_exhibition_manager'],
      discovered: false,
    },
    {
      id: 'evidence_security_logs',
      name: 'Security System Logs',
      description: 'Patricia\'s monitoring shows no unauthorized access to the display case. Everything was by-the-book.',
      foundAt: 'Security Center',
      relevantToSuspects: ['suspect_security'],
      discovered: false,
    },
  ],

  scenes: {
    scene_diamond_exhibition: {
      id: 'scene_diamond_exhibition',
      title: 'International Diamond Exhibition',
      description: 'The most valuable diamond in the world has been stolen during the gala. But how? It was under constant watch.',
      backgroundUrl: 'url-to-diamond-exhibition',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_display_case',
          area: { x: 200, y: 200, width: 150, height: 200 },
          tooltip: 'Main Display Case',
          revealedText: 'The diamond is still here, but something seems off. Too perfect. Too symmetrical.',
          evidenceId: 'evidence_fake_diamond',
        },
        {
          id: 'hotspot_sterling_desk',
          area: { x: 450, y: 150, width: 150, height: 150 },
          tooltip: 'Exhibition Manager\'s Office',
          revealedText: 'You find financial records and communications related to gem buying.',
          evidenceId: 'evidence_offshore_account',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_examine_diamond',
          prompt: 'Request expert gemologist analysis of the diamond',
          response: 'The expert confirms it\'s a synthetic replica worth less than $10,000. The real diamond was replaced.',
          consequence: 'clue',
          revealedClues: ['evidence_fake_diamond'],
          nextSceneId: 'scene_inside_job_investigation',
        },
      ],
    },

    scene_inside_job_investigation: {
      id: 'scene_inside_job_investigation',
      title: 'Inside Job Investigation',
      description: 'Only someone with intimate knowledge of the exhibition could pull off this heist.',
      backgroundUrl: 'url-to-investigation-room',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_financial_records',
          prompt: 'Subpoena financial records of all staff',
          response: 'Richard Sterling recently received a massive $50M transfer. The timing is too perfect.',
          consequence: 'clue',
          revealedClues: ['evidence_offshore_account'],
          nextSceneId: 'scene_communications_analysis',
        },
      ],
    },

    scene_communications_analysis: {
      id: 'scene_communications_analysis',
      title: 'Digital Forensics',
      description: 'Communications reveal the conspiracy.',
      backgroundUrl: 'url-to-forensics-lab',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_phone_analysis',
          prompt: 'Analyze Richard\'s encrypted communications',
          response: 'Messages with a master gem forger confirm he commissioned the fake diamond and arranged the switch.',
          consequence: 'solved',
          revealedClues: ['evidence_gemologist_contact'],
          nextSceneId: 'scene_resolution',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Heist Mastermind Caught',
      description: 'The elaborate scheme has been unmasked.',
      backgroundUrl: 'url-to-police-station',
      phase: 'resolution',
      characters: [],
      hotspots: [],
      dialogueOptions: [],
    },
  },

  endings: {
    correct_suspect: {
      emoji: '💎',
      title: 'Diamond Heist Solved!',
      description: 'Richard Sterling\'s elaborate scheme was exposed. The real diamond is recovered.',
    },
    wrong_suspect: {
      emoji: '❌',
      title: 'Wrong Conclusion',
      description: 'The real mastermind escaped with the diamond and $50M.',
    },
    timeout: {
      emoji: '⏰',
      title: 'Time\'s Up',
      description: 'Richard disappeared before you could tie all the evidence together.',
    },
  },
};
