import { useState, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'

interface Props {
  nextWipeAt: Timestamp
}

function formatMMSS(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function CountdownTimer({ nextWipeAt }: Props) {
  const [remaining, setRemaining] = useState(() => nextWipeAt.toMillis() - Date.now())
  const [wiping, setWiping] = useState(false)

  useEffect(() => {
    setRemaining(nextWipeAt.toMillis() - Date.now())
    setWiping(false)

    const interval = setInterval(() => {
      const diff = nextWipeAt.toMillis() - Date.now()
      setRemaining(diff)
      if (diff <= 0) {
        setWiping(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [nextWipeAt])

  const isUrgent = remaining <= 60_000 && remaining > 0

  return (
    <div className="text-right">
      <p className="text-gray-500 text-xs">wipes in</p>
      <p
        className={`font-mono font-semibold text-sm tabular-nums ${
          wiping ? 'text-gray-500' : isUrgent ? 'text-red-400' : 'text-green-400'
        }`}
      >
        {wiping ? 'wiping…' : formatMMSS(remaining)}
      </p>
    </div>
  )
}
