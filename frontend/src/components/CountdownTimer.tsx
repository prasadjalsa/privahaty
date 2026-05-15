import { useState, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'

interface Props {
  nextExpiresAt: Timestamp | null
}

function formatMMSS(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function CountdownTimer({ nextExpiresAt }: Props) {
  const [remaining, setRemaining] = useState<number | null>(
    nextExpiresAt ? nextExpiresAt.toMillis() - Date.now() : null
  )

  useEffect(() => {
    if (!nextExpiresAt) { setRemaining(null); return }

    setRemaining(nextExpiresAt.toMillis() - Date.now())
    const interval = setInterval(() => {
      setRemaining(nextExpiresAt.toMillis() - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [nextExpiresAt])

  if (remaining === null) {
    return (
      <div className="text-right">
        <p className="text-gray-600 text-xs">no messages</p>
      </div>
    )
  }

  const isUrgent = remaining <= 60_000 && remaining > 0

  return (
    <div className="text-right">
      <p className="text-gray-500 text-xs">oldest msg expires</p>
      <p className={`font-mono font-semibold text-sm tabular-nums ${isUrgent ? 'text-red-400' : 'text-green-400'}`}>
        {remaining <= 0 ? 'expiring…' : formatMMSS(remaining)}
      </p>
    </div>
  )
}
