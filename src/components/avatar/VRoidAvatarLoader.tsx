import { useState } from 'react'
import { motion } from 'framer-motion'
import { VRoidAvatarData } from '../../types/avatar'

interface Props {
  onSave: (data: VRoidAvatarData) => void
  onBack: () => void
  isSaving?: boolean
}

export const VRoidAvatarLoader = ({ onSave, onBack, isSaving }: Props) => {
  const [vrmUrl, setVrmUrl] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    setError('')
    if (!vrmUrl.trim()) {
      setError('Please enter your VRoid Hub avatar URL')
      return
    }
    if (!vrmUrl.includes('hub.vroid.com') && !vrmUrl.endsWith('.vrm')) {
      setError('Please enter a valid VRoid Hub URL or .vrm file URL')
      return
    }
    onSave({ vroidAvatarUrl: vrmUrl.trim() })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto p-6"
    >
      <button
        onClick={onBack}
        className="mb-6 text-white/60 hover:text-white flex items-center gap-2 transition-colors"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-white mb-2">Connect VRoid Avatar</h2>
      <p className="text-white/60 mb-8">Use your anime avatar from VRoid Hub</p>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {[
          { step: '1', text: 'Go to hub.vroid.com and create/find your avatar', link: 'https://hub.vroid.com' },
          { step: '2', text: 'Open your avatar page and copy the URL from your browser' },
          { step: '3', text: 'Paste the URL below and save' },
        ].map(({ step, text, link }) => (
          <div key={step} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
              {step}
            </div>
            <p className="text-white/80 text-sm pt-1">
              {text}{' '}
              {link && (
                <a href={link} target="_blank" rel="noreferrer" className="text-amber-400 underline">
                  hub.vroid.com
                </a>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <label className="block text-white/80 text-sm font-semibold mb-2">VRoid Hub Avatar URL</label>
        <input
          type="url"
          value={vrmUrl}
          onChange={(e) => setVrmUrl(e.target.value)}
          placeholder="https://hub.vroid.com/characters/..."
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors"
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-all"
      >
        {isSaving ? 'Saving...' : 'Connect Avatar ✨'}
      </button>
    </motion.div>
  )
}
