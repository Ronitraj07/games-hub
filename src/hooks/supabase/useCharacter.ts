import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'archer';

export interface Character {
  id: string;
  user_id: string;
  user_email: string;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  stamina: number;
  max_stamina: number;
  gold: number;
  stats: any;
  created_at: string;
  updated_at: string;
}

export const useCharacter = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false }) as any;

      if (fetchError) throw fetchError;
      setCharacters(data || []);
      if (data && data.length > 0 && !activeCharacter) {
        setActiveCharacter(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [user?.uid]);

  const createCharacter = async (name: string, characterClass: CharacterClass) => {
    if (!user?.uid || !user?.email) throw new Error('User not authenticated');

    const baseStats = {
      warrior: { strength: 15, dexterity: 10, intelligence: 8, vitality: 14 },
      mage: { strength: 8, dexterity: 10, intelligence: 15, vitality: 10 },
      rogue: { strength: 10, dexterity: 15, intelligence: 10, vitality: 10 },
      archer: { strength: 10, dexterity: 14, intelligence: 10, vitality: 11 }
    };

    const newCharacter: any = {
      user_id: user.uid,
      user_email: user.email,
      name,
      class: characterClass,
      level: 1,
      experience: 0,
      health: 100,
      max_health: 100,
      mana: 50,
      max_mana: 50,
      stamina: 100,
      max_stamina: 100,
      gold: 0,
      stats: baseStats[characterClass]
    };

    const { data, error } = await supabase
      .from('characters')
      .insert([newCharacter])
      .select()
      .single() as any;

    if (error) throw error;
    await fetchCharacters();
    return data;
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    const { error } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id) as any;

    if (error) throw error;
    await fetchCharacters();
  };

  const deleteCharacter = async (id: string) => {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchCharacters();
  };

  const refetch = fetchCharacters;

  return {
    characters,
    activeCharacter,
    setActiveCharacter,
    loading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refetch
  };
};