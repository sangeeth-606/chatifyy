import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { X, Send } from "lucide-react";

interface ChatRoomProps {
  darkMode?: boolean;
}

const Chat: React.FC<ChatRoomProps> = ({ darkMode }) => {
  const location = useLocation();
  const { roomCode } = useParams<{ roomCode: string }>();
  const userId = location.state?.name || "Anonymous";

  const [messages, setMessages] = useState<
    { sender: string; text: string; timestamp: Date }[]
  >([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", { transports: ["polling"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("ChatRoom connected:", newSocket.id);
      newSocket.emit("join-room", roomCode, "chat-only");
    });

    newSocket.on("previous-messages", (prevMsgs) => {
      console.log("Previous messages received:", prevMsgs);
      setMessages(prevMsgs);
    });

    newSocket.on("receive-message", (message) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && socket) {
      const newMessage = {
        sender: userId,
        text: input,
        timestamp: new Date() // Adding timestamp
      };

      // Immediately update local state for instant feedback
      setMessages((prev) => [...prev, newMessage]);

      // Then emit to server
      socket.emit("send-message", { roomCode, message: newMessage, email: userId });

      // Clear input
      setInput("");

      // Debug logging
      console.log("Message sent:", newMessage);

      // Force scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(" ");
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
          className={darkMode ? "text-blue-400 hover:underline" : "text-blue-600 hover:underline"}
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
    <div 
      className={classNames(
        "h-full grid grid-rows-[auto_1fr_auto] rounded-md shadow-lg border-l",
        darkMode ? "bg-[#171717] border-[#3C3C3C]" : "bg-white border-gray-300"
      )}
      style={{ minHeight: '100%' }}
    >
      {/* Header - row 1: auto height */}
      <div
        className={classNames(
          "w-full p-4 border-b",
          darkMode ? "border-[#2C2C2C]" : "border-gray-300"
        )}
      >
        <h2 className={darkMode ? "text-white" : "text-gray-900"}>
          <span className={darkMode ? "text-emerald-500" : "text-emerald-600"}>Chat</span>
        </h2>
      </div>
      
      {/* Message area - row 2: takes all remaining space */}
      <div 
        className={classNames(
          "overflow-y-auto p-4",
          darkMode
            ? "scrollbar-thumb-[#2C2C2C] scrollbar-track-transparent"
            : "scrollbar-thumb-gray-400 scrollbar-track-gray-100"
        )}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={classNames(
              "w-full mb-2",
              msg.sender === userId ? "flex justify-end" : "flex justify-start"
            )}
          >
            <div
              className={classNames(
                "p-2 rounded-md max-w-[80%]",
                msg.sender === userId
                  ? darkMode
                    ? "bg-emerald-600"
                    : "bg-emerald-100"
                  : darkMode
                  ? "bg-[#2C2C2C]"
                  : "bg-gray-100"
              )}
            >
              <div
                className={classNames(
                  "text-xs mb-1 font-medium",
                  darkMode ? "text-emerald-500" : "text-emerald-600"
                )}
              >
                {msg.sender}
              </div>
              <div
                className={classNames(
                  "text-sm",
                  darkMode ? "text-white" : "text-gray-900"
                )}
              >
                {formatMessageWithLinks(msg.text)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area - row 3: auto height, always at bottom */}
      <div
        className={classNames(
          "w-full p-4 border-t",
          darkMode ? "border-[#2C2C2C]" : "border-gray-300"
        )}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className={classNames(
              "flex-1 p-2 rounded-md border focus:outline-none focus:border-emerald-500 text-sm",
              darkMode
                ? "bg-[#2C2C2C] text-white border-[#3C3C3C]"
                : "bg-white text-black border-gray-300"
            )}
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className={classNames(
              "p-2 rounded-md flex items-center justify-center",
              input.trim()
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : darkMode
                ? "bg-[#2C2C2C] text-gray-500 cursor-not-allowed"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
            disabled={!input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
