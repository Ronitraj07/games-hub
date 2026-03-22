import { Scenario } from '../types';

/**
 * SCENARIO 4: CORPORATE FRAUD
 * Millions have disappeared from company accounts. Find the embezzler.
 */
export const scenario4_fraud: Scenario = {
  id: 'corporate_fraud',
  title: 'Embezzlement Investigation',
  description: 'Millions disappeared from the company. Find who stole it.',
  difficulty: 'hard',
  startSceneId: 'scene_arrival',
  correctSuspectId: 'suspect_cfo',

  suspects: [
    {
      id: 'suspect_cfo',
      name: 'Victoria CFO',
      role: 'CFO (GUILTY)',
      portrait: '👩‍💼',
      alibi: 'I was in financial meetings all week.',
      motivation: 'Building secret retirement account',
      isRedHerring: false,
      evidence: ['evidence_fake_invoices', 'evidence_offshore_account'],
    },
    {
      id: 'suspect_accountant',
      name: 'Robert Accountant',
      role: 'Senior Accountant (Innocent)',
      portrait: '👨‍💻',
      alibi: 'I was processing normal transactions.',
      motivation: 'Recently passed promotion to someone else',
      isRedHerring: true,
      evidence: ['evidence_irregular_access'],
    },
    {
      id: 'suspect_it_director',
      name: 'David IT',
      role: 'IT Director (Innocent)',
      portrait: '👨‍💻',
      alibi: 'I was managing server infrastructure.',
      motivation: 'None (good record)',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_fake_invoices',
      name: 'Fake Invoices',
      description: 'Invoices from shell companies created by Victoria.',
      foundAt: 'Accounting Records',
      relevantToSuspects: ['suspect_cfo'],
      discovered: false,
    },
    {
      id: 'evidence_offshore_account',
      name: 'Offshore Account',
      description: 'Victoria has a secret account in the Cayman Islands with millions.',
      foundAt: 'Bank Records',
      relevantToSuspects: ['suspect_cfo'],
      discovered: false,
    },
    {
      id: 'evidence_irregular_access',
      name: 'System Access Logs',
      description: 'Robert accessed the accounts after hours but for normal maintenance.',
      foundAt: 'IT Logs',
      relevantToSuspects: ['suspect_accountant'],
      discovered: false,
    },
  ],

  scenes: {
    scene_arrival: {
      id: 'scene_arrival',
      title: 'Fraud Discovery',
      description: 'Audit reveals millions missing from company accounts.',
      backgroundUrl: 'url-to-office',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_accounting',
          area: { x: 100, y: 150, width: 200, height: 300 },
          tooltip: 'Accounting Department',
          revealedText: 'You discover shell company invoices with Victoria\'s signature.',
          evidenceId: 'evidence_fake_invoices',
        },
        {
          id: 'hotspot_bank_records',
          area: { x: 400, y: 200, width: 150, height: 250 },
          tooltip: 'Bank Records',
          revealedText: 'Victoria has a secret offshore account with all the stolen funds.',
          evidenceId: 'evidence_offshore_account',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_audit_records',
          prompt: 'Audit the accounting records',
          response: 'Shell companies appear in the system. Traced to Victoria.',
          consequence: 'clue',
          revealedClues: ['evidence_fake_invoices'],
          nextSceneId: 'scene_interrogation',
        },
        {
          id: 'choice_check_banks',
          prompt: 'Contact international banks',
          response: 'You find Victoria\'s offshore account with the millions.',
          consequence: 'clue',
          revealedClues: ['evidence_offshore_account'],
          nextSceneId: 'scene_interrogation',
        },
      ],
    },

    scene_interrogation: {
      id: 'scene_interrogation',
      title: 'Executive Interrogation',
      description: 'Question the suspects about the missing millions.',
      backgroundUrl: 'url-to-interview-room',
      phase: 'interrogation',
      characters: [
        { id: 'suspect_cfo', name: 'Victoria', role: 'suspect', portraitUrl: '👩‍💼' },
        { id: 'suspect_accountant', name: 'Robert', role: 'suspect', portraitUrl: '👨‍💻' },
      ],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_accuse_victoria',
          prompt: 'Accuse Victoria of embezzlement',
          response: 'Victoria\'s lawyer immediately advises her to remain silent. Case is clear.',
          consequence: 'phase',
          nextSceneId: 'scene_ending_correct',
        },
        {
          id: 'choice_accuse_robert',
          prompt: 'Accuse Robert',
          response: 'Robert proves his innocence with system access logs. Victoria disappears.',
          consequence: 'phase',
          nextSceneId: 'scene_ending_wrong',
        },
      ],
    },

    scene_ending_correct: {
      id: 'scene_ending_correct',
      title: 'Arrest',
      description: 'Victoria is arrested for corporate embezzlement.',
      backgroundUrl: 'url-to-arrest',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },

    scene_ending_wrong: {
      id: 'scene_ending_wrong',
      title: 'Criminal Escapes',
      description: 'Victoria fled the country with the stolen funds.',
      backgroundUrl: 'url-to-end',
      phase: 'conclusion',
      characters: [],
      hotspots: [],
    },
  },

  endings: [
    {
      id: 'ending_correct',
      accusedSuspectId: 'suspect_cfo',
      isCorrect: true,
      title: 'Justice Served',
      description: 'Victoria is arrested and the funds are recovered.',
      scoreMultiplier: 1.0,
    },
    {
      id: 'ending_wrong',
      accusedSuspectId: 'suspect_accountant',
      isCorrect: false,
      title: 'Criminal Escapes',
      description: 'The real embezzler fled to avoid prosecution.',
      scoreMultiplier: 0.3,
    },
  ],

  estimatedTime: 25,
};
