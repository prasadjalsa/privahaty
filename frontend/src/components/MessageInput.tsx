import { useState, useRef, KeyboardEvent } from 'react'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { encryptMessage } from '../lib/encryption'

interface Props {
  roomId: string
  nickname: string
  secret: string
  expiryMinutes: number
}

const MAX_LENGTH = 2000

export default function MessageInput({ roomId, nickname, secret, expiryMinutes }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: await encryptMessage(trimmed, secret, roomId),
        nickname,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + expiryMinutes * 60 * 1000),
      })
      setText('')
      textareaRef.current?.focus()
    } catch (e) {
      console.error('Failed to send message', e)
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const remaining = MAX_LENGTH - text.length
  const nearLimit = remaining <= 200

  return (
    <div className="px-4 py-3 bg-gray-950">
      <div className="flex items-end gap-2 bg-gray-900 rounded-2xl border border-gray-800 px-4 py-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          className="flex-1 bg-transparent text-white text-sm resize-none outline-none max-h-32 placeholder-gray-600"
          style={{ minHeight: '1.5rem' }}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {nearLimit && (
            <span className={`text-xs tabular-nums ${remaining <= 50 ? 'text-red-400' : 'text-gray-500'}`}>
              {remaining}
            </span>
          )}
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
