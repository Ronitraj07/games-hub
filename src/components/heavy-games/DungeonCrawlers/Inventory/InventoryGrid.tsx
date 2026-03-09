import React from 'react';
import { ItemCard } from './ItemCard';
import { EquipmentSlots } from './EquipmentSlots';
import { useInventory } from '../../../../hooks/supabase/useInventory';

interface InventoryGridProps {
  characterId: string;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ characterId }) => {
  const { inventory, equippedItems, loading } = useInventory(characterId);

  if (loading) {
    return <div className="text-white text-center">Loading inventory...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Equipment Slots */}
      <div className="lg:col-span-1">
        <EquipmentSlots equippedItems={equippedItems} />
      </div>

      {/* Inventory Bag */}
      <div className="lg:col-span-2">
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500">
          <h3 className="text-2xl font-bold text-purple-400 mb-4">Inventory</h3>
          
          {inventory.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p>Your inventory is empty</p>
              <p className="text-sm mt-2">Defeat enemies and explore dungeons to find loot!</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {inventory.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
