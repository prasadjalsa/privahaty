import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Privahaty</h1>
        <p className="text-gray-400 mb-10 text-sm">
          Private rooms. Ephemeral messages. No accounts.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            to="/create"
            className="block w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg transition-colors"
          >
            Create a Room
          </Link>
          <Link
            to="/join"
            className="block w-full py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg transition-colors border border-gray-700"
          >
            Join a Room
          </Link>
        </div>

        <p className="mt-8 text-gray-600 text-xs">
          Messages are automatically wiped on a timer you choose.
          <br />
          Only people with the room ID and secret can join.
        </p>
      </div>
    </div>
  )
}
