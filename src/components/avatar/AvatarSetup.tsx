import { useState } from 'react'
import { motion } from 'framer-motion'
import { DefaultCharacterPicker } from './DefaultCharacterPicker'
import { VRoidAvatarLoader } from './VRoidAvatarLoader'
import { useAvatarProfile } from '../../hooks/useAvatarProfile'
import { useAvatarStore } from '../../stores/avatarStore'
import { DefaultAvatarData, VRoidAvatarData } from '../../types/avatar'

interface Props {
  firebaseUid: string
  onComplete: () => void
}

type Step = 'choose' | 'default' | 'vroid'

export const AvatarSetup = ({ firebaseUid, onComplete }: Props) => {
  const [step, setStep] = useState<Step>('choose')
  const [isSaving, setIsSaving] = useState(false)
  const { saveDefaultAvatar, saveVRoidAvatar } = useAvatarProfile(firebaseUid)
  const { setDefaultAvatar, setVRoidAvatar } = useAvatarStore()

  const handleSaveDefault = async (data: DefaultAvatarData) => {
    setIsSaving(true)
    const success = await saveDefaultAvatar(firebaseUid, data)
    if (success) {
      setDefaultAvatar(data)
      onComplete()
    }
    setIsSaving(false)
  }

  const handleSaveVRoid = async (data: VRoidAvatarData) => {
    setIsSaving(true)
    const success = await saveVRoidAvatar(firebaseUid, data)
    if (success) {
      setVRoidAvatar(data)
      onComplete()
    }
    setIsSaving(false)
  }

  if (step === 'default') {
    return (
      <DefaultCharacterPicker
        onSave={handleSaveDefault}
        onBack={() => setStep('choose')}
        isSaving={isSaving}
      />
    )
  }

  if (step === 'vroid') {
    return (
      <VRoidAvatarLoader
        onSave={handleSaveVRoid}
        onBack={() => setStep('choose')}
        isSaving={isSaving}
      />
    )
  }

  // Main choice screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d1b3e] to-[#0a0a1a] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Avatar</h1>
          <p className="text-white/60">Choose how you want to appear in the world</p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* VRoid Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep('vroid')}
            className="w-full p-6 rounded-2xl border-2 border-purple-500/40 bg-purple-500/10 hover:border-purple-400/60 hover:bg-purple-500/20 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎭</div>
              <div>
                <div className="text-white font-bold text-lg">Use Anime Avatar</div>
                <div className="text-white/60 text-sm mt-1">Connect your VRoid Hub avatar — full anime style, no photo needed</div>
                <div className="mt-2">
                  <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full">Anime Style</span>
                  <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-full ml-2">VRoid Hub</span>
                </div>
              </div>
            </div>
          </motion.button>

          {/* Default Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep('default')}
            className="w-full p-6 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 hover:border-amber-400/60 hover:bg-amber-500/20 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">👤</div>
              <div>
                <div className="text-white font-bold text-lg">Choose Default Character</div>
                <div className="text-white/60 text-sm mt-1">Pick from stylized characters and customise your colours</div>
                <div className="mt-2">
                  <span className="text-xs bg-amber-500/30 text-amber-300 px-2 py-1 rounded-full">Quick Setup</span>
                  <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-full ml-2">No Account Needed</span>
                </div>
              </div>
            </div>
          </motion.button>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          You can change your avatar anytime from the menu
        </p>
      </motion.div>
    </div>
  )
}
