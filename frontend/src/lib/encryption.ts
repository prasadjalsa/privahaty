const PBKDF2_ITERATIONS = 100_000

// Derives a 256-bit AES-GCM key from the room secret using PBKDF2.
// The roomId is used as the salt so keys are unique per room even if secrets collide.
async function deriveKey(secret: string, roomId: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(roomId),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypts plaintext and returns a base64 string: iv (12 bytes) + ciphertext
export async function encryptMessage(plaintext: string, secret: string, roomId: string): Promise<string> {
  const key = await deriveKey(secret, roomId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

// Decrypts a base64 string produced by encryptMessage
export async function decryptMessage(encrypted: string, secret: string, roomId: string): Promise<string> {
  const key = await deriveKey(secret, roomId)
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
