interface Props {
  open: boolean
  onClose: () => void
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3 pb-2 border-b border-gray-800">
      {title}
    </h3>
    {children}
  </div>
)

const Step = ({ n, text }: { n: number; text: string }) => (
  <div className="flex gap-3 mb-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
      {n}
    </span>
    <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
  </div>
)

const Q = ({ q, a }: { q: string; a: string }) => (
  <div className="mb-4">
    <p className="text-white text-sm font-medium mb-1">{q}</p>
    <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
  </div>
)

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mr-2 mb-2 ${color}`}>
    {label}
  </span>
)

export default function HelpPanel({ open, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-950 border-l border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Help & Documentation</h2>
            <p className="text-gray-500 text-xs mt-0.5">Everything you need to know</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none p-1"
            aria-label="Close help panel"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">

          {/* ── Getting Started ── */}
          <Section title="Getting Started">
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Privahaty is a private, ephemeral chat app. No accounts, no logs — just a room ID,
              a secret, and a countdown.
            </p>

            <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2">Creating a room</p>
            <Step n={1} text='Click "Create a Room" on the home screen.' />
            <Step n={2} text="Choose how long until messages are wiped: 10 min, 30 min, or 1 hour." />
            <Step n={3} text="Enter a nickname for yourself." />
            <Step n={4} text="Click Create Room — you'll receive a Room ID and a Secret. Save both immediately; the secret cannot be recovered after you leave this page." />
            <Step n={5} text="Share the Room ID and Secret with the people you want to chat with — over a secure channel (e.g. Signal, in person)." />
            <Step n={6} text="Click Enter Room to start chatting." />

            <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide mt-4 mb-2">Joining a room</p>
            <Step n={1} text='Click "Join a Room" on the home screen.' />
            <Step n={2} text="Enter the Room ID, Secret, and your nickname." />
            <Step n={3} text="Click Join Room. You'll be taken directly into the chat." />
          </Section>

          {/* ── Using the Chat ── */}
          <Section title="Using the Chat">
            <p className="text-gray-400 text-sm mb-3 leading-relaxed">
              The chat room shows a live countdown timer in the header. When it reaches zero,
              all messages are wiped automatically and the timer resets — the room stays open.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p><span className="text-white font-medium">Send a message:</span> Press Enter or click Send.</p>
              <p><span className="text-white font-medium">New line:</span> Press Shift + Enter.</p>
              <p><span className="text-white font-medium">Character limit:</span> 2,000 characters per message.</p>
              <p><span className="text-white font-medium">Message history:</span> Last 200 messages are shown.</p>
              <p><span className="text-white font-medium">Returning later:</span> Re-enter the Room ID and Secret to rejoin. Your session resets when you close the tab.</p>
            </div>
          </Section>

          {/* ── How It Works ── */}
          <Section title="How It Works">
            <div className="space-y-4 text-sm">

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-white font-medium mb-1">Room Creation</p>
                <p className="text-gray-400 leading-relaxed">
                  The Room ID (8 characters) and Secret (22 characters, 128-bit entropy) are
                  generated entirely in your browser using the Web Crypto API —
                  they never touch a server. The secret is shown once and never stored anywhere in
                  plain form.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-white font-medium mb-1">Secret Verification</p>
                <p className="text-gray-400 leading-relaxed">
                  A SHA-256 hash of the secret is stored in a Firestore document that is permanently
                  locked to write-only — even you cannot read it back. When someone joins, their
                  browser computes the hash and Firestore's security rules verify it server-side
                  without ever exposing the stored hash to any client.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-white font-medium mb-1">End-to-End Encryption</p>
                <p className="text-gray-400 leading-relaxed">
                  Before a message leaves your browser, it is encrypted with AES-256-GCM. The
                  encryption key is derived from the room secret using PBKDF2 (100,000 iterations,
                  SHA-256) with the Room ID as the salt. Each message uses a unique random IV.
                  Firestore stores only ciphertext — meaningless to anyone without the secret.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-white font-medium mb-1">Message Wipe</p>
                <p className="text-gray-400 leading-relaxed">
                  Wipes are triggered client-side. When any active room member's browser detects
                  the countdown has expired, it batch-deletes all messages from Firestore (in
                  chunks of 400) and resets the timer. If no one is in the room, the wipe happens
                  the next time anyone opens it.
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-white font-medium mb-1">Real-time Sync</p>
                <p className="text-gray-400 leading-relaxed">
                  Messages are delivered instantly using Firestore's real-time listeners
                  (onSnapshot). There is no polling — all connected clients receive updates within
                  milliseconds of a message being sent.
                </p>
              </div>
            </div>
          </Section>

          {/* ── Security Model ── */}
          <Section title="Security Model">
            <div className="flex flex-wrap mb-4">
              <Badge label="AES-256-GCM" color="bg-indigo-900/60 text-indigo-300" />
              <Badge label="PBKDF2" color="bg-indigo-900/60 text-indigo-300" />
              <Badge label="SHA-256" color="bg-indigo-900/60 text-indigo-300" />
              <Badge label="128-bit secret entropy" color="bg-green-900/60 text-green-300" />
              <Badge label="No accounts" color="bg-gray-800 text-gray-300" />
              <Badge label="No logs" color="bg-gray-800 text-gray-300" />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-800 text-sm mb-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Who</th>
                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Can read messages?</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Anyone on the internet', 'No — Firestore rules block access'],
                    ['Someone with only the Room ID', 'No — secret required'],
                    ['Room members', 'Yes — by design'],
                    ['Firebase / Google admins', 'No — only encrypted ciphertext is stored'],
                    ['App owner / developer', 'No — same as above'],
                  ].map(([who, can], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/50'}>
                      <td className="px-4 py-2.5 text-gray-300">{who}</td>
                      <td className={`px-4 py-2.5 font-medium ${can.startsWith('Yes') ? 'text-green-400' : 'text-red-400'}`}>
                        {can}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-3">
              <p className="text-yellow-400 text-xs font-medium mb-1">Important limitations</p>
              <ul className="text-yellow-300/80 text-xs space-y-1 list-disc list-inside">
                <li>The secret is only as safe as how you share it. Use a secure channel (e.g. Signal).</li>
                <li>Anyone with the secret can read all messages — treat it like a password.</li>
                <li>Client-side wipe only runs when someone is in the room.</li>
                <li>Messages in transit are protected by HTTPS in addition to E2EE.</li>
              </ul>
            </div>
          </Section>

          {/* ── FAQ ── */}
          <Section title="FAQ">
            <Q
              q="Can Firebase or Google read my messages?"
              a="No. All messages are encrypted with AES-256-GCM before being stored. Firestore only ever holds ciphertext — without the room secret, it is unreadable by anyone including us."
            />
            <Q
              q="What happens when the timer expires?"
              a="All messages are permanently deleted from Firestore. The room ID and secret remain valid and the timer resets — you can keep chatting in the same room."
            />
            <Q
              q="Can deleted messages be recovered?"
              a="No. Messages are hard-deleted from Firestore. There are no backups, no archives, and no way to recover them."
            />
            <Q
              q="What happens if I close the tab?"
              a="Your session ends. The room and its messages are unaffected. To rejoin, go to Join a Room and re-enter the Room ID and Secret."
            />
            <Q
              q="Can multiple people join the same room?"
              a="Yes — any number of people who have the Room ID and Secret can join and chat simultaneously."
            />
            <Q
              q="Can two people use the same nickname?"
              a="Yes. There is no uniqueness check on nicknames. It may cause confusion but has no effect on security."
            />
            <Q
              q="What if nobody is in the room when the timer expires?"
              a="The wipe is deferred. It will trigger automatically the next time any member opens the room."
            />
            <Q
              q="Is there a limit on how many rooms I can create?"
              a="There is no enforced limit, but the app runs on Firebase's free Spark plan which has monthly read/write quotas. For personal or small-group use, you are very unlikely to hit them."
            />
            <Q
              q="Can I use this on mobile?"
              a="Yes. The app is fully responsive and works in any modern mobile browser."
            />
            <Q
              q="Is the source code available?"
              a="Yes — the full source is on GitHub. The app is open source so you can audit exactly what it does."
            />
          </Section>

          {/* ── Tech Stack ── */}
          <Section title="Tech Stack">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Frontend', 'React + TypeScript'],
                ['Styling', 'Tailwind CSS'],
                ['Build tool', 'Vite'],
                ['Database', 'Firebase Firestore'],
                ['Auth', 'Firebase Anonymous Auth'],
                ['Hosting', 'Firebase Hosting'],
                ['Encryption', 'Web Crypto API (built-in)'],
                ['CI/CD', 'GitHub Actions'],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-white text-xs font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </>
  )
}
