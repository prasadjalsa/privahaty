import { useState } from 'react'
import QRCodeDisplay from './QRCodeDisplay'

interface Props {
  roomId: string
  secret: string
}

function CopyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-gray-800 rounded-xl border border-gray-700 px-4 py-3">
        <span className={`flex-1 text-white text-sm ${mono ? 'font-mono' : ''} truncate`}>
          {value}
        </span>
        <button
          onClick={copy}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex-shrink-0 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function RoomCredentials({ roomId, secret }: Props) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="space-y-4">
      <CopyField label="Room ID" value={roomId} mono />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-gray-400 text-xs">Secret</label>
          <button
            onClick={() => setRevealed((r) => !r)}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            {revealed ? 'Hide' : 'Reveal'}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-xl border border-gray-700 px-4 py-3">
          <span className="flex-1 text-white text-sm font-mono tracking-wider truncate">
            {revealed ? secret : '••••••••••••••••••••••'}
          </span>
          <button
            onClick={async () => { await navigator.clipboard.writeText(secret) }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex-shrink-0 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <p className="text-gray-400 text-xs mb-3 text-center">
          Or share via QR code
        </p>
        <QRCodeDisplay roomId={roomId} secret={secret} />
      </div>
    </div>
  )
}
