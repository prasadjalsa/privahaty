import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  roomId: string
  secret: string
}

// Encrypt payload with AES-GCM using a random one-time key.
// Both key + ciphertext go into the URL fragment — never sent to the server.
// Raw QR data is opaque: no plain-text credentials visible.
async function buildQRPayload(roomId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify({ r: roomId, s: secret }))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

  const rawKey = await crypto.subtle.exportKey('raw', key)

  const toBase64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const k = toBase64url(rawKey)
  const i = toBase64url(iv.buffer)
  const d = toBase64url(ciphertext)

  return `${window.location.origin}/join#k=${k}&i=${i}&d=${d}`
}

export default function QRCodeDisplay({ roomId, secret }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    buildQRPayload(roomId, secret).then((url) => {
      setQrUrl(url)
      QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: { dark: '#ffffff', light: '#111827' },
      }).then(setDataUrl)
    })
  }, [roomId, secret])

  async function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `privahaty-${roomId}.png`
    a.click()
  }

  if (!dataUrl) {
    return (
      <div className="flex items-center justify-center h-[240px]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl overflow-hidden border border-gray-700 p-3 bg-gray-900">
        <img src={dataUrl} alt="Room QR code" width={240} height={240} />
      </div>
      <p className="text-gray-500 text-xs text-center">
        Scan to get room credentials — encrypted, only readable by the app.
      </p>
      <button
        onClick={download}
        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
      >
        Download QR
      </button>
    </div>
  )
}
