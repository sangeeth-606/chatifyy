import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    if (!roomCodeInput) {
      alert('Please enter a room code');
    } else if (roomCodeInput.length < 5) {
      alert('Room code should be 5 digits');
    } else {
      setCurrentRoomCode(roomCodeInput);
      setShowNameModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1915] via-[#24211c] to-[#1a1915] flex flex-col items-center justify-center text-[#f5f4ee]">
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-[#d97757] blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-[#f5f4ee] blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-[#d97757] blur-3xl"></div>
      </div>
      
      <div className="z-10 w-full max-w-md px-6 py-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-[#d97757] to-[#e99777] text-transparent bg-clip-text">Chatifyy</h1>
          <p className="text-[#f5f4ee]/80 text-lg">Connect instantly. Chat freely.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1915]/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-[#f5f4ee]/10"
        >
          <div className="flex flex-col items-center space-y-6">
            <button
              className="w-full px-6 py-3 bg-[#d97757] text-[#ffffff] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-[#c86746]"
              onClick={handleJoinNewRoom}
            >
              Create New Room
            </button>
            
            <div className="flex items-center w-full">
              <div className="h-px bg-[#f5f4ee]/10 flex-grow"></div>
              <p className="text-[#f5f4ee]/60 px-4">or join existing</p>
              <div className="h-px bg-[#f5f4ee]/10 flex-grow"></div>
            </div>
            
            <div className="flex items-center w-full space-x-2">
              <input
                type="text"
                placeholder="Enter Room Code"
                className="w-full px-4 py-3 bg-[#f5f4ee]/5 text-[#f5f4ee] placeholder:text-[#f5f4ee]/40 border border-[#f5f4ee]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d97757]/50 transition-all"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
              />
              <button
                className="px-5 py-3 bg-[#f5f4ee]/10 text-[#f5f4ee] rounded-xl hover:bg-[#f5f4ee]/15 transition-all duration-300 border border-[#f5f4ee]/10"
                onClick={handleJoinExistingRoom}
              >
                Join
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {showNameModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 backdrop-blur-md bg-[#1a1915]/70 flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-gradient-to-br from-[#24211c] to-[#1a1915] p-8 rounded-2xl shadow-2xl text-[#f5f4ee] border border-[#f5f4ee]/10 max-w-md w-full m-4"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">What should we call you?</h2>
            <p className="text-[#f5f4ee]/60 text-center mb-6">Your display name in room {currentRoomCode}</p>
            <input
              type="text"
              placeholder="Your Name"
              className="px-4 py-3 bg-[#f5f4ee]/5 text-[#f5f4ee] border border-[#f5f4ee]/10 rounded-xl w-full mb-6 focus:outline-none focus:ring-2 focus:ring-[#d97757]/50"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
            />
            <button
              className="w-full px-4 py-3 bg-[#d97757] text-[#ffffff] rounded-xl hover:shadow-lg transition-all duration-300 font-semibold hover:bg-[#c86746]"
              onClick={handleEnterChat}
            >
              Join Chat
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LandingPage;