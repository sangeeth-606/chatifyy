import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { Send } from "lucide-react";

interface ChatRoomProps {}

const Chat: React.FC<ChatRoomProps> = () => {
  const location = useLocation();
  const { roomCode } = useParams<{ roomCode: string }>();
  const userId = location.state?.name || "Anonymous";

  const [messages, setMessages] = useState<
    { sender: string; text: string; timestamp: Date }[]
  >([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_USE_PRODUCTION === "true" 
      ? import.meta.env.VITE_API_URL_PRODUCTION 
      : import.meta.env.VITE_API_URL_LOCAL;
      
    const newSocket = io(backendUrl, { transports: ["polling"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("set-name", userId);

      newSocket.on("name-set", () => {
        newSocket.emit("join-room", roomCode, "chat-only");
      });
    });

    newSocket.on("previous-messages", (prevMsgs) => {
      setMessages(prevMsgs);
    });

    newSocket.on("receive-message", (message) => {
      if (lastSentMessageRef.current === message.text && message.sender === userId) {
        lastSentMessageRef.current = null;
        return;
      }
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomCode, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && socket) {
      lastSentMessageRef.current = input.trim();

      const newMessage = {
        sender: userId,
        text: input,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, newMessage]);

      socket.emit("send-message", { 
        roomCode, 
        message: { text: input } 
      });

      setInput("");

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const formatMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push(text.substring(lastIndex, match.index));
      }

      let url = match[0];
      if (url.startsWith("www.")) {
        url = "https://" + url;
      }

      segments.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d97757] hover:underline"
        >
          {match[0]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push(text.substring(lastIndex));
    }

    return segments;
  };

  return (
    <div className="h-screen grid grid-rows-[auto_1fr_auto] rounded-md shadow-lg border-l bg-[#262624] border-[#1b1b19] text-[#c3c0b6] font-sans">
      {/* Header */}
      <div className="w-full p-4 border-b border-[#1b1b19]">
        <h2 className="text-white flex items-center justify-between font-serif">
          <span className="text-[#d97757] font-bold">Room: {roomCode}</span>
          <span className="text-white text-sm font-sans font-medium">Logged in as: {userId}</span>
        </h2>
      </div>

      {/* Message List */}
      <div className="overflow-y-auto p-4 scrollbar-thumb-[#30302e] scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`w-full mb-2 ${
              msg.sender === userId ? "flex justify-end" : "flex justify-start"
            }`}
          >
            <div
              className={`p-2 max-w-[80%] ${
                msg.sender === userId
                  ? "text-right"
                  : "text-left"
              }`}
            >
              <div className={`text-xs mb-1 font-semibold font-serif ${
                msg.sender === userId ? "text-[#d97757]" : "text-white"
              }`}>
                {msg.sender}
              </div>
              <div className="text-sm text-white font-sans font-medium">
                {formatMessageWithLinks(msg.text)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="w-full p-4 border-t border-[#1b1b19]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 p-2 rounded-md border bg-[#30302e] text-white font-medium border-[#1b1b19] focus:outline-none focus:ring-2 focus:ring-[#d97757] font-sans"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className={`p-2 rounded-md flex items-center justify-center font-medium transition-colors duration-200 ${
              input.trim()
                ? "bg-[#d97757] hover:bg-[#b86246] text-white font-semibold shadow-sm"
                : "bg-[#30302e] text-[#7c7c78] cursor-not-allowed"
            }`}
            disabled={!input.trim()}
            title="Send message"
          >
            <Send size={18} className="stroke-current" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
