import { useEffect, useRef, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Message } from '../hooks/useRoom'
import { decryptMessage } from '../lib/encryption'

interface Props {
  messages: Message[]
  loading: boolean
  myNickname: string
  secret: string
  roomId: string
}

function formatTime(ts: { toDate: () => Date } | null): string {
  if (!ts) return 'just now'
  const d = ts.toDate()
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatCountdown(expiresAt: Timestamp | null, now: number): string {
  if (!expiresAt) return ''
  const ms = expiresAt.toMillis() - now
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function MessageList({ messages, loading, myNickname, secret, roomId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [decrypted, setDecrypted] = useState<Record<string, string>>({})
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Single interval drives all per-message countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Decrypt any messages not yet decrypted
  useEffect(() => {
    if (!secret) return
    const undecrypted = messages.filter((m) => m.text && !decrypted[m.id])
    if (undecrypted.length === 0) return

    Promise.all(
      undecrypted.map((m) =>
        decryptMessage(m.text, secret, roomId)
          .then((plain) => ({ id: m.id, plain }))
          .catch(() => ({ id: m.id, plain: '[encrypted]' }))
      )
    ).then((results) => {
      setDecrypted((prev) => {
        const next = { ...prev }
        results.forEach(({ id, plain }) => { next[id] = plain })
        return next
      })
    })
  }, [messages, secret, roomId])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600 text-sm">No messages yet. Say something!</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => {
        const isOwn = msg.nickname === myNickname
        const text = decrypted[msg.id] ?? '…'
        const countdown = formatCountdown(msg.expiresAt, now)
        const msLeft = msg.expiresAt ? msg.expiresAt.toMillis() - now : Infinity
        const isUrgent = msLeft <= 60_000

        return (
          <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            <div className="flex items-baseline gap-2 mb-1">
              {!isOwn && (
                <span className="text-indigo-400 text-xs font-medium">{msg.nickname}</span>
              )}
              <span className="text-gray-600 text-xs">{formatTime(msg.createdAt)}</span>
            </div>
            <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  isOwn
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-800 text-gray-100 rounded-tl-sm'
                }`}
              >
                {text}
              </div>
              {countdown && (
                <span
                  className={`text-xs font-mono tabular-nums flex-shrink-0 ${
                    isUrgent ? 'text-red-400' : 'text-gray-600'
                  }`}
                >
                  {countdown}
                </span>
              )}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
