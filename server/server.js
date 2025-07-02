const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// REST API to join/create room
app.post('/api/rooms/join', async (req, res) => {
    const { roomId } = req.body;
    let room = await Room.findOne({ roomId });
    if (!room) {
        room = await Room.create({ roomId });
    }
    res.json(room);
});

// Store usernames by room and socket
const roomUsers = {}; // roomId => { socketId: username }
const socketToRoom = {}; // socketId => roomId
const socketToUsername = {}; // socketId => username

io.on('connection', (socket) => {
    console.log(`🟢 Connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`🔗 ${username} (${socket.id}) joined room: ${roomId}`);

        // Store user info
        if (!roomUsers[roomId]) roomUsers[roomId] = {};
        roomUsers[roomId][socket.id] = username;
        socketToRoom[socket.id] = roomId;
        socketToUsername[socket.id] = username;

        // Send previous drawing to new user
        const room = await Room.findOne({ roomId });
        if (room && room.drawingData.length > 0) {
            socket.emit('load-drawing', room.drawingData);
        }

        // Broadcast updated user list
        const userList = Object.values(roomUsers[roomId]);
        io.to(roomId).emit('presence-update', userList);
    });

    socket.on('draw', async (data) => {
        socket.to(data.roomId).emit('draw', data);

        await Room.findOneAndUpdate(
            { roomId: data.roomId },
            {
                $push: {
                    drawingData: {
                        type: 'stroke',
                        data: {
                            fromX: data.fromX,
                            fromY: data.fromY,
                            toX: data.toX,
                            toY: data.toY,
                            color: data.color,
                            strokeWidth: data.strokeWidth
                        }
                    }
                },
                $set: { lastActivity: new Date() }
            }
        );
    });

    socket.on('clear-canvas', async (roomId) => {
        io.to(roomId).emit('clear-canvas');

        await Room.findOneAndUpdate(
            { roomId },
            {
                $push: {
                    drawingData: {
                        type: 'clear',
                        data: {}
                    }
                },
                $set: { lastActivity: new Date() }
            }
        );
    });

    socket.on('cursor-move', ({ roomId, x, y, username }) => {
        socket.to(roomId).emit('cursor-update', {
            socketId: socket.id,
            x,
            y,
            username
        });
    });

    socket.on('disconnecting', () => {
        const roomId = socketToRoom[socket.id];

        if (roomId && roomUsers[roomId]) {
            delete roomUsers[roomId][socket.id];
            const userList = Object.values(roomUsers[roomId]);
            io.to(roomId).emit('presence-update', userList);
            io.to(roomId).emit('user-disconnected', socket.id);
        }

        delete socketToRoom[socket.id];
        delete socketToUsername[socket.id];
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Disconnected: ${socket.id}`);
    });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
