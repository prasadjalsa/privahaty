import { useEffect, useRef } from 'react'
import { Message } from '../hooks/useRoom'

interface Props {
  messages: Message[]
  loading: boolean
  myNickname: string
}

function formatTime(ts: { toDate: () => Date } | null): string {
  if (!ts) return 'just now'
  const d = ts.toDate()
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageList({ messages, loading, myNickname }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        return (
          <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            <div className="flex items-baseline gap-2 mb-1">
              {!isOwn && (
                <span className="text-indigo-400 text-xs font-medium">{msg.nickname}</span>
              )}
              <span className="text-gray-600 text-xs">{formatTime(msg.createdAt)}</span>
            </div>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                isOwn
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
