import React, { useState } from 'react';
import { Sword, Shield, Sparkles, Package } from 'lucide-react';

interface ArenaControlsProps {
  character: any;
  onAction: (actionType: 'attack' | 'skill' | 'item' | 'defend', data?: any) => void;
}

export const ArenaControls: React.FC<ArenaControlsProps> = ({ character, onAction }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const actions = [
    {
      id: 'attack',
      label: 'Attack',
      icon: Sword,
      color: 'red',
      description: 'Basic physical attack'
    },
    {
      id: 'skill',
      label: 'Skills',
      icon: Sparkles,
      color: 'purple',
      description: 'Use special abilities'
    },
    {
      id: 'item',
      label: 'Items',
      icon: Package,
      color: 'yellow',
      description: 'Use consumable items'
    },
    {
      id: 'defend',
      label: 'Defend',
      icon: Shield,
      color: 'blue',
      description: 'Reduce incoming damage'
    }
  ];

  const handleActionClick = (actionId: string) => {
    if (actionId === 'attack' || actionId === 'defend') {
      // Direct actions
      onAction(actionId as any);
    } else {
      // Actions that need selection
      setSelectedAction(actionId);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={`
                p-4 rounded-xl border-2 transition-all
                bg-${action.color}-900/30 border-${action.color}-500
                hover:bg-${action.color}-900/50 hover:scale-105
                text-${action.color}-300
              `}
            >
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">{action.label}</p>
              <p className="text-xs mt-1 opacity-75">{action.description}</p>
            </button>
          );
        })}
      </div>

      {/* Skill/Item Selection Panel */}
      {selectedAction && (
        <div className="mt-4 p-4 bg-gray-800 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              Select {selectedAction === 'skill' ? 'Skill' : 'Item'}
            </h3>
            <button
              onClick={() => setSelectedAction(null)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="text-gray-400 text-center py-8">
            {selectedAction === 'skill' ? (
              <p>Skills will be loaded from character data</p>
            ) : (
              <p>Items will be loaded from inventory</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};