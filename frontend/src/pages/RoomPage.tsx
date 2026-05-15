import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useRoom } from '../hooks/useRoom'
import CountdownTimer from '../components/CountdownTimer'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { roomDoc, messages, loading: roomLoading, error } = useRoom(roomId)
  const [authChecked, setAuthChecked] = useState(false)
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user || !roomId) {
      navigate('/join', { replace: true })
      return
    }

    // Read nickname from the member doc (readable only by the member themselves)
    getDoc(doc(db, 'rooms', roomId, 'members', user.uid))
      .then((snap) => {
        if (!snap.exists()) {
          navigate('/join', { replace: true })
        } else {
          setNickname((snap.data().nickname as string) ?? '')
          setAuthChecked(true)
        }
      })
      .catch(() => navigate('/join', { replace: true }))
  }, [user, authLoading, roomId, navigate])

  if (authLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Go home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <span className="text-gray-500 text-xs">Room</span>
          <p className="text-white font-mono font-medium text-sm">{roomId}</p>
        </div>

        {!roomLoading && roomDoc && (
          <CountdownTimer nextWipeAt={roomDoc.nextWipeAt} />
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} loading={roomLoading} myNickname={nickname} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-800">
        <MessageInput roomId={roomId!} nickname={nickname} />
      </div>
    </div>
  )
}
