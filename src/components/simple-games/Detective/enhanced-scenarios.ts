// Extended Detective Scene Types for 2.5D Exploration

export interface Room {
  id: string;
  name: string;
  description: string;
  backgroundLayers: Array<{
    id: string;
    color?: string;
    imageUrl?: string;
    depth: number;
    parallaxSpeed?: number;
  }>;
  objects: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    sprite: string;
    interactionType: 'examine' | 'pickup' | 'talk' | 'puzzle' | 'navigate';
    clueId?: string;
    puzzleId?: string;
    navigationTarget?: string; // Room ID to navigate to
    description?: string;
    dialogueLines?: string[];
  }>;
  npcs?: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    sprite: string;
    color: string;
    dialogueTree: DialogueNode[];
  }>;
  ambientSound?: string;
  estimatedExplorationTime?: number; // minutes
}

export interface DialogueNode {
  id: string;
  text: string;
  speaker: 'npc' | 'player';
  options?: Array<{
    id: string;
    text: string;
    nextNodeId?: string;
    revealClueId?: string;
    increaseSuspicion?: boolean;
  }>;
}

export interface MiniPuzzle {
  id: string;
  type: 'lockpick' | 'code' | 'pattern' | 'sequence' | 'riddle';
  difficulty: 'easy' | 'medium' | 'hard';
  solution: string | number | string[];
  hints: string[];
  rewardClueId?: string;
}

export interface EnhancedScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // Total minutes
  startRoomId: string;
  rooms: Room[];
  puzzles: MiniPuzzle[];
  evidence: Array<{
    id: string;
    name: string;
    description: string;
    foundInRoomId: string;
    requiresPuzzle?: boolean;
  }>;
  suspects: Array<{
    id: string;
    name: string;
    portrait: string;
    bio: string;
    roomLocations: string[]; // Rooms where they can be found
    suspicionTriggers: string[]; // Evidence IDs that increase suspicion
  }>;
  correctSuspectId: string;
  endings: Array<{
    id: string;
    title: string;
    description: string;
    condition: 'correct' | 'wrong' | 'incomplete';
  }>;
}

