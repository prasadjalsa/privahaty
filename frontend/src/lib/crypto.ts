export async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function randomBase64url(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function randomAlphanum(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => chars[b % chars.length])
    .join('')
}

function fromBase64url(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    b64.length + ((4 - (b64.length % 4)) % 4), '='
  )
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

// Decrypts a QR code URL fragment produced by QRCodeDisplay.
// Fragment format: #k=BASE64URL_KEY&i=BASE64URL_IV&d=BASE64URL_CIPHERTEXT
export async function decryptQRFragment(
  fragment: string
): Promise<{ roomId: string; secret: string } | null> {
  try {
    const params = new URLSearchParams(fragment.replace(/^#/, ''))
    const k = params.get('k')
    const i = params.get('i')
    const d = params.get('d')
    if (!k || !i || !d) return null

    const key = await crypto.subtle.importKey(
      'raw', fromBase64url(k), { name: 'AES-GCM' }, false, ['decrypt']
    )
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64url(i) },
      key,
      fromBase64url(d)
    )
    const { r, s } = JSON.parse(new TextDecoder().decode(plaintext))
    if (typeof r !== 'string' || typeof s !== 'string') return null
    return { roomId: r, secret: s }
  } catch {
    return null
  }
}
