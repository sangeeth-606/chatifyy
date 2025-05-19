import prisma from "./db.js";
export const roomSockets = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        // When a user sets their name
        socket.on("set-name", async (userName) => {
            try {
                // Create a new user in the database with the provided name
                const user = await prisma.user.create({
                    data: {
                        name: userName,
                    },
                });
                // Store the user ID on the socket for later use
                socket.userId = user.id;
                // Let the client know the name is set
                socket.emit("name-set", { userId: user.id });
            }
            catch (error) {
                console.error("Error setting name:", error);
                socket.emit("error", "Failed to set name");
            }
        });
        // When a user joins a room
        socket.on("join-room", async (roomName, peerId) => {
            // Check if the user has set their name first
            if (!socket.userId) {
                socket.emit("error", "Please set name first");
                return;
            }
            console.log("Join-room received:", roomName, peerId);
            try {
                // Find the room by name
                const room = await prisma.room.findUnique({ where: { name: roomName } });
                if (!room) {
                    console.error(`Room ${roomName} not found`);
                    socket.emit("error", "Room not found");
                    return;
                }
                // Join the socket to the room
                socket.join(roomName);
                // Notify others in the room that a user has connected
                socket.to(roomName).emit("user-connected", peerId);
                // Fetch previous messages for the room
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
                // Send previous messages to the joining user
                socket.emit("previous-messages", formattedMessages);
            }
            catch (error) {
                console.error("Error in join-room:", error);
                socket.emit("error", "An error occurred");
            }
            // Handle disconnection within the room
            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id, peerId);
                socket.to(roomName).emit("user-disconnected", peerId);
            });
        });
        // When a user sends a message
        socket.on("send-message", async ({ roomCode, message }) => {
            const userId = socket.userId;
            if (!userId) {
                console.error("User ID not set on socket");
                return;
            }
            console.log("Chat message received:", message, "for room:", roomCode);
            try {
                // Find the room by name
                const room = await prisma.room.findUnique({ where: { name: roomCode } });
                if (!room) {
                    console.error(`Room ${roomCode} not found`);
                    return;
                }
                // Find the user by ID
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    console.error(`User with id ${userId} not found`);
                    return;
                }
                // Save the new message to the database
                const newMessage = await prisma.chatMessage.create({
                    data: {
                        roomId: room.id,
                        userId: user.id,
                        message: message.text,
                    },
                });
                // Format the message for broadcasting
                const messageData = {
                    sender: user.name,
                    text: message.text,
                    timestamp: newMessage.createdAt,
                };
                // Send the message to everyone in the room
                io.to(roomCode).emit("receive-message", messageData);
            }
            catch (error) {
                console.error("Error saving message:", error);
            }
        });
        // Log when a socket disconnects
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
};
