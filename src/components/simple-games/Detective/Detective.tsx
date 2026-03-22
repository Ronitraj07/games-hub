import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { SceneRenderer } from '@/components/shared/SceneRenderer';
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
          {/* Scene Display */}
          <div className="lg:col-span-3">
            <div className="glass-card p-8 rounded-2xl min-h-96 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">{currentScene.title}</h2>
                <p className="text-gray-300 mb-6">{currentScene.description}</p>

                {/* Hotspots for investigation */}
                {gameState.phase === 'investigation' && currentScene.hotspots.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-purple-200 mb-3">Things to investigate:</h3>
                    <div className="space-y-2">
                      {currentScene.hotspots.map(hotspot => (
                        <button
                          key={hotspot.id}
                          onClick={() => hotspot.evidenceId && handleDiscoverEvidence(hotspot.evidenceId)}
                          className="w-full text-left p-3 rounded-lg bg-purple-700/30 hover:bg-purple-600/50 border border-purple-500/30 transition text-purple-100"
                        >
                          🔍 {hotspot.tooltip}
                          {hotspot.evidenceId && gameState.discoveredEvidenceIds.includes(hotspot.evidenceId) && (
                            <CheckCircle className="inline ml-2 w-4 h-4 text-green-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Choices */}
              {currentScene.dialogueOptions && currentScene.dialogueOptions.length > 0 && (
                <div className="space-y-2">
                  {currentScene.dialogueOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleMakeChoice(option.id, option.nextSceneId)}
                      className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition"
                    >
                      {option.prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Evidence & Suspects */}
          <div className="lg:col-span-1 space-y-6">
            {/* Evidence Inventory */}
            <div className="glass-card p-4 rounded-2xl">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                📋 Evidence ({gameState.cluesCollected})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedScenario.evidence
                  .filter(e => gameState.discoveredEvidenceIds.includes(e.id))
                  .map(evidence => (
                    <div key={evidence.id} className="p-2 bg-purple-700/30 rounded text-xs text-purple-100">
                      📌 {evidence.name}
                    </div>
                  ))}
              </div>
            </div>

            {/* Suspects */}
            {gameState.phase === 'interrogation' || gameState.phase === 'conclusion' && (
              <div className="glass-card p-4 rounded-2xl">
                <h3 className="font-bold text-white mb-3">🕵️ Suspects</h3>
                <div className="space-y-2">
                  {selectedScenario.suspects.map(suspect => (
                    <button
                      key={suspect.id}
                      onClick={() => {
                        if (gameState.phase === 'conclusion') {
                          handleAccuseSuspect(suspect.id);
                        } else {
                          setGameState({
                            ...gameState,
                            currentlySelectedSuspect: suspect.id,
                          });
                        }
                      }}
                      className={`w-full text-left p-2 rounded text-sm transition ${
                        gameState.currentlySelectedSuspect === suspect.id
                          ? 'bg-orange-600/50 border border-orange-400'
                          : 'bg-purple-700/30 hover:bg-purple-600/50'
                      } text-purple-100`}
                    >
                      {suspect.portrait} {suspect.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result (if game finished) */}
            {gameState.status === 'finished' && (
              <div className={`glass-card p-4 rounded-2xl border-2 ${
                gameState.accusedSuspectId === selectedScenario.correctSuspectId
                  ? 'border-green-500'
                  : 'border-red-500'
              }`}>
                <div className="text-center">
                  {gameState.accusedSuspectId === selectedScenario.correctSuspectId ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <h4 className="font-bold text-green-300">Correct!</h4>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <h4 className="font-bold text-red-300">Wrong Suspect!</h4>
                    </>
                  )}
                  <p className="text-xs text-gray-300 mt-2">
                    Accuracy: {Math.round(gameState.investigationAccuracy)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
