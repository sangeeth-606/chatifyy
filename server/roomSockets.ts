import { Server, Socket } from 'socket.io';
import prisma from "./db.js";

interface MessageData {
  text: string;
}

interface MessageResponse {
  sender: string;
  text: string;
  timestamp: Date;
}

export const roomSockets = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    // When a user sets their name
    socket.on("set-name", async (userName: string) => {
      try {
        console.log("Setting name for user:", userName);
        // First, try to find the user by name
        let user = await prisma.user.findFirst({
          where: { name: userName }
        });
        
        // If user doesn't exist, create a new one
        if (!user) {
          console.log("Creating new user:", userName);
          user = await prisma.user.create({
            data: { name: userName }
          });
          console.log("User created with ID:", user.id);
        } else {
          console.log("Found existing user with ID:", user.id);
        }
        
        (socket as any).userId = user.id;
        socket.emit("name-set", { userId: user.id });
      } catch (error) {
        console.error("Error setting name:", error);
        socket.emit("error", "Failed to set name");
      }
    });

    // When a user joins a room
    socket.on("join-room", async (roomName: string, peerId: string) => {
      const userId = (socket as any).userId;
      if (!userId) {
        socket.emit("error", "Please set name first");
        return;
      }
      console.log("Join-room received:", roomName, peerId);
      try {
        let room = await prisma.room.findUnique({ where: { name: roomName } });
        if (!room) {
          console.log(`Room ${roomName} not found, creating new room with owner ${userId}`);
          try {
            room = await prisma.room.create({
              data: {
                name: roomName,
                ownerId: userId,
              }
            });
            console.log(`Created room with ID: ${room.id}`);
          } catch (createError:any) {
            if (createError.code === 'P2002') {
              console.log(`Room ${roomName} was created by another user, fetching existing room`);
              room = await prisma.room.findUnique({ where: { name: roomName } });
              if (!room) {
                throw new Error(`Room ${roomName} not found after creation failure`);
              }
            } else {
              throw createError;
            }
          }
        }
        // Now, join the room
        socket.join(roomName);
        socket.to(roomName).emit("user-connected", peerId);

        // Fetch previous messages
        const messages = await prisma.chatMessage.findMany({
          where: { roomId: room.id },
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true } } },
        });
        const formattedMessages = messages.map((msg) => ({
          sender: msg.user.name,
          text: msg.message,
          timestamp: msg.createdAt,
        }));
        socket.emit("previous-messages", formattedMessages);
      } catch (error) {
        console.error("Error in join-room:", error);
        socket.emit("error", "An error occurred");
      }

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id, peerId);
        socket.to(roomName).emit("user-disconnected", peerId);
      });
    });

    // When a user sends a message
    socket.on("send-message", async ({ roomCode, message }: { roomCode: string, message: MessageData }) => {
      const userId = (socket as any).userId;
      console.log("Received message with structure:", JSON.stringify({ roomCode, message }));
      console.log("User ID from socket:", userId);
      
      if (!userId) {
        console.error("User ID not set on socket");
        socket.emit("error", "User not authenticated");
        return;
      }
      
      console.log("Chat message received:", message, "for room:", roomCode);
      try {
        const room = await prisma.room.findUnique({ where: { name: roomCode } });
        if (!room) {
          console.error(`Room ${roomCode} not found`);
          socket.emit("error", "Room not found");
          return;
        }
        console.log(`Found room: ${room.id} for name ${roomCode}`);
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          console.error(`User with id ${userId} not found`);
          socket.emit("error", "User not found");
          return;
        }
        console.log(`Found user: ${user.name} with id ${userId}`);
        
        console.log(`Creating chat message: roomId=${room.id}, userId=${user.id}, text=${message.text}`);
        const newMessage = await prisma.chatMessage.create({
          data: {
            roomId: room.id,
            userId: user.id,
            message: message.text,
          },
        });
        
        console.log("Message saved with ID:", newMessage.id);
        const messageData: MessageResponse = {
          sender: user.name,
          text: message.text,
          timestamp: newMessage.createdAt,
        };
        io.to(roomCode).emit("receive-message", messageData);
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("error", "Failed to save message");
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};