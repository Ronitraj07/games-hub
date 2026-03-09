import React from 'react';

interface ItemCardProps {
  item: any;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const rarityColors: Record<number, string> = {
    1: 'border-gray-500', // Common
    2: 'border-green-500', // Uncommon
    3: 'border-blue-500', // Rare
    4: 'border-purple-500', // Epic
    5: 'border-yellow-500', // Legendary
  };

  return (
    <div
      className={`bg-gray-700 rounded-lg p-3 border-2 ${rarityColors[item.item?.rarity || 1]} hover:scale-105 transition-transform cursor-pointer relative`}
    >
      {item.quantity > 1 && (
        <div className="absolute top-1 right-1 bg-gray-900 text-white text-xs px-2 py-1 rounded">
          x{item.quantity}
        </div>
      )}
      <div className="text-3xl text-center mb-2">🔱</div>
      <p className="text-white text-xs text-center font-semibold truncate">
        {item.item?.name || 'Item'}
      </p>
    </div>
  );
};
