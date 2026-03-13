import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DEFAULT_CHARACTERS,
  SKIN_TONES,
  HAIR_COLORS,
  OUTFIT_COLORS,
  DefaultAvatarData,
} from '../../types/avatar'

interface Props {
  onSave: (data: DefaultAvatarData) => void
  onBack: () => void
  isSaving?: boolean
}

export const DefaultCharacterPicker = ({ onSave, onBack, isSaving }: Props) => {
  const [selectedCharacter, setSelectedCharacter] = useState(DEFAULT_CHARACTERS[0].id)
  const [selectedSkin, setSelectedSkin] = useState(SKIN_TONES[0].color)
  const [selectedHair, setSelectedHair] = useState(HAIR_COLORS[0].color)
  const [selectedOutfit, setSelectedOutfit] = useState(OUTFIT_COLORS[0].color)

  const handleSave = () => {
    onSave({
      baseModel: selectedCharacter,
      skinTone: selectedSkin,
      hairColor: selectedHair,
      outfitColor: selectedOutfit,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-6"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-white/60 hover:text-white flex items-center gap-2 transition-colors"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-white mb-2">Choose Your Character</h2>
      <p className="text-white/60 mb-8">Pick your style and customise your look</p>

      {/* Character Selection */}
      <section className="mb-8">
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Base Character</h3>
        <div className="grid grid-cols-3 gap-3">
          {DEFAULT_CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedCharacter(char.id)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selectedCharacter === char.id
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="text-4xl mb-2">{char.thumbnail}</div>
              <div className="text-white font-medium text-sm">{char.name}</div>
              <div className="text-white/50 text-xs mt-1">{char.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Skin Tone */}
      <section className="mb-6">
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Skin Tone</h3>
        <div className="flex gap-3 flex-wrap">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedSkin(tone.color)}
              title={tone.label}
              className={`w-10 h-10 rounded-full border-4 transition-all ${
                selectedSkin === tone.color ? 'border-amber-400 scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: tone.color }}
            />
          ))}
        </div>
      </section>

      {/* Hair Color */}
      <section className="mb-6">
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Hair Colour</h3>
        <div className="flex gap-3 flex-wrap">
          {HAIR_COLORS.map((hair) => (
            <button
              key={hair.id}
              onClick={() => setSelectedHair(hair.color)}
              title={hair.label}
              className={`w-10 h-10 rounded-full border-4 transition-all ${
                selectedHair === hair.color ? 'border-amber-400 scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: hair.color }}
            />
          ))}
        </div>
      </section>

      {/* Outfit Color */}
      <section className="mb-8">
        <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Outfit Colour</h3>
        <div className="flex gap-3 flex-wrap">
          {OUTFIT_COLORS.map((outfit) => (
            <button
              key={outfit.id}
              onClick={() => setSelectedOutfit(outfit.color)}
              title={outfit.label}
              className={`w-10 h-10 rounded-full border-4 transition-all ${
                selectedOutfit === outfit.color ? 'border-amber-400 scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: outfit.color }}
            />
          ))}
        </div>
      </section>

      {/* Preview Bar */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: selectedSkin }} title="Skin" />
          <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: selectedHair }} title="Hair" />
          <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: selectedOutfit }} title="Outfit" />
        </div>
        <span className="text-white/60 text-sm">
          {DEFAULT_CHARACTERS.find(c => c.id === selectedCharacter)?.name} — your unique look
        </span>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-lg transition-all"
      >
        {isSaving ? 'Saving...' : 'Save & Enter Game ✨'}
      </button>
    </motion.div>
  )
}
