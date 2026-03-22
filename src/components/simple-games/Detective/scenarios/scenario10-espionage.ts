import { Scenario } from '../types';

/**
 * SCENARIO 10: THE CORPORATE ESPIONAGE
 * Trade secrets stolen from a tech company. Hard difficulty case.
 */
export const scenario10_espionage: Scenario = {
  id: 'espionage_tech',
  title: 'Corporate Espionage',
  description: 'A tech company\'s breakthrough AI algorithm has been stolen. Track the corporate spy.',
  difficulty: 'hard',
  startSceneId: 'scene_tech_campus',
  correctSuspectId: 'suspect_lead_engineer',
  estimatedTime: 900,

  suspects: [
    {
      id: 'suspect_lead_engineer',
      name: 'Dr. Samuel Park',
      role: 'suspect',
      portrait: '👨‍💼',
      alibi: 'I was working late in my lab on the algorithm.',
      motivation: 'Offered $2M by competitor to steal the code',
      isRedHerring: false,
      evidence: ['evidence_data_theft', 'evidence_bank_deposits', 'evidence_suspicious_emails'],
    },
    {
      id: 'suspect_investor',
      name: 'Thomas Richardson',
      role: 'suspect',
      portrait: '💰',
      alibi: 'I was attending a board dinner downtown.',
      motivation: 'Wants company to succeed, invested $5M',
      isRedHerring: true,
      evidence: ['evidence_restaurant_receipt'],
    },
    {
      id: 'suspect_intern',
      name: 'Lisa Chen',
      role: 'suspect',
      portrait: '📚',
      alibi: 'I was working on documentation tasks.',
      motivation: 'Just an intern, no access to secure files',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_cto',
      name: 'Michael Zhang',
      role: 'suspect',
      portrait: '👨‍💻',
      alibi: 'I was in meetings with the executive team.',
      motivation: 'Company\'s founder, very invested in success',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_data_theft',
      name: 'Data Theft Confirmation',
      description: 'The algorithm was copied to external drive using Samuel\'s credentials. Security logs confirm this.',
      foundAt: 'Security Department',
      relevantToSuspects: ['suspect_lead_engineer'],
      discovered: false,
    },
    {
      id: 'evidence_bank_deposits',
      name: 'Suspicious Bank Deposits',
      description: 'Samuel deposited $2M into his account four days after the theft. Matches competitor\'s offer timeline.',
      foundAt: 'Bank Records',
      relevantToSuspects: ['suspect_lead_engineer'],
      discovered: false,
    },
    {
      id: 'evidence_suspicious_emails',
      name: 'Encrypted Communications',
      description: 'Emails between Samuel and competitor using code phrases "Project Aurora" and "delivery confirmed".',
      foundAt: 'Email Servers',
      relevantToSuspects: ['suspect_lead_engineer'],
      discovered: false,
    },
    {
      id: 'evidence_restaurant_receipt',
      name: 'Dinner Receipt',
      description: 'Thomas\'s credit card confirms the high-end restaurant reservation during the alleged time of theft.',
      foundAt: 'Credit Card Statement',
      relevantToSuspects: ['suspect_investor'],
      discovered: false,
    },
  ],

  scenes: {
    scene_tech_campus: {
      id: 'scene_tech_campus',
      title: 'Tech Campus Security Center',
      description: 'Valuable source code has been stolen. The company\'s future depends on solving this.',
      backgroundUrl: 'url-to-tech-campus',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_server_room',
          area: { x: 100, y: 150, width: 250, height: 300 },
          tooltip: 'Secure Server Room',
          revealedText: 'Access logs show the algorithm was copied to external storage.',
          evidenceId: 'evidence_data_theft',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_review_logs',
          prompt: 'Review security access logs',
          response: 'Logs show unusual activity from Samuel Park\'s credentials late last night.',
          consequence: 'clue',
          revealedClues: ['evidence_data_theft'],
          nextSceneId: 'scene_suspect_profiles',
        },
      ],
    },

    scene_suspect_profiles: {
      id: 'scene_suspect_profiles',
      title: 'Investigative Analysis',
      description: 'You profile the suspects and their access levels and motives.',
      backgroundUrl: 'url-to-investigation-room',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_financial_check',
          prompt: 'Check financial records of all suspects',
          response: 'Samuel just received a $2M deposit. The timing is very suspicious.',
          consequence: 'clue',
          revealedClues: ['evidence_bank_deposits'],
          nextSceneId: 'scene_email_analysis',
        },
      ],
    },

    scene_email_analysis: {
      id: 'scene_email_analysis',
      title: 'Email Forensics',
      description: 'Encrypted communications reveal the conspiracy.',
      backgroundUrl: 'url-to-forensics-lab',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_decrypt_emails',
          prompt: 'Decrypt Samuel\'s encrypted messages',
          response: 'Messages to a competitor discuss the algorithm delivery and payment. Case solved!',
          consequence: 'phase',
          revealedClues: ['evidence_suspicious_emails'],
          nextSceneId: 'scene_resolution',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Corporate Criminal Caught',
      description: 'The spy has been apprehended.',
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
      accusedSuspectId: 'suspect_lead_engineer',
      isCorrect: true,
      title: 'Spy Exposed!',
      description: 'Dr. Samuel Park\'s espionage plot was uncovered. The algorithm is recovered.',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_angel_investor',
      isCorrect: false,
      title: 'Wrong Conclusion',
      description: 'The real corporate spy remains undetected. The competitor now has the technology.',
      scoreMultiplier: 0.5,
    },
    {
      id: 'ending_timeout',
      accusedSuspectId: 'none',
      isCorrect: false,
      title: 'Time\'s Up',
      description: 'The investigation ran out of time. The spy escaped.',
      scoreMultiplier: 0.0,
    },
  ],
};
