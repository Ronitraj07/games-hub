import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Skill {
  id: string;
  name: string;
  description: string | null;
  class: string | null;
  level_required: number;
  cooldown: number;
  mana_cost: number;
  damage: number;
  effect: any;
  icon_url: string | null;
}

interface CharacterSkill {
  character_id: string;
  skill_id: string;
  level: number;
  learned_at: string;
  skill: Skill;
}

export const useSkills = (characterId: string | null, characterClass?: string) => {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [learnedSkills, setLearnedSkills] = useState<CharacterSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableSkills = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('skills')
        .select('*')
        .or(`class.is.null,class.eq.${characterClass}`);

      if (fetchError) throw fetchError;
      setAvailableSkills(data || []);
    } catch (err) {
      console.error('Available skills fetch error:', err);
    }
  };

  const fetchLearnedSkills = async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('character_skills')
        .select(`
          *,
          skill:skills(*)
        `)
        .eq('character_id', characterId)
        .order('learned_at', { ascending: false });

      if (fetchError) throw fetchError;
      setLearnedSkills(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch skills');
      console.error('Learned skills fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (characterClass) {
      fetchAvailableSkills();
    }
  }, [characterClass]);

  useEffect(() => {
    fetchLearnedSkills();
  }, [characterId]);

  const learnSkill = async (skillId: string) => {
    if (!characterId) throw new Error('No character selected');

    const { data, error: learnError } = await supabase
      .from('character_skills')
      .insert({
        character_id: characterId,
        skill_id: skillId,
        level: 1,
      })
      .select()
      .single();

    if (learnError) throw learnError;
    await fetchLearnedSkills();
    return data;
  };

  const upgradeSkill = async (skillId: string) => {
    if (!characterId) throw new Error('No character selected');

    const currentSkill = learnedSkills.find(s => s.skill_id === skillId);
    if (!currentSkill) throw new Error('Skill not learned');

    const { data, error: upgradeError } = await supabase
      .from('character_skills')
      .update({ level: currentSkill.level + 1 })
      .eq('character_id', characterId)
      .eq('skill_id', skillId)
      .select()
      .single();

    if (upgradeError) throw upgradeError;
    await fetchLearnedSkills();
    return data;
  };

  return {
    availableSkills,
    learnedSkills,
    loading,
    error,
    learnSkill,
    upgradeSkill,
    refetch: fetchLearnedSkills,
  };
};
