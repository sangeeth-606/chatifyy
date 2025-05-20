import prisma from "./db.js";
export const roomSockets = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        // When a user sets their name
        socket.on("set-name", async (userName) => {
            try {
                // First, try to find the user by name
                let user = await prisma.user.findFirst({
                    where: { name: userName }
                });
                // If user doesn't exist, create a new one
                if (!user) {
                    user = await prisma.user.create({
                        data: { name: userName }
                    });
                }
                socket.userId = user.id;
                socket.emit("name-set", { userId: user.id });
            }
            catch (error) {
                console.error("Error setting name:", error);
                socket.emit("error", "Failed to set name");
            }
        });
        // When a user joins a room
        socket.on("join-room", async (roomName, peerId) => {
            if (!socket.userId) {
                socket.emit("error", "Please set name first");
                return;
            }
            console.log("Join-room received:", roomName, peerId);
            try {
                const room = await prisma.room.findUnique({ where: { name: roomName } });
                if (!room) {
                    console.error(`Room ${roomName} not found`);
                    socket.emit("error", "Room not found");
                    return;
                }
                socket.join(roomName);
                socket.to(roomName).emit("user-connected", peerId);
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
            }
            catch (error) {
                console.error("Error in join-room:", error);
                socket.emit("error", "An error occurred");
            }
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
                socket.emit("error", "User not authenticated");
                return;
            }
            console.log("Chat message received:", message, "for room:", roomCode);
            try {
                const room = await prisma.room.findUnique({ where: { name: roomCode } });
                if (!room) {
                    console.error(`Room ${roomCode} not found`);
                    return;
                }
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    console.error(`User with id ${userId} not found`);
                    return;
                }
                const newMessage = await prisma.chatMessage.create({
                    data: {
                        roomId: room.id,
                        userId: user.id,
                        message: message.text,
                    },
                });
                const messageData = {
                    sender: user.name,
                    text: message.text,
                    timestamp: newMessage.createdAt,
                };
                io.to(roomCode).emit("receive-message", messageData);
            }
            catch (error) {
                console.error("Error saving message:", error);
            }
        });
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
};
