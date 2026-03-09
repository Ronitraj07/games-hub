import React from 'react';

interface EquipmentSlotsProps {
  equippedItems: any[];
}

export const EquipmentSlots: React.FC<EquipmentSlotsProps> = ({ equippedItems }) => {
  const slots = [
    { name: 'weapon', label: 'Weapon', icon: '⚔️' },
    { name: 'helmet', label: 'Helmet', icon: '🪖' },
    { name: 'armor', label: 'Armor', icon: '🛡️' },
    { name: 'boots', label: 'Boots', icon: '🥾' },
    { name: 'accessory1', label: 'Accessory 1', icon: '💍' },
    { name: 'accessory2', label: 'Accessory 2', icon: '💍' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500">
      <h3 className="text-2xl font-bold text-purple-400 mb-4">Equipment</h3>
      
      <div className="space-y-3">
        {slots.map((slot) => {
          const equipped = equippedItems.find(item => item.slot === slot.name);
          
          return (
            <div
              key={slot.name}
              className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600 hover:border-purple-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{slot.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{slot.label}</p>
                  <p className="text-white font-semibold">
                    {equipped ? equipped.item?.name : 'Empty'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
