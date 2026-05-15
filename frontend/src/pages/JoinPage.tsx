import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInAnonymously } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { sha256hex } from '../lib/crypto'

export default function JoinPage() {
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState('')
  const [secret, setSecret] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    const trimmedRoomId = roomId.trim()
    const trimmedSecret = secret.trim()
    const trimmedNickname = nickname.trim()

    if (!trimmedRoomId || !trimmedSecret || !trimmedNickname) {
      setError('All fields are required')
      return
    }
    if (!/^[a-zA-Z0-9 \-]+$/.test(trimmedNickname)) {
      setError('Nickname may only contain letters, numbers, spaces, and dashes')
      return
    }
    if (trimmedNickname.length > 32) {
      setError('Nickname must be 32 characters or fewer')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { user } = await signInAnonymously(auth)
      const secretHash = await sha256hex(trimmedSecret)

      // Writing the member doc proves knowledge of the secret.
      // Firestore rules verify secretHash against the never-readable _secret/hash doc.
      await setDoc(doc(db, 'rooms', trimmedRoomId, 'members', user.uid), {
        nickname: trimmedNickname,
        joinedAt: serverTimestamp(),
        secretHash,
      })

      navigate(`/room/${trimmedRoomId}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Invalid room ID or secret.')
      } else {
        setError('Could not join room. Check the room ID and secret.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Join a Room</h2>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. aB3xZ9kL"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Secret</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Paste the room secret"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Your nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={32}
              placeholder="e.g. Bob"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {loading ? 'Joining…' : 'Join Room'}
          </button>
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
            ← Back
          </Link>
        </p>
      </div>
    </div>
  )
}
