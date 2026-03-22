import { Scenario } from '../types';

/**
 * SCENARIO 9: THE BLACKMAIL LETTER
 * A mysterious letter threatens to reveal scandals. Medium difficulty.
 */
export const scenario9_blackmail: Scenario = {
  id: 'blackmail_letter',
  title: 'The Blackmail Letter',
  description: 'Someone is blackmailing a public figure. Find the extortionist before secrets are revealed.',
  difficulty: 'medium',
  startSceneId: 'scene_office_building',
  correctSuspectId: 'suspect_accountant',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_accountant',
      name: 'David Thompson',
      role: 'suspect',
      portrait: '🧮',
      alibi: 'I was reviewing financial records in my office.',
      motivation: 'Discovered embezzlement secret, using it as leverage',
      isRedHerring: false,
      evidence: ['evidence_blackmail_letter', 'evidence_financial_records', 'evidence_threatening_emails'],
    },
    {
      id: 'suspect_competitor',
      name: 'Patricia Gonzalez',
      role: 'suspect',
      portrait: '👩‍💼',
      alibi: 'I was in Los Angeles at a trade conference.',
      motivation: 'Strong business competition',
      isRedHerring: true,
      evidence: ['evidence_conference_attendance'],
    },
    {
      id: 'suspect_assistant',
      name: 'James O\'Connor',
      role: 'suspect',
      portrait: '👨‍💻',
      alibi: 'I was organizing files in the records room.',
      motivation: 'None, loyal employee',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_journalist',
      name: 'Rachel Mills',
      role: 'suspect',
      portrait: '📰',
      alibi: 'I was following leads on a different story.',
      motivation: 'Professional curiosity, no malice',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_blackmail_letter',
      name: 'Blackmail Letter',
      description: 'The letter contains specific knowledge only an insider would know. Written on office paper stock.',
      foundAt: 'Victim\'s Office',
      relevantToSuspects: ['suspect_accountant'],
      discovered: false,
    },
    {
      id: 'evidence_financial_records',
      name: 'Doctored Records',
      description: 'Investigation reveals David altered financial records to hide embezzlement. He was using this knowledge.',
      foundAt: 'Company Audit',
      relevantToSuspects: ['suspect_accountant'],
      discovered: false,
    },
    {
      id: 'evidence_threatening_emails',
      name: 'Email Threats',
      description: 'Anonymous threatening emails trace back to David\'s computer workstation.',
      foundAt: 'IT Department Logs',
      relevantToSuspects: ['suspect_accountant'],
      discovered: false,
    },
    {
      id: 'evidence_conference_attendance',
      name: 'Conference Records',
      description: 'Patricia was indeed registered and signed in at the Los Angeles trade conference all week.',
      foundAt: 'Conference Management',
      relevantToSuspects: ['suspect_competitor'],
      discovered: false,
    },
  ],

  scenes: {
    scene_office_building: {
      id: 'scene_office_building',
      title: 'Executive Office Building',
      description: 'A powerful executive has received blackmail threats. Time is running out.',
      backgroundUrl: 'url-to-office-building',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_victim_desk',
          area: { x: 150, y: 200, width: 200, height: 200 },
          tooltip: 'Victim\'s Desk',
          revealedText: 'You find the blackmail letter. It references specific financial secrets.',
          evidenceId: 'evidence_blackmail_letter',
        },
        {
          id: 'hotspot_accounting_dept',
          area: { x: 450, y: 250, width: 150, height: 150 },
          tooltip: 'Accounting Department',
          revealedText: 'Financial records here show evidence of tampering and embezzlement.',
          evidenceId: 'evidence_financial_records',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_examine_letter',
          prompt: 'Analyze the blackmail letter for clues',
          response: 'The letter uses specific accounting terms. Likely written by someone in finance.',
          consequence: 'clue',
          revealedClues: ['evidence_blackmail_letter'],
          nextSceneId: 'scene_financial_investigation',
        },
      ],
    },

    scene_financial_investigation: {
      id: 'scene_financial_investigation',
      title: 'Financial Records Investigation',
      description: 'Evidence points toward someone with access to confidential financial information.',
      backgroundUrl: 'url-to-investigation-room',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_examine_records',
          prompt: 'Audit the financial records thoroughly',
          response: 'You discover David altered multiple entries. He has the access and ability to do this.',
          consequence: 'clue',
          revealedClues: ['evidence_financial_records'],
          nextSceneId: 'scene_computer_analysis',
        },
      ],
    },

    scene_computer_analysis: {
      id: 'scene_computer_analysis',
      title: 'IT Department Analysis',
      description: 'Technology can trace the source of the threatening emails.',
      backgroundUrl: 'url-to-it-room',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_email_trace',
          prompt: 'Trace the threatening emails to their source',
          response: 'The emails originate from David Thompson\'s workstation. He\'s the extortionist!',
          consequence: 'phase',
          revealedClues: ['evidence_threatening_emails'],
          nextSceneId: 'scene_resolution',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Case Closed',
      description: 'The blackmailer has been caught.',
      backgroundUrl: 'url-to-police-station',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
      dialogueOptions: [],
    },
  },

  endings: {
    correct_suspect: {
      portraitUrl: '✅',
      title: 'Blackmailer Caught!',
      description: 'David Thompson\'s extortion plot was exposed. The victim is safe.',
    },
    wrong_suspect: {
      portraitUrl: '❌',
      title: 'Wrong Conclusion',
      description: 'The real blackmailer remains unidentified. The threats continue.',
    },
    timeout: {
      portraitUrl: '⏰',
      title: 'Time\'s Up',
      description: 'The secrets were revealed before you could solve the case.',
    },
  },
};
