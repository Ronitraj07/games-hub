import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { IsometricScene, PlayerAvatar, InteractiveObject } from '@/components/shared/IsometricScene';
import { EnhancedScenario, Room, LOCKED_ROOM_ENHANCED } from './enhanced-scenarios';
import { ArrowLeft, Backpack, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlayerEmoji } from '@/lib/auth-config';

const DETECTIVE_CONFIG = {
  gameType: 'detective' as const,
  icon: '🔍',
  gradient: 'from-purple-600 to-indigo-700',
  description: 'Explore detailed crime scenes, collect clues, interrogate suspects, and solve mysteries. 30-40 minutes per case.',
  supportsSolo: true,
  supportsAI: false,
};

interface EnhancedDetectiveGameState {
  scenarioId: string;
  currentRoomId: string;
  phase: 'exploration' | 'interrogation' | 'conclusion';

  // Multiplayer emails
  player1Email?: string;
  player2Email?: string;

  // Multiplayer avatars
  player1Position: { x: number; y: number };
  player2Position: { x: number; y: number };

  // Evidence & Progression
  discoveredEvidenceIds: string[];
  discoveredClues: string[];
  solvedPuzzles: string[];
  visitedRooms: string[];

  // NPC interactions
  npcDialogueProgress: Record<string, string>; // npcId -> currentNodeId

  // Investigation
  suspectSuspicionLevels: Record<string, number>;
  currentlySelectedSuspect?: string;
  accusedSuspectId?: string;

  // Game meta
  startTime: number;
  endTime?: number;
  timeSpent: number;
  investigationAccuracy: number;
  status: 'active' | 'finished';
  mode: 'solo' | 'vs-partner';
  recorded?: boolean;

  // Room state
  interactedObjects: string[]; // objectIds that have been clicked
}

