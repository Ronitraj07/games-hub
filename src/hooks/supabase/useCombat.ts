import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CombatAction {
  id: string;
  session_id: string;
  character_id: string;
  action_type: 'attack' | 'skill' | 'item' | 'defend';
  target_id: string | null;
  skill_id: string | null;
  item_id: string | null;
  damage_dealt: number;
  healing_done: number;
  data: any;
  timestamp: string;
}

export const useCombat = (sessionId: string | null) => {
  const [combatLog, setCombatLog] = useState<CombatAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCombatLog = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('combat_actions')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (fetchError) throw fetchError;
      setCombatLog(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch combat log');
      console.error('Combat log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (action: Omit<CombatAction, 'id' | 'timestamp'>) => {
    if (!sessionId) throw new Error('No active session');

    const { data, error: logError } = await supabase
      .from('combat_actions')
      .insert({
        ...action,
        session_id: sessionId,
      })
      .select()
      .single();

    if (logError) throw logError;
    await fetchCombatLog();
    return data;
  };

  const performAttack = async (
    characterId: string,
    targetId: string,
    damage: number
  ) => {
    return logAction({
      session_id: sessionId!,
      character_id: characterId,
      action_type: 'attack',
      target_id: targetId,
      skill_id: null,
      item_id: null,
      damage_dealt: damage,
      healing_done: 0,
      data: {},
    });
  };

  const useSkill = async (
    characterId: string,
    skillId: string,
    targetId: string | null,
    damage: number,
    healing: number = 0,
    additionalData?: any
  ) => {
    return logAction({
      session_id: sessionId!,
      character_id: characterId,
      action_type: 'skill',
      target_id: targetId,
      skill_id: skillId,
      item_id: null,
      damage_dealt: damage,
      healing_done: healing,
      data: additionalData || {},
    });
  };

  const useItem = async (
    characterId: string,
    itemId: string,
    healing: number = 0,
    additionalData?: any
  ) => {
    return logAction({
      session_id: sessionId!,
      character_id: characterId,
      action_type: 'item',
      target_id: null,
      skill_id: null,
      item_id: itemId,
      damage_dealt: 0,
      healing_done: healing,
      data: additionalData || {},
    });
  };

  const defend = async (characterId: string, additionalData?: any) => {
    return logAction({
      session_id: sessionId!,
      character_id: characterId,
      action_type: 'defend',
      target_id: null,
      skill_id: null,
      item_id: null,
      damage_dealt: 0,
      healing_done: 0,
      data: additionalData || {},
    });
  };

  return {
    combatLog,
    loading,
    error,
    fetchCombatLog,
    performAttack,
    useSkill,
    useItem,
    defend,
  };
};
