import React, { useState, useEffect } from 'react';
import { useGameInvite } from '@/hooks/firebase/useGameInvite';
import { Copy, Check, X, Users, LogIn, Loader2, Link2 } from 'lucide-react';

interface InviteModalProps {
  gameType: string;
  onClose: () => void;
  /** Called when both players are ready — roomId is the Firebase invite code */
  onReady: (roomId: string, isHost: boolean) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ gameType, onClose, onReady }) => {
  const { status, roomId, invite, error, createRoom, joinRoom, cancelRoom } =
    useGameInvite(gameType);

  const [tab,       setTab]       = useState<'host' | 'join'>('host');
  const [joinCode,  setJoinCode]  = useState('');
  const [copied,    setCopied]    = useState<'code' | 'link' | null>(null);
  const [joinError, setJoinError] = useState('');
  const [joining,   setJoining]   = useState(false);

  // Auto-create room when host tab opens
  useEffect(() => {
    if (tab === 'host' && status === 'idle') createRoom();
  }, [tab]);

  // Notify parent once both players are in
  useEffect(() => {
    if (status === 'joined' && roomId) {
      const isHost = tab === 'host';
      // Small delay so user sees the "Partner joined!" confirmation
      const t = setTimeout(() => onReady(roomId, isHost), 800);
      return () => clearTimeout(t);
    }
  }, [status, roomId]);

  const copyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied('code');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinError('');
    setJoining(true);
    const ok = await joinRoom(joinCode);
    if (!ok) setJoinError(error || 'Room not found. Check the code and try again.');
    setJoining(false);
  };

  const handleClose = () => {
    cancelRoom();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 glass rounded-xl">
              <Users size={20} className="text-pink-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Invite Partner</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{gameType}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="glass-btn p-2 rounded-xl text-gray-400 hover:text-red-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 pb-0">
          {(['host', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'glass text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t === 'host' ? '🎮 Create Room' : '🔗 Join Room'}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── HOST TAB ── */}
          {tab === 'host' && (
            <div className="space-y-5">
              {status === 'creating' && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 size={22} className="animate-spin text-pink-500" />
                  <span className="text-gray-500 dark:text-gray-400">Creating room…</span>
                </div>
              )}

              {(status === 'waiting' || status === 'joined') && roomId && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Share this code with your partner:
                  </p>

                  {/* Room code */}
                  <div className="flex justify-center">
                    <div className="glass px-6 py-4 rounded-2xl">
                      <span className="text-4xl font-black tracking-[0.3em] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent select-all">
                        {roomId}
                      </span>
                    </div>
                  </div>

                  {/* Copy buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={copyCode}
                      className="flex-1 flex items-center justify-center gap-2 glass-btn py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 transition hover:scale-[1.02]"
                    >
                      {copied === 'code'
                        ? <Check size={16} className="text-green-500" />
                        : <Copy size={16} />}
                      {copied === 'code' ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button
                      onClick={copyLink}
                      className="flex-1 flex items-center justify-center gap-2 glass-btn py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 transition hover:scale-[1.02]"
                    >
                      {copied === 'link'
                        ? <Check size={16} className="text-green-500" />
                        : <Link2 size={16} />}
                      {copied === 'link' ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  {status === 'waiting' && (
                    <div className="flex items-center justify-center gap-3 py-2 text-gray-500 dark:text-gray-400">
                      <Loader2 size={16} className="animate-spin text-purple-400" />
                      <span className="text-sm">Waiting for partner to join…</span>
                    </div>
                  )}

                  {status === 'joined' && (
                    <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400">
                      <Check size={18} />
                      <span className="text-sm font-semibold">Partner joined! Starting game…</span>
                    </div>
                  )}
                </>
              )}

              {status === 'error' && (
                <p className="text-center text-red-500 text-sm py-4">
                  {error || 'Something went wrong. Firebase may not be configured.'}
                </p>
              )}
            </div>
          )}

          {/* ── JOIN TAB ── */}
          {tab === 'join' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Enter the 6-character code your partner shared:
              </p>

              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="XXXXXX"
                maxLength={6}
                autoFocus
                className="w-full glass border-0 rounded-xl py-4 px-4 text-center text-3xl font-black tracking-[0.3em] text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 uppercase"
              />

              {joinError && (
                <p className="text-red-500 text-sm text-center">{joinError}</p>
              )}

              {status === 'joined' && (
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <Check size={18} />
                  <span className="text-sm font-semibold">Joined! Starting game…</span>
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={joinCode.length !== 6 || joining}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02] active:scale-[0.98]"
              >
                {joining
                  ? <Loader2 size={18} className="animate-spin" />
                  : <LogIn size={18} />}
                {joining ? 'Joining…' : 'Join Room'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
