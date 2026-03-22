import { Scenario } from './types';

/**
 * SCENARIO 11: THE MUSEUM HEIST
 * Priceless artwork stolen from museum storage. Medium difficulty.
 */
export const scenario11_heist: Scenario = {
  id: 'heist_museum',
  title: 'The Museum Heist',
  description: 'Priceless Renaissance paintings vanish from secure museum storage. Who orchestrated the theft?',
  difficulty: 'medium',
  startSceneId: 'scene_museum_basement',
  correctSuspectId: 'suspect_security_chief',

  suspects: [
    {
      id: 'suspect_security_chief',
      name: 'Victor Moralez',
      role: 'Head of Security (GUILTY)',
      portrait: '👮',
      alibi: 'I was monitoring camera feeds in the control room.',
      motivation: 'Paid $1M by art smuggling ring',
      isRedHerring: false,
      evidence: ['evidence_disabled_cameras', 'evidence_smuggler_contact', 'evidence_alarm_override'],
    },
    {
      id: 'suspect_curator',
      name: 'Dr. Katherine Wells',
      role: 'Museum Curator (Innocent)',
      portrait: '🎨',
      alibi: 'I was cataloging new acquisitions in my office.',
      motivation: 'Dedicated to protecting the collection',
      isRedHerring: true,
      evidence: ['evidence_office_logs'],
    },
    {
      id: 'suspect_conservator',
      name: 'Antonio Silva',
      role: 'Art Conservator (Innocent)',
      portrait: '👨‍🎨',
      alibi: 'I was restoring a sculpture on the second floor.',
      motivation: 'Professional conservator, no criminal intent',
      isRedHerring: true,
      evidence: [],
    },
    {
      id: 'suspect_delivery_driver',
      name: 'Brian Foster',
      role: 'Delivery Driver (Innocent)',
      portrait: '🚚',
      alibi: 'I was loading donation items in the loading dock.',
      motivation: 'Normal job duties',
      isRedHerring: true,
      evidence: [],
    },
  ],

  evidence: [
    {
      id: 'evidence_disabled_cameras',
      name: 'Disabled Security Cameras',
      description: 'Multiple camera feeds were disabled using an authorized security override code. Victor has this access.',
      foundAt: 'Security System Logs',
      relevantToSuspects: ['suspect_security_chief'],
      discovered: false,
    },
    {
      id: 'evidence_smuggler_contact',
      name: 'Smuggler Communication',
      description: 'Text messages between Victor and known art smuggler discussing "delivery" and payment.',
      foundAt: 'Phone Records',
      relevantToSuspects: ['suspect_security_chief'],
      discovered: false,
    },
    {
      id: 'evidence_alarm_override',
      name: 'Alarm System Override',
      description: 'The alarm was disarmed using the master code only Victor knows. It was done from inside the control room.',
      foundAt: 'Alarm System Records',
      relevantToSuspects: ['suspect_security_chief'],
      discovered: false,
    },
    {
      id: 'evidence_office_logs',
      name: 'Katherine\'s Work Log',
      description: 'Katherine\'s computer log shows she was actively working on cataloging during the time of the theft.',
      foundAt: 'Computer Timestamps',
      relevantToSuspects: ['suspect_curator'],
      discovered: false,
    },
  ],

  scenes: {
    scene_museum_basement: {
      id: 'scene_museum_basement',
      title: 'Museum Storage Basement',
      description: 'The most secure room in the museum. Yet the paintings vanished without triggering any alarms.',
      backgroundUrl: 'url-to-museum-basement',
      phase: 'investigation',
      characters: [],
      hotspots: [
        {
          id: 'hotspot_vault',
          area: { x: 150, y: 200, width: 200, height: 250 },
          tooltip: 'Secure Storage Vault',
          revealedText: 'The vault was opened with the master security code. Very few people have access.',
          evidenceId: 'evidence_disabled_cameras',
        },
      ],
      dialogueOptions: [
        {
          id: 'choice_check_cameras',
          prompt: 'Request security camera footage',
          response: 'Multiple camera feeds were conveniently disabled during the theft window.',
          consequence: 'clue',
          revealedClues: ['evidence_disabled_cameras'],
          nextSceneId: 'scene_security_investigation',
        },
      ],
    },

    scene_security_investigation: {
      id: 'scene_security_investigation',
      title: 'Security System Analysis',
      description: 'The theft required inside knowledge and special access.',
      backgroundUrl: 'url-to-investigation-room',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_alarm_codes',
          prompt: 'Check who can access the master alarm codes',
          response: 'Only the Head of Security, Victor Moralez, has the master override code.',
          consequence: 'clue',
          revealedClues: ['evidence_alarm_override'],
          nextSceneId: 'scene_communications_check',
        },
      ],
    },

    scene_communications_check: {
      id: 'scene_communications_check',
      title: 'Communications Forensics',
      description: 'Phone records and messages reveal the conspiracy.',
      backgroundUrl: 'url-to-forensics-lab',
      phase: 'investigation',
      characters: [],
      hotspots: [],
      dialogueOptions: [
        {
          id: 'choice_phone_records',
          prompt: 'Subpoena Victor\'s phone records',
          response: 'Text exchanges with art smugglers discussing the paintings and payment. Case solved!',
          consequence: 'solved',
          revealedClues: ['evidence_smuggler_contact'],
          nextSceneId: 'scene_resolution',
        },
      ],
    },

    scene_resolution: {
      id: 'scene_resolution',
      title: 'Heist Solved',
      description: 'The inside man has been caught.',
      backgroundUrl: 'url-to-police-station',
      phase: 'resolution',
      characters: [],
      hotspots: [],
      dialogueOptions: [],
    },
  },

  endings: {
    correct_suspect: {
      emoji: '🎨',
      title: 'Heist Thwarted!',
      description: 'Victor Moralez\'s inside job was exposed. The paintings are recovered.',
    },
    wrong_suspect: {
      emoji: '❌',
      title: 'Wrong Conclusion',
      description: 'The paintings remain missing. The real thief is still out there.',
    },
    timeout: {
      emoji: '⏰',
      title: 'Time\'s Up',
      description: 'The case could not be solved before the paintings reached the black market.',
    },
  },
};
