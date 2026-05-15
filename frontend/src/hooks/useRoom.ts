import { useState, useEffect, useRef } from 'react'
import {
  onSnapshot,
  collection,
  doc,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  updateDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface Message {
  id: string
  text: string
  nickname: string
  createdAt: Timestamp | null
}

export interface RoomDoc {
  expiryMinutes: number
  nextWipeAt: Timestamp
  createdAt: Timestamp
}

async function wipeRoom(roomId: string, expiryMinutes: number): Promise<void> {
  const messagesRef = collection(db, 'rooms', roomId, 'messages')

  // Batch-delete all messages in chunks of 400 (under the 500 op limit)
  let hasMore = true
  while (hasMore) {
    const snap = await getDocs(query(messagesRef, limit(400)))
    if (snap.empty) break
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    hasMore = snap.size >= 400
  }

  const nextWipeAt = Timestamp.fromMillis(Date.now() + expiryMinutes * 60 * 1000)
  await updateDoc(doc(db, 'rooms', roomId), { nextWipeAt })
}

export function useRoom(roomId: string | undefined) {
  const [roomDoc, setRoomDoc] = useState<RoomDoc | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track in-progress wipe to avoid concurrent triggers
  const wipingRef = useRef(false)

  useEffect(() => {
    if (!roomId) return

    const unsubRoom = onSnapshot(
      doc(db, 'rooms', roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RoomDoc
          setRoomDoc(data)

          // Trigger client-side wipe if the timer has expired
          if (data.nextWipeAt.toMillis() <= Date.now() && !wipingRef.current) {
            wipingRef.current = true
            wipeRoom(roomId, data.expiryMinutes)
              .catch(console.error)
              .finally(() => {
                wipingRef.current = false
              })
          }
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    const messagesQuery = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    )

    const unsubMessages = onSnapshot(
      messagesQuery,
      (snap) => {
        const msgs: Message[] = snap.docs.map((d: DocumentData) => ({
          id: d.id,
          ...(d.data() as Omit<Message, 'id'>),
        }))
        setMessages(msgs)
      },
      (err) => setError(err.message)
    )

    return () => {
      unsubRoom()
      unsubMessages()
    }
  }, [roomId])

  return { roomDoc, messages, loading, error }
}
