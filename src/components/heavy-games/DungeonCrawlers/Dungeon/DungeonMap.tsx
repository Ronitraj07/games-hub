import React, { useState } from 'react';
import { RoomEncounter } from './RoomEncounter';

export const DungeonMap: React.FC = () => {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [currentRoom, setCurrentRoom] = useState(0);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-purple-400">Dungeon Floor {currentFloor}</h2>
        <div className="text-gray-400">
          Room {currentRoom + 1} / 10
        </div>
      </div>

      <div className="text-center text-gray-400 py-20">
        <p className="text-xl mb-4">🎰 Dungeon Exploration System</p>
        <p className="mb-2">Under Construction</p>
        <p className="text-sm">Features coming soon:</p>
        <ul className="text-sm mt-4 space-y-2">
          <li>• Procedurally generated dungeons</li>
          <li>• Enemy encounters</li>
          <li>• Treasure chests</li>
          <li>• Boss battles</li>
          <li>• Co-op exploration</li>
        </ul>
      </div>

      <RoomEncounter />
    </div>
  );
};
