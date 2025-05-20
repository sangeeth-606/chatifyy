import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [currentRoomCode, setCurrentRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const generateRoomCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const handleJoinNewRoom = () => {
    const newRoomCode = generateRoomCode();
    setCurrentRoomCode(newRoomCode);
    setShowNameModal(true);
  };

  const handleJoinExistingRoom = () => {
    if (roomCodeInput) {
      setCurrentRoomCode(roomCodeInput);
      setShowNameModal(true);
    } else {
      alert('Please enter a room code');
    }
  };

  const handleEnterChat = () => {
    if (userName && currentRoomCode) {
      navigate(`/chat/${currentRoomCode}`, { state: { name: userName } });
    } else {
      alert('Please enter your name');
    }
  };

  return (
    <div className="min-h-screen bg-[#262624] flex flex-col items-center justify-center text-[#c3c0b6]">
      <h1 className="text-4xl font-bold mb-8">Chatifyy</h1>
      <div className="flex flex-col items-center space-y-4">
        <button
          className="px-4 py-2 bg-[#d97757] text-[#EBEBEB] rounded hover:bg-[#b86246] transition"
          onClick={handleJoinNewRoom}
        >
          Join a New Room
        </button>
        <p className="text-[#b7b5a9]">or</p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter Room Code"
            className="px-3 py-2 bg-[#30302e] text-[#e5e5e2] border border-[#1b1b19] rounded focus:outline-none focus:ring-2 focus:ring-[#d97757]"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-[#faf0e6] text-[#30302e] rounded hover:bg-[#e0d8c9] transition"
            onClick={handleJoinExistingRoom}
          >
            Join
          </button>
        </div>
      </div>

      {showNameModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-[#30302e]/80 backdrop-blur-md p-8 rounded-xl shadow-2xl text-[#e5e5e2] border border-[#ffffff10] max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">What should we call you?</h2>
            <input
              type="text"
              placeholder="Your Name"
              className="px-4 py-3 bg-[#262624]/50 text-[#e5e5e2] border border-[#ffffff20] rounded-lg w-full mb-6 focus:outline-none focus:ring-2 focus:ring-[#d97757]"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
            />
            <button
              className="w-full px-4 py-3 bg-[#d97757] text-[#EBEBEB] rounded-lg hover:bg-[#b86246] transition-all shadow-md"
              onClick={handleEnterChat}
            >
              Join Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;