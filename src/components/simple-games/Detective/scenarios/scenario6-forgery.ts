import { Scenario } from '../types';

/**
 * SCENARIO 6: THE COUNTERFEIT MASTERPIECE
 * An art forger has hidden a fake painting. Investigation into the art world.
 */
export const scenario6_forgery: Scenario = {
  id: 'forgery_masterpiece',
  title: 'The Counterfeit Masterpiece',
  description: 'A renowned artist\'s painting sold at auction is actually a forgery. Track down who created the fake.',
  difficulty: 'medium',
  startSceneId: 'scene_auction_house',
  correctSuspectId: 'suspect_apprentice',
  estimatedTime: 900, // 15 minutes

  suspects: [
    {
      id: 'suspect_apprentice',
      name: 'Elena Rossini',
      role: 'suspect',
      portrait: '🎨',
      alibi: 'I was helping prepare paintings in the studio.',
      motivation: 'Needed money after losing her job',
      isRedHerring: false,
      evidence: ['evidence_paint_samples', 'evidence_forged_signature'],
    },
    {
      id: 'suspect_auctioneer',
      name: 'David Ashworth',
      role: 'suspect',
      portrait: '🎩',
      alibi: 'I was cataloging items in the back office.',
      motivation: 'None (professional duty)',
      isRedHerring: true,
      evidence: ['evidence_auction_catalog'],
    },
    {
      id: 'suspect_restorer',
      name: 'Marcus Chen',
      role: 'suspect',
      portrait: '👨‍🔬',
      alibi: 'I was restoring another client\'s artwork.',
      motivation: 'None (honest craftsman)',
      isRedHerring: true,
      evidence: ['evidence_restoration_logs'],
    },
    {
      id: 'suspect_collector',
      name: 'Victoria Blackwell',
      role: 'suspect',
      portrait: '👩‍💼',
      alibi: 'I arrived just before the auction started.',
      motivation: 'Wanted to own the famous painting',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_paint_samples',
      name: 'Paint Analysis Report',
      description: 'Chemical analysis shows the paint composition doesn\'t match the artist\'s authentic works. It matches paint in the apprentice\'s studio.',
      foundAt: 'Laboratory',
      relevantToSuspects: ['suspect_apprentice'],
      discovered: false,
    },
    {
      id: 'evidence_forged_signature',
      name: 'Signature Comparison',
      description: 'Expert comparison reveals the signature is a forgery, written by a left-handed person. Elena is left-handed.',
      foundAt: 'Auction House Records',
      relevantToSuspects: ['suspect_apprentice'],
      discovered: false,
    },
    {
      id: 'evidence_auction_catalog',
      name: 'Catalog Entry',
      description: 'The auction catalog shows the painting was authenticated by the original artist just days before his death.',
      foundAt: 'Auction Records',
      relevantToSuspects: ['suspect_auctioneer'],
      discovered: false,
    },
    {
      id: 'evidence_restoration_logs',
      name: 'Restoration Timeline',
      description: 'Marcus\'s logs show he was busy with three other major restoration projects during the forgery window.',
      foundAt: 'Restoration Studio',
      relevantToSuspects: ['suspect_restorer'],
      discovered: false,
    },
  ],

  scenes: {
    scene_auction_house: {
      id: 'scene_auction_house',
      title: 'Prestigious Auction House',
      description: 'You enter the exclusive auction house where a multi-million dollar painting just failed authentication.',
      backgroundUrl: 'url-to-auction-house',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_painting_display',
          area: { x: 100, y: 150, width: 200, height: 300 },
          tooltip: 'Disputed Painting',
          revealedText: 'The painting looks authentic at first glance. But chemical analysis reveals discrepancies.',
          evidenceId: 'evidence_paint_samples',
        },
        {
          id: 'hotspot_apprentice_studio',
          area: { x: 400, y: 200, width: 150, height: 250 },
          tooltip: 'Artist\'s Studio',
          revealedText: 'You visit the apprentice\'s workspace. Paint tubes match the analysis results.',
          evidenceId: 'evidence_forged_signature',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_examine_painting',
          prompt: 'Request laboratory analysis of the painting',
          response: 'The expert confirms the paint is modern synthetic, not period-appropriate.',
          consequence: 'clue',
          revealedClues: ['evidence_paint_samples'],
          nextSceneId: 'scene_interrogation_start',
        },
        {
          id: 'choice_interview_auctioneer',
          prompt: 'Interview the head auctioneer',
          response: 'David explains the authentication was done by the original artist himself.',
          consequence: 'suspect',
          nextSceneId: 'scene_interrogation_start',
        },
      ],
    },

    scene_interrogation_start: {
      id: 'scene_interrogation_start',
      title: 'Beginning Interrogations',
      description: 'Time to question the suspects and gather more evidence.',
      backgroundUrl: 'url-to-interrogation-room',
      phase: 'interrogation',
      characters: [
        {
          id: 'char_apprentice',
          name: 'Elena Rossini',
          portraitUrl: '🎨',
          role: 'suspect',
        },
      ],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_accuse_apprentice',
          prompt: 'Confront Elena with the paint evidence',
          response: 'She confesses! Desperate for money, she created the forgery.',
          consequence: 'phase',
          revealedClues: ['evidence_paint_samples'],
          nextSceneId: 'scene_resolution',
        },
        {
          id: 'choice_ask_collaborators',
          prompt: 'Ask about who helped her execute the plan',
          response: 'She hesitates, suggesting involvement of the auctioneer.',
          consequence: 'suspect',
          revealedClues: ['evidence_auction_catalog'],
          nextSceneId: 'scene_interrogation_start',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Case Closed',
      description: 'You\'ve successfully identified the forger!',
      backgroundUrl: 'url-to-police-station',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_end_game',
          prompt: 'Return to headquarters',
          response: 'Another case closed. The art world is safer now.',
          consequence: 'phase',
          revealedClues: [],
          nextSceneId: 'scene_resolution',
        },
      ],
    },
  },

  endings: [
    {
      id: 'ending_correct',
      accusedSuspectId: 'suspect_apprentice',
      isCorrect: true,
      title: 'Forgery Exposed!',
      description: 'Elena Rossini confessed to creating the masterpiece forgery. Justice served!',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_auctioneer',
      isCorrect: false,
      title: 'Wrong Conclusion',
      description: 'The investigation fell short. The real forger remains at large.',
      scoreMultiplier: 0.5,
    },
    {
      id: 'ending_timeout',
      accusedSuspectId: 'none',
      isCorrect: false,
      title: 'Time\'s Up',
      description: 'You ran out of time. The case remains unsolved.',
      scoreMultiplier: 0.0,
    },
  ],
};
