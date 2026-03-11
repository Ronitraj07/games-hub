// ============================================================
// useHeartboundData — Supabase CRUD for Heartbound
// ============================================================
import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type {
  IslandId, CoupleProgress, InventoryItem, PlacedItem, MemoryEntry,
} from '../../types/heartbound.types';

// Deterministic couple key from two emails
export function makeCoupleKey(email1: string, email2: string): string {
  return [email1, email2].sort().join('::');
}

// Safe cast: only allow valid IslandId values (1–12), else null
function toIslandId(val: unknown): IslandId | null {
  const n = Number(val);
  if (n >= 1 && n <= 12) return n as IslandId;
  return null;
}

export function useHeartboundData(myEmail: string, partnerEmail: string) {
  const coupleKey = makeCoupleKey(myEmail, partnerEmail);

  // ── Avatar ────────────────────────────────────────────────────────
  const saveAvatarUrl = useCallback(async (url: string) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ email: myEmail, avatar_url: url, avatar_updated_at: new Date().toISOString() });
    if (error) console.error('saveAvatarUrl:', error);
    return !error;
  }, [myEmail]);

  const getAvatarUrl = useCallback(async (email: string): Promise<string | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('email', email)
      .single();
    return (data as any)?.avatar_url ?? null;
  }, []);

  // ── Couple progress ───────────────────────────────────────────────
  const getCoupleProgress = useCallback(async (): Promise<CoupleProgress | null> => {
    const { data } = await supabase
      .from('couple_progress')
      .select('*')
      .eq('couple_key', coupleKey)
      .single();
    if (!data) return null;
    const row = data as any;
    return {
      coupleKey:       row.couple_key,
      bondXp:          row.bond_xp,
      bondLevel:       row.bond_level,
      totalActivities: row.total_activities,
      islandsVisited:  (row.islands_visited ?? []).map(toIslandId).filter(Boolean) as IslandId[],
    };
  }, [coupleKey]);

  const updateBondXp = useCallback(async (deltaXp: number) => {
    const { error } = await supabase.rpc('increment_bond_xp', {
      p_couple_key: coupleKey,
      p_delta: deltaXp,
    });
    if (error) console.error('updateBondXp:', error);
  }, [coupleKey]);

  // ── Inventory ─────────────────────────────────────────────────────
  const addItem = useCallback(async (item: InventoryItem) => {
    const { error } = await supabase
      .from('rpg_inventory')
      .upsert({
        user_email: myEmail,
        item_id:    item.id,
        item_name:  item.name,
        item_type:  item.type,
        rarity:     item.rarity,
        quantity:   item.quantity,
        island_src: item.islandSrc?.toString() ?? null,
      }, { onConflict: 'user_email,item_id', ignoreDuplicates: false });
    if (error) console.error('addItem:', error);
  }, [myEmail]);

  const getInventory = useCallback(async (): Promise<InventoryItem[]> => {
    const { data } = await supabase
      .from('rpg_inventory')
      .select('*')
      .eq('user_email', myEmail);

    return (data ?? []).map((r: any): InventoryItem => ({
      id:          r.item_id,
      name:        r.item_name,
      description: '',
      type:        r.item_type,
      rarity:      r.rarity,
      icon:        '',
      stackable:   true,
      maxStack:    99,
      // Use toIslandId so only valid 1–12 values pass through
      islandSrc:   toIslandId(r.island_src),
      quantity:    r.quantity,
      obtainedAt:  r.obtained_at,
    }));
  }, [myEmail]);

  // ── Home furniture ────────────────────────────────────────────────
  const getHomeFurniture = useCallback(async (): Promise<PlacedItem[]> => {
    const { data } = await supabase
      .from('couple_home')
      .select('*')
      .eq('couple_key', coupleKey);
    return (data ?? []).map((r: any): PlacedItem => ({
      id:        r.id,
      itemId:    r.item_id,
      itemName:  r.item_name,
      posX:      r.pos_x,
      posY:      r.pos_y,
      posZ:      r.pos_z,
      rotationY: r.rotation_y,
      scale:     r.scale,
      placedBy:  r.placed_by,
      modelPath: '',
    }));
  }, [coupleKey]);

  const placeFurniture = useCallback(async (item: PlacedItem) => {
    const { error } = await supabase
      .from('couple_home')
      .insert({
        couple_key: coupleKey,
        item_id:    item.itemId,
        item_name:  item.itemName,
        pos_x:      item.posX,
        pos_y:      item.posY,
        pos_z:      item.posZ,
        rotation_y: item.rotationY,
        scale:      item.scale,
        placed_by:  item.placedBy,
      });
    if (error) console.error('placeFurniture:', error);
  }, [coupleKey]);

  const removeFurniture = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('couple_home')
      .delete()
      .eq('id', id);
    if (error) console.error('removeFurniture:', error);
  }, []);

  // ── Memory book ───────────────────────────────────────────────────
  const addMemoryEntry = useCallback(async (entry: Omit<MemoryEntry, 'id' | 'createdAt'>) => {
    const { error } = await supabase
      .from('memory_book')
      .insert({
        couple_key:  coupleKey,
        entry_type:  entry.type,
        title:       entry.title,
        description: entry.description ?? '',
        island_id:   entry.islandId,
        photo_url:   entry.photoUrl,
      });
    if (error) console.error('addMemoryEntry:', error);
  }, [coupleKey]);

  const getMemoryBook = useCallback(async (): Promise<MemoryEntry[]> => {
    const { data } = await supabase
      .from('memory_book')
      .select('*')
      .eq('couple_key', coupleKey)
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []).map((r: any): MemoryEntry => ({
      id:          r.id,
      type:        r.entry_type,
      title:       r.title,
      description: r.description,
      islandId:    toIslandId(r.island_id),
      photoUrl:    r.photo_url,
      createdAt:   r.created_at,
    }));
  }, [coupleKey]);

  return {
    saveAvatarUrl, getAvatarUrl,
    getCoupleProgress, updateBondXp,
    addItem, getInventory,
    getHomeFurniture, placeFurniture, removeFurniture,
    addMemoryEntry, getMemoryBook,
  };
}
