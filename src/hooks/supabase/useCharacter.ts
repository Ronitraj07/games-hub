import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../shared/useAuth';

interface Character {
  id: string;
  user_id: string;
  user_email: string;
  name: string;
  class: 'warrior' | 'mage' | 'rogue' | 'archer';
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  stamina: number;
  max_stamina: number;
  gold: number;
  stats: {
    strength: number;
    dexterity: number;
    intelligence: number;
    vitality: number;
    luck: number;
  };
  created_at: string;
  updated_at: string;
}

interface CreateCharacterInput {
  name: string;
  class: 'warrior' | 'mage' | 'rogue' | 'archer';
}

export const useCharacter = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCharacters(data || []);
      if (data && data.length > 0 && !activeCharacter) {
        setActiveCharacter(data[0]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch characters');
      console.error('Characters fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [user?.email]);

  const createCharacter = async (input: CreateCharacterInput) => {
    if (!user?.uid || !user?.email) {
      throw new Error('User not authenticated');
    }

    const baseStats = {
      warrior: { strength: 15, dexterity: 8, intelligence: 5, vitality: 12, luck: 5 },
      mage: { strength: 5, dexterity: 7, intelligence: 15, vitality: 8, luck: 10 },
      rogue: { strength: 8, dexterity: 15, intelligence: 7, vitality: 8, luck: 12 },
      archer: { strength: 7, dexterity: 13, intelligence: 8, vitality: 9, luck: 8 },
    };

    const newCharacter = {
      user_id: user.uid,
      user_email: user.email,
      name: input.name,
      class: input.class,
      level: 1,
      experience: 0,
      health: 100,
      max_health: 100,
      mana: 50,
      max_mana: 50,
      stamina: 100,
      max_stamina: 100,
      gold: 0,
      stats: baseStats[input.class],
    };

    const { data, error: createError } = await supabase
      .from('characters')
      .insert(newCharacter)
      .select()
      .single();

    if (createError) throw createError;
    await fetchCharacters();
    return data;
  };

  const updateCharacter = async (characterId: string, updates: Partial<Character>) => {
    const { data, error: updateError } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', characterId)
      .select()
      .single();

    if (updateError) throw updateError;
    await fetchCharacters();
    return data;
  };

  const deleteCharacter = async (characterId: string) => {
    const { error: deleteError } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId);

    if (deleteError) throw deleteError;
    await fetchCharacters();
  };

  return {
    characters,
    activeCharacter,
    setActiveCharacter,
    loading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refetch: fetchCharacters,
  };
};