export const Detective: React.FC = () => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'lobby' | 'game'>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [selectedScenario] = useState<EnhancedScenario>(LOCKED_ROOM_ENHANCED);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [gameState, setGameState] = useState<EnhancedDetectiveGameState | null>(null);

  // Firebase sync for multiplayer
  const { gameState: fbGameState, updateGameState } = useRealtimeGame<EnhancedDetectiveGameState>(
    roomId,
    DETECTIVE_CONFIG.gameType,
    null
  );

  useEffect(() => {
    if (fbGameState && mode === 'game') {
      setGameState(fbGameState);
    }
  }, [fbGameState, mode]);

  // Update current room when room ID changes
  useEffect(() => {
    if (selectedScenario && gameState) {
      const room = selectedScenario.rooms.find(r => r.id === gameState.currentRoomId);
      if (room) {
        setCurrentRoom(room);

        // Mark room as visited
        if (!gameState.visitedRooms.includes(room.id)) {
          updateGameStateLocal({
            ...gameState,
            visitedRooms: [...gameState.visitedRooms, room.id],
          });
        }
      }
    }
  }, [gameState?.currentRoomId, selectedScenario]);

  const handleStartSolo = () => {
    setIsHost(true);
    setMode('game');
    initializeGame('solo');
  };

  const handleStartVsPartner = () => {
    setIsHost(true);
    setMode('game');
    setRoomId('DETECTIVE_' + Math.random().toString(36).substr(2, 6));
    initializeGame('vs-partner');
  };

  const initializeGame = (gameMode: 'solo' | 'vs-partner') => {
    const initialState: EnhancedDetectiveGameState = {
      scenarioId: selectedScenario.id,
      currentRoomId: selectedScenario.startRoomId,
      phase: 'exploration',

      player1Email: user?.email || '',
      player2Email: undefined,

      player1Position: { x: 50, y: 70 },
      player2Position: { x: 55, y: 70 },

      discoveredEvidenceIds: [],
      discoveredClues: [],
      solvedPuzzles: [],
      visitedRooms: [selectedScenario.startRoomId],

      npcDialogueProgress: {},
      suspectSuspicionLevels: {},
      interactedObjects: [],

      startTime: Date.now(),
      timeSpent: 0,
      investigationAccuracy: 0,
      status: 'active',
      mode: gameMode,
      recorded: false,
    };

    setGameState(initialState);
    if (gameMode === 'vs-partner' && roomId) {
      updateGameState(initialState);
    }
  };

  const updateGameStateLocal = (newState: EnhancedDetectiveGameState) => {
    setGameState(newState);
    if (newState.mode === 'vs-partner' && roomId) {
      updateGameState(newState);
    }
  };

  const handlePlayerMove = (x: number, y: number) => {
    if (!gameState || !user) return;

    const isPlayer1 = user.email === gameState.player1Email;
    const updatedState = {
      ...gameState,
      [isPlayer1 ? 'player1Position' : 'player2Position']: { x, y },
    };

    updateGameStateLocal(updatedState);
  };

  const handleObjectClick = (objectId: string) => {
    if (!gameState || !currentRoom) return;

    const obj = currentRoom.objects.find(o => o.id === objectId);
    if (!obj) return;

    // Mark as interacted
    if (!gameState.interactedObjects.includes(objectId)) {
      gameState.interactedObjects.push(objectId);
    }

    switch (obj.interactionType) {
      case 'examine':
      case 'pickup':
        if (obj.clueId && !gameState.discoveredEvidenceIds.includes(obj.clueId)) {
          updateGameStateLocal({
            ...gameState,
            discoveredEvidenceIds: [...gameState.discoveredEvidenceIds, obj.clueId],
            discoveredClues: [...gameState.discoveredClues, obj.description || 'New clue discovered!'],
            interactedObjects: gameState.interactedObjects,
          });

          // Show notification
          alert(`🔍 Clue Found: ${obj.name}\n\n${obj.description}`);
        } else if (obj.description) {
          alert(`🔎 ${obj.name}\n\n${obj.description}`);
        }
        break;

      case 'navigate':
        if (obj.navigationTarget) {
          updateGameStateLocal({
            ...gameState,
            currentRoomId: obj.navigationTarget,
            player1Position: { x: 50, y: 70 }, // Reset positions
            player2Position: { x: 55, y: 70 },
          });
        }
        break;

      case 'puzzle':
        if (obj.puzzleId) {
          const puzzle = selectedScenario.puzzles.find(p => p.id === obj.puzzleId);
          if (puzzle && !gameState.solvedPuzzles.includes(obj.puzzleId)) {
            // Simple puzzle prompt (you can expand this with modals)
            const answer = prompt(`🧩 ${obj.name}\n\n${obj.description}\n\nHints:\n${puzzle.hints.join('\n')}\n\nEnter solution:`);

            if (answer && answer.toLowerCase() === puzzle.solution.toString().toLowerCase()) {
              const updatedState = {
                ...gameState,
                solvedPuzzles: [...gameState.solvedPuzzles, obj.puzzleId],
              };

              if (puzzle.rewardClueId && !gameState.discoveredEvidenceIds.includes(puzzle.rewardClueId)) {
                updatedState.discoveredEvidenceIds = [...gameState.discoveredEvidenceIds, puzzle.rewardClueId];
                const evidence = selectedScenario.evidence.find(e => e.id === puzzle.rewardClueId);
                alert(`✅ Puzzle Solved!\n\n🎁 ${evidence?.name}\n${evidence?.description}`);
              } else {
                alert('✅ Puzzle Solved!');
              }

              updateGameStateLocal(updatedState);
            } else {
              alert('❌ Incorrect. Try again later.');
            }
          } else {
            alert('✅ You already solved this puzzle.');
          }
        }
        break;

      case 'talk':
        // NPC dialogue (simplified - you can expand with dialogue tree UI)
        alert(`💬 Talking to NPC at ${obj.name}`);
        break;
    }
  };

  const handleAccuseSuspect = (suspectId: string) => {
    if (!gameState) return;

    const isCorrect = suspectId === selectedScenario.correctSuspectId;
    const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);
    const accuracy = isCorrect ? 100 : Math.max(0, 50 - gameState.visitedRooms.length * 5);

    const finalState: EnhancedDetectiveGameState = {
      ...gameState,
      accusedSuspectId: suspectId,
      investigationAccuracy: accuracy,
      timeSpent,
      status: 'finished',
      endTime: Date.now(),
    };

    updateGameStateLocal(finalState);

    // Record result
    const score = Math.round(accuracy + (gameState.discoveredEvidenceIds.length * 10));
    recordGame({
      gameType: DETECTIVE_CONFIG.gameType,
      playerEmail: user?.email || '',
      result: isCorrect ? 'win' : 'loss',
      score,
      mode: gameState.mode,
    });
  };

  if (mode === 'lobby') {
    return (
      <GameLobby
        gameName="Detective (2.5D Exploration)"
        gameIcon={DETECTIVE_CONFIG.icon}
        gradient={DETECTIVE_CONFIG.gradient}
        description={DETECTIVE_CONFIG.description}
        supportsSolo={DETECTIVE_CONFIG.supportsSolo}
        supportsAI={DETECTIVE_CONFIG.supportsAI}
        gameType={DETECTIVE_CONFIG.gameType}
        onStartSolo={handleStartSolo}
        onStartVsPartner={handleStartVsPartner}
      />
    );
  }

  if (!gameState || !currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-white text-xl">Loading scene...</div>
      </div>
    );
  }

  // Generate player avatars
  const players: PlayerAvatar[] = [
    {
      id: 'player1',
      name: user?.displayName || 'Detective 1',
      x: gameState.player1Position.x,
      y: gameState.player1Position.y,
      color: '#FF6B6B',
      emoji: getPlayerEmoji(user?.email || ''),
    },
  ];

  if (gameState.mode === 'vs-partner') {
    players.push({
      id: 'player2',
      name: 'Detective 2',
      x: gameState.player2Position.x,
      y: gameState.player2Position.y,
      color: '#4ECDC4',
      emoji: '👤',
    });
  }

  // Convert room objects to interactive objects
  const interactiveObjects: InteractiveObject[] = currentRoom.objects.map(obj => ({
    id: obj.id,
    name: obj.name,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    sprite: obj.sprite,
    isDiscovered: obj.clueId ? gameState.interactedObjects.includes(obj.id) : false,
    onClick: () => handleObjectClick(obj.id),
  }));

  const progressPercent = Math.round((gameState.discoveredEvidenceIds.length / selectedScenario.evidence.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-purple-200 hover:text-white transition glass-btn px-4 py-2 rounded-lg"
          >
            <ArrowLeft size={20} /> Back
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{selectedScenario.title}</h1>
            <p className="text-sm text-purple-300">Room: {currentRoom.name}</p>
          </div>

          <button
            onClick={() => setShowInventory(!showInventory)}
            className="flex items-center gap-2 glass-btn px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
          >
            <Backpack size={20} />
            <span className="hidden sm:inline">Evidence ({gameState.discoveredEvidenceIds.length})</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 glass-card p-3 rounded-xl">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-purple-200">Investigation Progress</span>
            <span className="text-purple-100 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-purple-950/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Scene */}
          <div className="lg:col-span-3">
            <IsometricScene
              title={currentRoom.name}
              description={currentRoom.description}
              layers={currentRoom.backgroundLayers}
              objects={interactiveObjects}
              players={players}
              onPlayerMove={handlePlayerMove}
              onObjectClick={handleObjectClick}
              allowMovement={gameState.status === 'active'}
            />

            {/* Room Info */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="glass-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-purple-200 text-sm">
                  <MapPin size={16} />
                  <span>Rooms Visited: {gameState.visitedRooms.length}/{selectedScenario.rooms.length}</span>
                </div>
              </div>
              <div className="glass-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-purple-200 text-sm">
                  <User size={16} />
                  <span>Players: {gameState.mode === 'solo' ? '1' : '2'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Evidence Inventory */}
            {(showInventory || gameState.discoveredEvidenceIds.length > 0) && (
              <div className="glass-card p-4 rounded-xl">
                <h3 className="font-bold text-white mb-3 flex items-center justify-between">
                  📋 Evidence
                  <span className="text-xs bg-purple-600/50 px-2 py-1 rounded-full">
                    {gameState.discoveredEvidenceIds.length}
                  </span>
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedScenario.evidence
                    .filter(e => gameState.discoveredEvidenceIds.includes(e.id))
                    .map(evidence => (
                      <div
                        key={evidence.id}
                        className="p-3 rounded-lg bg-green-600/20 border border-green-500/30 text-green-100 text-sm"
                      >
                        <div className="font-medium">✓ {evidence.name}</div>
                        <p className="text-xs text-green-200 mt-1">{evidence.description}</p>
                      </div>
                    ))}
                  {gameState.discoveredEvidenceIds.length === 0 && (
                    <p className="text-purple-300 text-sm text-center py-4">No evidence collected yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Suspects */}
            {gameState.phase === 'conclusion' || gameState.discoveredEvidenceIds.length >= 5 && (
              <div className="glass-card p-4 rounded-xl">
                <h3 className="font-bold text-white mb-3">🕵️ Make Accusation</h3>
                <div className="space-y-2">
                  {selectedScenario.suspects.map(suspect => (
                    <button
                      key={suspect.id}
                      onClick={() => {
                        if (gameState.status === 'active') {
                          if (confirm(`Accuse ${suspect.name}?\n\nThis will end the investigation!`)) {
                            handleAccuseSuspect(suspect.id);
                          }
                        }
                      }}
                      disabled={gameState.status === 'finished'}
                      className={`w-full text-left p-3 rounded-lg text-sm transition ${
                        gameState.accusedSuspectId === suspect.id
                          ? suspect.id === selectedScenario.correctSuspectId
                            ? 'bg-green-600/40 border-2 border-green-400'
                            : 'bg-red-600/40 border-2 border-red-400'
                          : 'bg-purple-700/30 hover:bg-purple-600/40 border border-purple-500/30'
                      } ${gameState.status === 'finished' ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white">{suspect.portrait} {suspect.name}</span>
                      </div>
                      <p className="text-xs text-purple-200 mt-1">{suspect.bio}</p>
                    </button>
                  ))}
                </div>
                {gameState.discoveredEvidenceIds.length < 5 && (
                  <p className="text-xs text-yellow-300 mt-3">
                    Collect at least 5 pieces of evidence before making an accusation.
                  </p>
                )}
              </div>
            )}

            {/* Result */}
            {gameState.status === 'finished' && (
              <div className={`glass-card p-4 rounded-xl border-2 ${
                gameState.accusedSuspectId === selectedScenario.correctSuspectId
                  ? 'border-green-500 bg-green-600/10'
                  : 'border-red-500 bg-red-600/10'
              }`}>
                <div className="text-center space-y-3">
                  {gameState.accusedSuspectId === selectedScenario.correctSuspectId ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
                      <div>
                        <h4 className="font-bold text-green-300 text-lg">Case Solved! 🎉</h4>
                        <p className="text-sm text-green-200 mt-2">
                          {selectedScenario.endings.find(e => e.condition === 'correct')?.description}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-10 h-10 text-red-400 mx-auto" />
                      <div>
                        <h4 className="font-bold text-red-300 text-lg">Wrong Suspect!</h4>
                        <p className="text-sm text-red-200 mt-2">
                          {selectedScenario.endings.find(e => e.condition === 'wrong')?.description}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="pt-3 border-t border-white/10 space-y-1 text-xs">
                    <p className="text-gray-300">Time: <span className="text-blue-300 font-semibold">{Math.floor(gameState.timeSpent / 60)} min {gameState.timeSpent % 60}s</span></p>
                    <p className="text-gray-300">Evidence: <span className="text-purple-300 font-semibold">{gameState.discoveredEvidenceIds.length}/{selectedScenario.evidence.length}</span></p>
                    <p className="text-gray-300">Rooms: <span className="text-pink-300 font-semibold">{gameState.visitedRooms.length}/{selectedScenario.rooms.length}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
