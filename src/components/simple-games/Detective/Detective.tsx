import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { ThreeScene } from '@/components/shared/ThreeScene';
import { DetectiveGameState, Scenario, Scene, EvidenceItem } from './types';
import { SCENARIOS } from './scenarios';
import { ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DETECTIVE_CONFIG = {
  gameType: 'detective' as const,
  icon: '🔍',
  gradient: 'from-purple-600 to-indigo-700',
  description: 'Solve mysteries through investigation, evidence collection, and logical deduction.',
  supportsSolo: true,
  supportsAI: false,
};

// Helper function to map scenarios and scenes to 3D scene types
function getSceneType(scenarioId: string, sceneId: string): 'office' | 'mansion' | 'street' | 'museum' | 'laboratory' {
  // Map based on scenario themes
  if (scenarioId.includes('pearl') || scenarioId.includes('theft')) return 'museum';
  if (scenarioId.includes('mansion') || scenarioId.includes('locked')) return 'mansion';
  if (scenarioId.includes('corporate') || scenarioId.includes('embezzlement')) return 'office';
  if (scenarioId.includes('identity') || scenarioId.includes('espionage')) return 'laboratory';
  if (scenarioId.includes('street') || scenarioId.includes('blackmail')) return 'street';

  // Default fallback based on scene type
  if (sceneId.includes('office')) return 'office';
  if (sceneId.includes('museum')) return 'museum';
  if (sceneId.includes('mansion') || sceneId.includes('house')) return 'mansion';
  if (sceneId.includes('lab')) return 'laboratory';
  if (sceneId.includes('street') || sceneId.includes('outdoor')) return 'street';

  return 'office'; // Default
}

// Helper function to get lighting based on scenario
function getLighting(scenarioId: string): 'day' | 'night' | 'dim' {
  if (scenarioId.includes('night') || scenarioId.includes('locked')) return 'night';
  if (scenarioId.includes('dim') || scenarioId.includes('mystery')) return 'dim';
  return 'day';
}

// Helper function to assign colors to suspects
function getSuspectColor(index: number): string {
  const colors = [
    '#e74c3c', // Red
    '#3498db', // Blue
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Teal
  ];
  return colors[index % colors.length];
}

export const Detective: React.FC = () => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'lobby' | 'game'>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [gameState, setGameState] = useState<DetectiveGameState | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(false);

  // Firebase sync for multiplayer
  const { gameState: fbGameState, updateGameState, loading: fbLoading } = useRealtimeGame<DetectiveGameState>(
    roomId,
    DETECTIVE_CONFIG.gameType,
    null
  );

  useEffect(() => {
    if (fbGameState && mode === 'game') {
      setGameState(fbGameState);
    }
  }, [fbGameState, mode]);

  // Update current scene when scenario or game state changes
  useEffect(() => {
    if (selectedScenario && gameState) {
      const scene = selectedScenario.scenes[gameState.currentSceneId];
      if (scene) {
        setCurrentScene(scene);
      }
    }
  }, [selectedScenario, gameState?.currentSceneId]);

  const handleStartSolo = () => {
    setIsHost(true);
    setMode('game');
    const scenario = SCENARIOS[Object.keys(SCENARIOS)[0]];
    if (scenario) {
      setSelectedScenario(scenario);
      initializeGame(scenario, 'solo');
    }
  };

  const handleStartVsPartner = () => {
    setIsHost(true);
    setMode('game');
    // In a real app, this would create a room code
    setRoomId('DETECTIVE_' + Math.random().toString(36).substr(2, 6));
    const scenario = SCENARIOS[Object.keys(SCENARIOS)[0]];
    if (scenario) {
      setSelectedScenario(scenario);
      initializeGame(scenario, 'vs-partner');
    }
  };

  const initializeGame = (scenario: Scenario, gameMode: 'solo' | 'vs-partner') => {
    const initialState: DetectiveGameState = {
      scenarioId: scenario.id,
      currentSceneId: scenario.startSceneId,
      phase: 'investigation',
      visitedLocations: [],
      evidence: scenario.evidence,
      discoveredEvidenceIds: [],
      interviewedSuspects: {},
      suspectSuspicionLevels: {},
      choicesMade: [],
      investigationAccuracy: 0,
      timeSpent: 0,
      cluesCollected: 0,
      status: 'active',
      mode: gameMode,
      startTime: Date.now(),
      recorded: false,
    };

    setGameState(initialState);
    if (gameMode === 'vs-partner' && roomId) {
      updateGameState(initialState);
    }
  };

  const handleDiscoverEvidence = (evidenceId: string) => {
    if (!gameState || !selectedScenario) return;

    const evidence = selectedScenario.evidence.find(e => e.id === evidenceId);
    if (!evidence || gameState.discoveredEvidenceIds.includes(evidenceId)) return;

    const updatedState = {
      ...gameState,
      discoveredEvidenceIds: [...gameState.discoveredEvidenceIds, evidenceId],
      cluesCollected: gameState.cluesCollected + 1,
    };

    setGameState(updatedState);
    if (gameState.mode === 'vs-partner' && roomId) {
      updateGameState(updatedState);
    }
  };

  const handleMakeChoice = (choiceId: string, nextSceneId?: string) => {
    if (!gameState || !selectedScenario) return;

    const updatedState = {
      ...gameState,
      choicesMade: [
        ...gameState.choicesMade,
        { sceneId: gameState.currentSceneId, choiceId, timestamp: Date.now() },
      ],
      currentSceneId: nextSceneId || gameState.currentSceneId,
    };

    if (nextSceneId === 'scene_conclusion') {
      updatedState.phase = 'conclusion';
    }

    setGameState(updatedState);
    if (gameState.mode === 'vs-partner' && roomId) {
      updateGameState(updatedState);
    }
  };

  const handleAccuseSuspect = (suspectId: string) => {
    if (!gameState || !selectedScenario) return;

    const isCorrect = suspectId === selectedScenario.correctSuspectId;
    const endingId = isCorrect ? 'ending_correct' : 'ending_wrong';

    const accuracy = isCorrect ? 100 : Math.max(0, 100 - gameState.choicesMade.length * 10);
    const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);

    const finalState = {
      ...gameState,
      accusedSuspectId: suspectId,
      endingId,
      investigationAccuracy: accuracy,
      timeSpent,
      status: 'finished' as const,
      endTime: Date.now(),
    };

    setGameState(finalState);

    // Record result
    const score = Math.round(accuracy * (100 / timeSpent) * (gameState.cluesCollected * 5));
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
        gameName="Detective"
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

  if (!gameState || !currentScene || !selectedScenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <Loader className="w-8 h-8 text-purple-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-purple-200 hover:text-white transition"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-white">{selectedScenario.title}</h1>
          <div className="text-right">
            <p className="text-sm text-purple-300">Phase: {gameState.phase}</p>
            <p className="text-sm text-purple-300">Clues: {gameState.cluesCollected}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Scene Display with 3D Rendering */}
          <div className="lg:col-span-3">
            {/* Scene title & description */}
            <div className="glass-card p-4 rounded-2xl mb-4 bg-gradient-to-r from-purple-800/40 to-indigo-800/40 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-2">{currentScene.title}</h2>
              <p className="text-sm text-purple-200">{currentScene.description}</p>
            </div>

            {/* 3D Scene with Three.js */}
            <ThreeScene
              sceneType={getSceneType(selectedScenario.id, currentScene.id)}
              characters={selectedScenario.suspects.map((suspect, idx) => {
                const suspicion = gameState.suspectSuspicionLevels[suspect.id] || 0;
                const emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'suspicious' =
                  suspicion > 70 ? 'suspicious' :
                  suspicion > 50 ? 'angry' :
                  'neutral';

                // Position characters in 3D space (spread them out)
                const positions = [
                  { x: -4, y: 0, z: 2 },   // Left
                  { x: 0, y: 0, z: 0 },    // Center
                  { x: 4, y: 0, z: 2 },    // Right
                  { x: -2, y: 0, z: 5 },   // Back left
                  { x: 2, y: 0, z: 5 },    // Back right
                ];

                return {
                  name: suspect.name,
                  position: positions[idx] || positions[0],
                  color: getSuspectColor(idx),
                  emotion,
                };
              })}
              lighting={getLighting(selectedScenario.id)}
              onCharacterClick={(characterName) => {
                const suspect = selectedScenario.suspects.find(s => s.name === characterName);
                if (suspect && gameState.status !== 'finished') {
                  setGameState({
                    ...gameState,
                    currentlySelectedSuspect: suspect.id,
                  });
                }
              }}
              className="mb-6 h-96"
            />

            {/* Investigation hotspots */}
            {gameState.phase === 'investigation' && currentScene.hotspots.length > 0 && (
              <div className="glass-card p-6 rounded-2xl mb-6">
                <h3 className="text-lg font-semibold text-purple-200 mb-4">🔍 Investigation Points</h3>
                <div className="grid grid-cols-2 gap-2">
                  {currentScene.hotspots.map(hotspot => (
                    <button
                      key={hotspot.id}
                      onClick={() => hotspot.evidenceId && handleDiscoverEvidence(hotspot.evidenceId)}
                      className={`p-3 rounded-lg transition text-sm font-medium ${
                        hotspot.evidenceId && gameState.discoveredEvidenceIds.includes(hotspot.evidenceId)
                          ? 'bg-green-600/30 border border-green-500 text-green-200'
                          : 'bg-purple-700/40 hover:bg-purple-600/50 border border-purple-500/50 text-purple-100'
                      }`}
                    >
                      {hotspot.tooltip}
                      {hotspot.evidenceId && gameState.discoveredEvidenceIds.includes(hotspot.evidenceId) && (
                        <CheckCircle className="inline ml-2 w-3 h-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Choices */}
            {currentScene.dialogueOptions && currentScene.dialogueOptions.length > 0 && (
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-purple-200 mb-4">💭 What will you do?</h3>
                <div className="space-y-3">
                  {currentScene.dialogueOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleMakeChoice(option.id, option.nextSceneId)}
                      className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-600/50 to-indigo-600/50 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition transform hover:scale-102 border border-purple-400/30"
                    >
                      {option.prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Evidence & Suspects */}
          <div className="lg:col-span-1 space-y-6">
            {/* Game Status */}
            <div className="glass-card p-4 rounded-2xl bg-gradient-to-br from-purple-700/30 to-indigo-700/30 border border-purple-500/30">
              <h3 className="font-bold text-white mb-3">📊 Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Phase:</span>
                  <span className="font-semibold text-purple-100 capitalize">{gameState.phase}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Clues Found:</span>
                  <span className="font-semibold text-yellow-300">{gameState.cluesCollected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Suspicion:</span>
                  <span className="font-semibold text-red-300">{Object.keys(gameState.suspectSuspicionLevels).length}</span>
                </div>
              </div>
            </div>

            {/* Evidence Inventory */}
            <div className="glass-card p-4 rounded-2xl">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                📋 Evidence
                <span className="text-xs bg-purple-600/50 px-2 py-1 rounded-full">
                  {gameState.discoveredEvidenceIds.length}/{selectedScenario.evidence.length}
                </span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedScenario.evidence.map(evidence => (
                  <div
                    key={evidence.id}
                    className={`p-3 rounded-lg text-sm transition ${
                      gameState.discoveredEvidenceIds.includes(evidence.id)
                        ? 'bg-green-600/20 border border-green-500/30 text-green-100'
                        : 'bg-purple-700/20 border border-purple-500/20 text-purple-300'
                    }`}
                  >
                    <div className="font-medium">{gameState.discoveredEvidenceIds.includes(evidence.id) ? '✓' : '?'} {evidence.name}</div>
                    {gameState.discoveredEvidenceIds.includes(evidence.id) && (
                      <p className="text-xs text-green-200 mt-1">{evidence.description.substring(0, 50)}...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Suspects */}
            {(gameState.phase === 'interrogation' || gameState.phase === 'conclusion') && (
              <div className="glass-card p-4 rounded-2xl">
                <h3 className="font-bold text-white mb-3">🕵️ Suspects</h3>
                <div className="space-y-2">
                  {selectedScenario.suspects.map(suspect => {
                    const isGuilty = suspect.id === selectedScenario.correctSuspectId;
                    const suspicion = gameState.suspectSuspicionLevels[suspect.id] || 0;
                    return (
                      <button
                        key={suspect.id}
                        onClick={() => {
                          if (gameState.phase === 'conclusion' && gameState.status !== 'finished') {
                            handleAccuseSuspect(suspect.id);
                          } else {
                            setGameState({
                              ...gameState,
                              currentlySelectedSuspect: suspect.id,
                            });
                          }
                        }}
                        disabled={gameState.status === 'finished' && gameState.phase === 'conclusion'}
                        className={`w-full text-left p-3 rounded-lg text-sm transition ${
                          gameState.currentlySelectedSuspect === suspect.id
                            ? 'bg-orange-600/40 border-2 border-orange-400 text-orange-100'
                            : 'bg-purple-700/30 hover:bg-purple-600/40 border border-purple-500/30 text-purple-100'
                        } ${gameState.status === 'finished' && gameState.phase === 'conclusion' ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{suspect.portrait} {suspect.name}</span>
                          {suspicion > 0 && (
                            <span className="text-xs bg-red-600/50 px-2 py-0.5 rounded text-red-100">
                              {suspicion}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Result (if game finished) */}
            {gameState.status === 'finished' && (
              <div className={`glass-card p-4 rounded-2xl border-2 ${
                gameState.accusedSuspectId === selectedScenario.correctSuspectId
                  ? 'border-green-500 bg-green-600/10'
                  : 'border-red-500 bg-red-600/10'
              }`}>
                <div className="text-center space-y-3">
                  {gameState.accusedSuspectId === selectedScenario.correctSuspectId ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                      <div>
                        <h4 className="font-bold text-green-300">Case Solved! 🎉</h4>
                        <p className="text-xs text-green-200 mt-1">
                          You correctly identified the suspect!
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8 text-red-400 mx-auto" />
                      <div>
                        <h4 className="font-bold text-red-300">Wrong Suspect!</h4>
                        <p className="text-xs text-red-200 mt-1">
                          The real culprit was: {selectedScenario.suspects.find(s => s.id === selectedScenario.correctSuspectId)?.name}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                    <p className="text-gray-300">Accuracy: <span className="text-yellow-300 font-semibold">{Math.round(gameState.investigationAccuracy)}%</span></p>
                    <p className="text-gray-300">Time: <span className="text-blue-300 font-semibold">{gameState.timeSpent}s</span></p>
                    <p className="text-gray-300">Clues: <span className="text-purple-300 font-semibold">{gameState.cluesCollected}</span></p>
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
