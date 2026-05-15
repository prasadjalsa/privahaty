import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInAnonymously } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { sha256hex, randomBase64url, randomAlphanum } from '../lib/crypto'
import RoomCredentials from '../components/RoomCredentials'

type Phase = 'configure' | 'credentials'

interface CreatedRoom {
  roomId: string
  secret: string
}

const EXPIRY_OPTIONS = [
  { value: 10, label: '10 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
]

export default function CreatePage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('configure')
  const [expiryMinutes, setExpiryMinutes] = useState(30)
  const [created, setCreated] = useState<CreatedRoom | null>(null)
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const { user } = await signInAnonymously(auth)

      const roomId = randomAlphanum(8)
      const secret = randomBase64url(16)
      const secretHash = await sha256hex(secret)

      const now = Timestamp.now()
      const nextWipeAt = Timestamp.fromMillis(now.toMillis() + expiryMinutes * 60 * 1000)

      // Write room metadata, secret hash, and creator's member doc sequentially.
      // _secret/hash must exist before member doc creation (rules use get() on it).
      await setDoc(doc(db, 'rooms', roomId), {
        expiryMinutes,
        createdAt: serverTimestamp(),
        nextWipeAt,
      })

      await setDoc(doc(db, 'rooms', roomId, '_secret', 'hash'), { secretHash })

      await setDoc(doc(db, 'rooms', roomId, 'members', user.uid), {
        nickname: nickname.trim(),
        joinedAt: serverTimestamp(),
        secretHash,
      })

      setCreated({ roomId, secret })
      sessionStorage.setItem(`secret:${roomId}`, secret)
      setPhase('credentials')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  function handleEnterRoom() {
    if (created) navigate(`/room/${created.roomId}`)
  }

  const nicknameValid = nickname.trim().length > 0 && /^[a-zA-Z0-9 \-]+$/.test(nickname)

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create a Room</h2>

        {phase === 'configure' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
            <div>
              <p className="text-gray-400 text-sm mb-3">Messages wipe after:</p>
              <div className="flex gap-3">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiryMinutes(opt.value)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      expiryMinutes === opt.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Your nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={32}
                placeholder="e.g. Alice"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700"
                onKeyDown={(e) => e.key === 'Enter' && nicknameValid && handleCreate()}
              />
              {nickname && !nicknameValid && (
                <p className="text-red-400 text-xs mt-1">
                  Letters, numbers, spaces and dashes only
                </p>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading || !nicknameValid}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? 'Creating…' : 'Create Room'}
            </button>
          </div>
        )}

        {phase === 'credentials' && created && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-3">
              <p className="text-yellow-400 text-xs font-medium">
                Save these now — the secret cannot be recovered after you leave this page.
              </p>
            </div>

            <RoomCredentials roomId={created.roomId} secret={created.secret} />

            <button
              onClick={handleEnterRoom}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              Enter Room
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
