import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import JoinPage from './pages/JoinPage'
import RoomPage from './pages/RoomPage'
import HelpPanel from './components/HelpPanel'

export default function App() {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating help button — visible on every page */}
      <button
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-5 right-5 z-30 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-colors flex items-center justify-center text-sm font-bold shadow-lg"
        aria-label="Open help"
      >
        ?
      </button>

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </BrowserRouter>
  )
}
