# Chatifyy

Chatifyy is a real-time chat application that allows users to create and join chat rooms instantly. It features a modern, sleek UI and provides seamless communication between users.


## Features

- **Instant Room Creation**: Generate a unique room code with one click
- **Join Existing Rooms**: Enter a room code to join ongoing conversations
- **Real-time Messaging**: Messages appear instantly for all users in the room
- **Persistent Chat History**: View previous messages when joining a room
- **User Identity**: Set your display name before joining a chat room
- **Modern UI**: Clean, responsive design with smooth animations

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Real-time Communication**: WebSockets via Socket.IO

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/sangeeth-606/chatifyy
cd chatifyy
```

2. Install dependencies for both client and server
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# In the server directory, create a .env file with:
DATABASE_URL="postgresql://username:password@localhost:5432/chatifyy"
PORT=5000
```

4. Set up the database
```bash
# In the server directory
npx prisma migrate dev
```

### Running the Application

1. Start the server
```bash
# In the server directory
npm start
```

2. Start the client
```bash
# In the client directory
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. On the landing page, choose to create a new room or join an existing one
2. Enter your display name when prompted
3. Start chatting in real-time with other users in the room
4. Share the room code with others so they can join the same chat room

## Acknowledgements

- [Socket.IO](https://socket.io/)
- [React](https://reactjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)