// Example: Detailed "Locked Room Mystery" with 30-40 min exploration
export const LOCKED_ROOM_ENHANCED: EnhancedScenario = {
  id: 'locked_room_enhanced',
  title: 'The Locked Room Murder',
  description: 'A wealthy businessman found dead in his locked study. Explore the mansion, interrogate suspects, and solve the mystery.',
  difficulty: 'hard',
  estimatedTime: 35,
  startRoomId: 'entrance_hall',
  rooms: [
    {
      id: 'entrance_hall',
      name: 'Entrance Hall',
      description: 'A grand marble hall with a chandelier. Doors lead to different parts of the mansion.',
      backgroundLayers: [
        { id: 'bg', color: '#2c1810', depth: 0 },
        { id: 'floor', color: '#8b7355', depth: 10 },
        { id: 'walls', color: '#4a3020', depth: 5, parallaxSpeed: 0.5 },
      ],
      objects: [
        {
          id: 'front_door',
          name: 'Front Door',
          x: 50,
          y: 85,
          width: 60,
          height: 80,
          sprite: '🚪',
          interactionType: 'examine',
          description: 'The main entrance. Locked from the inside.',
        },
        {
          id: 'chandelier',
          name: 'Chandelier',
          x: 50,
          y: 20,
          width: 80,
          height: 60,
          sprite: '💡',
          interactionType: 'examine',
          description: 'An ornate crystal chandelier. Nothing unusual.',
        },
        {
          id: 'coat_rack',
          name: 'Coat Rack',
          x: 15,
          y: 60,
          width: 40,
          height: 50,
          sprite: '🧥',
          interactionType: 'examine',
          clueId: 'muddy_coat',
          description: 'Several coats hang here. One has fresh mud on it.',
        },
        {
          id: 'study_door',
          name: 'Study Door',
          x: 80,
          y: 50,
          width: 50,
          height: 70,
          sprite: '🔒',
          interactionType: 'navigate',
          navigationTarget: 'study',
          description: 'The door to the study. Crime scene.',
        },
        {
          id: 'living_room_door',
          name: 'Living Room',
          x: 20,
          y: 50,
          width: 50,
          height: 70,
          sprite: '🚪',
          interactionType: 'navigate',
          navigationTarget: 'living_room',
        },
        {
          id: 'kitchen_door',
          name: 'Kitchen Door',
          x: 50,
          y: 35,
          width: 50,
          height: 70,
          sprite: '🚪',
          interactionType: 'navigate',
          navigationTarget: 'kitchen',
        },
      ],
      estimatedExplorationTime: 3,
    },
    {
      id: 'study',
      name: 'Locked Study (Crime Scene)',
      description: 'The victim was found here. Window locked from inside, door locked from outside.',
      backgroundLayers: [
        { id: 'bg', color: '#1a0f0a', depth: 0 },
        { id: 'floor', color: '#5c4033', depth: 10 },
        { id: 'shelves', color: '#3d2817', depth: 5, parallaxSpeed: 0.3 },
      ],
      objects: [
        {
          id: 'body_outline',
          name: 'Body Outline',
          x: 40,
          y: 60,
          width: 80,
          height: 60,
          sprite: '⚰️',
          interactionType: 'examine',
          clueId: 'body_position',
          description: 'Chalk outline. Victim fell backward from desk.',
        },
        {
          id: 'desk',
          name: 'Mahogany Desk',
          x: 60,
          y: 45,
          width: 100,
          height: 80,
          sprite: '🪑',
          interactionType: 'examine',
          clueId: 'torn_letter',
          description: 'A heavy desk. A torn letter is in the drawer.',
        },
        {
          id: 'window',
          name: 'Locked Window',
          x: 85,
          y: 30,
          width: 60,
          height: 80,
          sprite: '🪟',
          interactionType: 'examine',
          clueId: 'window_lock',
          description: 'Window locked from inside. No signs of forced entry.',
        },
        {
          id: 'bookshelf',
          name: 'Bookshelf',
          x: 15,
          y: 40,
          width: 80,
          height: 120,
          sprite: '📚',
          interactionType: 'puzzle',
          puzzleId: 'bookshelf_code',
          description: 'A tall bookshelf. Some books are out of place.',
        },
        {
          id: 'safe',
          name: 'Wall Safe',
          x: 25,
          y: 25,
          width: 50,
          height: 50,
          sprite: '🔐',
          interactionType: 'puzzle',
          puzzleId: 'safe_combination',
          description: 'A locked safe behind a painting. Requires combination.',
        },
        {
          id: 'coffee_cup',
          name: 'Coffee Cup',
          x: 55,
          y: 50,
          width: 30,
          height: 30,
          sprite: '☕',
          interactionType: 'pickup',
          clueId: 'poisoned_coffee',
          description: 'Half-empty coffee cup. Strange smell.',
        },
        {
          id: 'exit_door',
          name: 'Back to Hall',
          x: 10,
          y: 75,
          width: 50,
          height: 70,
          sprite: '🚪',
          interactionType: 'navigate',
          navigationTarget: 'entrance_hall',
        },
      ],
      estimatedExplorationTime: 12,
    },
    {
      id: 'living_room',
      name: 'Living Room',
      description: 'Comfortable sitting area with fireplace. Suspects were here during the incident.',
      backgroundLayers: [
        { id: 'bg', color: '#2a1506', depth: 0 },
        { id: 'carpet', color: '#8b0000', depth: 10 },
        { id: 'furniture', color: '#4a2010', depth: 5, parallaxSpeed: 0.4 },
      ],
      objects: [
        {
          id: 'fireplace',
          name: 'Fireplace',
          x: 50,
          y: 25,
          width: 100,
          height: 80,
          sprite: '🔥',
          interactionType: 'examine',
          clueId: 'burned_documents',
          description: 'Active fire. Ashes of burned documents visible.',
        },
        {
          id: 'wine_glasses',
          name: 'Wine Glasses',
          x: 65,
          y: 55,
          width: 40,
          height: 30,
          sprite: '🍷',
          interactionType: 'examine',
          clueId: 'fingerprints',
          description: 'Three wine glasses. One has lipstick marks.',
        },
        {
          id: 'sofa',
          name: 'Red Sofa',
          x: 40,
          y: 60,
          width: 120,
          height: 80,
          sprite: '🛋️',
          interactionType: 'examine',
          description: 'A plush sofa. Cushions recently disturbed.',
        },
        {
          id: 'phone',
          name: 'Telephone',
          x: 75,
          y: 70,
          width: 35,
          height: 35,
          sprite: '☎️',
          interactionType: 'examine',
          clueId: 'phone_log',
          description: 'Landline phone. Recent call log shows mysterious number.',
        },
        {
          id: 'exit',
          name: 'Back to Hall',
          x: 10,
          y: 75,
          width: 50,
          height: 70,
          sprite: '🚪',
          interactionType: 'navigate',
          navigationTarget: 'entrance_hall',
        },
      ],
      npcs: [
        {
          id: 'butler',
          name: 'James the Butler',
          x: 30,
          y: 50,
          sprite: '🤵',
          color: '#333333',
          dialogueTree: [
            {
              id: 'greeting',
              speaker: 'npc',
              text: 'Good evening, detective. I was serving tea when I heard the commotion.',
              options: [
                {
                  id: 'ask_time',
                  text: 'What time did you hear it?',
                  nextNodeId: 'time_response',
                },
                {
                  id: 'ask_access',
                  text: 'Who had access to the study?',
                  nextNodeId: 'access_response',
                  revealClueId: 'key_holders',
                },
              ],
            },
            {
              id: 'time_response',
              speaker: 'npc',
              text: 'Around 8:45 PM. I rushed to the study immediately.',
            },
            {
              id: 'access_response',
              speaker: 'npc',
              text: 'Only three people had keys: the victim, his wife, and... well, myself.',
            },
          ],
        },
      ],
      estimatedExplorationTime: 10,
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      description: 'Modern kitchen. Food preparation area and staff quarters access.',
      backgroundLayers: [
        { id: 'bg', color: '#f5f5dc', depth: 0 },
        { id: 'floor', color: '#d3d3d3', depth: 10 },
        { id: 'counters', color: '#ffffff', depth: 5, parallaxSpeed: 0.2 },
      ],
      objects: [
        {
          id: 'knife_block',
          name: 'Knife Block',
          x: 60,
          y: 50,
          width: 40,
          height: 50,
          sprite: '🔪',
          interactionType: 'examine',
          clueId: 'missing_knife',
          description: 'Set of kitchen knives. One is missing.',
        },
        {
          id: 'poison_bottle',
          name: 'Cleaning Supplies',
          x: 25,
          y: 40,
          width: 50,
          height: 60,
          sprite: '🧪',
          interactionType: 'pickup',
          clueId: 'rat_poison',
          description: 'Cabinet under sink. Rat poison container recently opened.',
        },
        {
          id: 'recipe_book',
          name: 'Recipe Book',
          x: 70,
          y: 35,
          width: 40,
          height: 40,
          sprite: '📖',
          interactionType: 'examine',
          clueId: 'recipe_note',
          description: 'Coffee recipe with handwritten note about "special ingredient".',
        },
        {
          id: 'exit',
          name: 'Back to Hall',
          x: 10,
          y: 75,
          width: 50,
          height: 70,
          sprite: '🚪',
          interactionType: 'navigate',
          navigationTarget: 'entrance_hall',
        },
      ],
      estimatedExplorationTime: 8,
    },
  ],
  puzzles: [
    {
      id: 'safe_combination',
      type: 'code',
      difficulty: 'medium',
      solution: '1892',
      hints: [
        'Check the painting dates on the wall',
        'The victim was born in 1892',
        'Birth year might be the combination',
      ],
      rewardClueId: 'will_document',
    },
    {
      id: 'bookshelf_code',
      type: 'sequence',
      difficulty: 'easy',
      solution: ['red', 'blue', 'green'],
      hints: [
        'Three books are out of order',
        'Color-coded spines spell a name',
        'Arrange by rainbow order',
      ],
      rewardClueId: 'secret_ledger',
    },
  ],
  evidence: [
    { id: 'muddy_coat', name: 'Muddy Coat', description: 'Fresh mud on coat. Recent outdoor activity.', foundInRoomId: 'entrance_hall' },
    { id: 'body_position', name: 'Body Position', description: 'Fell backward, not forward. Surprised by attacker.', foundInRoomId: 'study' },
    { id: 'poisoned_coffee', name: 'Poisoned Coffee', description: 'Coffee contains traces of rat poison.', foundInRoomId: 'study' },
    { id: 'torn_letter', name: 'Torn Letter', description: 'Blackmail letter torn in half.', foundInRoomId: 'study' },
    { id: 'window_lock', name: 'Window Lock', description: 'Locked from inside. No external entry possible.', foundInRoomId: 'study' },
    { id: 'phone_log', name: 'Phone Log', description: 'Call to unknown number at 8:30 PM.', foundInRoomId: 'living_room' },
    { id: 'burned_documents', name: 'Burned Documents', description: 'Financial records destroyed.', foundInRoomId: 'living_room' },
    { id: 'rat_poison', name: 'Rat Poison', description: 'Recently opened container.', foundInRoomId: 'kitchen' },
    { id: 'missing_knife', name: 'Missing Knife', description: 'One knife from set is gone.', foundInRoomId: 'kitchen', requiresPuzzle: false },
    { id: 'will_document', name: 'Last Will', description: 'Victim changed will recently, cutting out spouse.', foundInRoomId: 'study', requiresPuzzle: true },
  ],
  suspects: [
    {
      id: 'wife',
      name: 'Victoria (Wife)',
      portrait: '👩',
      bio: 'Recently discovered husband changed will.',
      roomLocations: ['living_room', 'entrance_hall'],
      suspicionTriggers: ['will_document', 'rat_poison', 'phone_log'],
    },
    {
      id: 'butler',
      name: 'James (Butler)',
      portrait: '🤵',
      bio: 'Had key to study. Financial troubles.',
      roomLocations: ['living_room', 'kitchen'],
      suspicionTriggers: ['muddy_coat', 'key_holders'],
    },
    {
      id: 'business_partner',
      name: 'Richard (Partner)',
      portrait: '👔',
      bio: 'Business disputes with victim.',
      roomLocations: ['study', 'living_room'],
      suspicionTriggers: ['burned_documents', 'torn_letter'],
    },
  ],
  correctSuspectId: 'wife',
  endings: [
    {
      id: 'ending_correct',
      title: 'Case Solved!',
      description: 'You correctly identified Victoria as the murderer. She poisoned his coffee after discovering the changed will.',
      condition: 'correct',
    },
    {
      id: 'ending_wrong',
      title: 'Wrong Suspect',
      description: 'The real killer escaped justice. Victoria was the murderer all along.',
      condition: 'wrong',
    },
  ],
};
