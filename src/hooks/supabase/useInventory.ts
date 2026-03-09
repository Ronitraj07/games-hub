import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface InventoryItem {
  id: string;
  character_id: string;
  item_id: string;
  slot: string | null;
  quantity: number;
  equipped: boolean;
  acquired_at: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    rarity: number;
    required_level: number;
    stats: any;
    effects: any;
    icon_url: string | null;
    sell_price: number;
  };
}

export const useInventory = (characterId: string | null) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equippedItems, setEquippedItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select(`
          *,
          item:items(*)
        `)
        .eq('character_id', characterId)
        .order('acquired_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const allItems = data || [];
      setInventory(allItems);
      setEquippedItems(allItems.filter(item => item.equipped));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [characterId]);

  const addItemToInventory = async (itemId: string, quantity: number = 1) => {
    if (!characterId) throw new Error('No character selected');

    const { data, error: addError } = await supabase
      .from('inventory')
      .insert({
        character_id: characterId,
        item_id: itemId,
        quantity,
        equipped: false,
      })
      .select()
      .single();

    if (addError) throw addError;
    await fetchInventory();
    return data;
  };

  const equipItem = async (inventoryId: string, slot: string) => {
    // First, unequip any item in that slot
    await supabase
      .from('inventory')
      .update({ equipped: false, slot: null })
      .eq('character_id', characterId)
      .eq('slot', slot);

    // Then equip the new item
    const { data, error: equipError } = await supabase
      .from('inventory')
      .update({ equipped: true, slot })
      .eq('id', inventoryId)
      .select()
      .single();

    if (equipError) throw equipError;
    await fetchInventory();
    return data;
  };

  const unequipItem = async (inventoryId: string) => {
    const { data, error: unequipError } = await supabase
      .from('inventory')
      .update({ equipped: false, slot: null })
      .eq('id', inventoryId)
      .select()
      .single();

    if (unequipError) throw unequipError;
    await fetchInventory();
    return data;
  };

  const removeItem = async (inventoryId: string) => {
    const { error: removeError } = await supabase
      .from('inventory')
      .delete()
      .eq('id', inventoryId);

    if (removeError) throw removeError;
    await fetchInventory();
  };

  return {
    inventory,
    equippedItems,
    loading,
    error,
    addItemToInventory,
    equipItem,
    unequipItem,
    removeItem,
    refetch: fetchInventory,
  };
};
