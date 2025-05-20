import './App.css'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Chat from './components/Chat' // You'll need to create this component

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat/:roomCode" element={<Chat />} />
    </Routes>
  )
}

export default App
