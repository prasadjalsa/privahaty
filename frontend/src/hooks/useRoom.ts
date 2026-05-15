import { useState, useEffect, useRef } from 'react'
import {
  onSnapshot,
  collection,
  doc,
  query,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
  DocumentData,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface Message {
  id: string
  text: string
  nickname: string
  createdAt: Timestamp | null
  expiresAt: Timestamp | null
}

export interface RoomDoc {
  expiryMinutes: number
  createdAt: Timestamp
}

async function deleteMessages(roomId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  // Process in chunks of 400 (under the 500 op batch limit)
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db)
    ids.slice(i, i + 400).forEach((id) =>
      batch.delete(doc(db, 'rooms', roomId, 'messages', id))
    )
    await batch.commit()
  }
}

export function useRoom(roomId: string | undefined) {
  const [roomDoc, setRoomDoc] = useState<RoomDoc | null>(null)
  const [rawMessages, setRawMessages] = useState<Message[]>([])
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [nextExpiresAt, setNextExpiresAt] = useState<Timestamp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const deletingRef = useRef<Set<string>>(new Set())

  // Subscribe to Firestore
  useEffect(() => {
    if (!roomId) return

    const unsubRoom = onSnapshot(
      doc(db, 'rooms', roomId),
      (snap) => {
        if (snap.exists()) setRoomDoc(snap.data() as RoomDoc)
        setLoading(false)
      },
      (err) => { setError(err.message); setLoading(false) }
    )

    const unsubMessages = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(500)
      ),
      (snap) => {
        const msgs: Message[] = snap.docs.map((d: DocumentData) => ({
          id: d.id,
          ...(d.data() as Omit<Message, 'id'>),
        }))
        setRawMessages(msgs)
      },
      (err) => setError(err.message)
    )

    return () => { unsubRoom(); unsubMessages() }
  }, [roomId])

  // Every second: filter out expired messages and delete them from Firestore
  useEffect(() => {
    if (!roomId) return

    function tick() {
      const now = Date.now()
      const visible: Message[] = []
      const expiredIds: string[] = []

      for (const msg of rawMessages) {
        if (msg.expiresAt && msg.expiresAt.toMillis() <= now) {
          if (!deletingRef.current.has(msg.id)) {
            expiredIds.push(msg.id)
            deletingRef.current.add(msg.id)
          }
        } else {
          visible.push(msg)
        }
      }

      setVisibleMessages(visible)

      // Earliest expiry among visible messages → drives the countdown timer
      const earliest = visible.reduce<Timestamp | null>((min, m) => {
        if (!m.expiresAt) return min
        if (!min || m.expiresAt.toMillis() < min.toMillis()) return m.expiresAt
        return min
      }, null)
      setNextExpiresAt(earliest)

      if (expiredIds.length > 0 && roomId) {
        deleteMessages(roomId, expiredIds)
          .catch(console.error)
          .finally(() => {
            expiredIds.forEach((id) => deletingRef.current.delete(id))
          })
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [rawMessages, roomId])

  return { roomDoc, messages: visibleMessages, nextExpiresAt, loading, error }
}
