import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// ── Models ───────────────────────────────────────────────────────────────────
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}));

const Meeting = mongoose.model('Meeting', new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hostName: String,
  createdAt: { type: Date, default: Date.now },
}));

// ── Auth middleware ───────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already in use' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

// ── Meeting routes ────────────────────────────────────────────────────────────
app.post('/api/meetings', auth, async (req, res) => {
  try {
    const roomId = [0,1,2].map(() => Math.random().toString(36).substring(2,5).toUpperCase()).join('-');
    const meeting = await Meeting.create({ roomId, hostId: req.user.id, hostName: req.user.name });
    res.status(201).json(meeting);
  } catch { res.status(500).json({ error: 'Failed to create meeting' }); }
});

app.get('/api/meetings/:roomId', auth, async (req, res) => {
  const meeting = await Meeting.findOne({ roomId: req.params.roomId.toUpperCase() });
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json(meeting);
});

app.get('/api/meetings', auth, async (req, res) => {
  const meetings = await Meeting.find({ hostId: req.user.id }).sort({ createdAt: -1 }).limit(10);
  res.json(meetings);
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
// rooms:    Map<roomId, Map<socketId, { name, userId }>>
// roomMeta: Map<roomId, { hostSocketId, locked }>
const rooms    = new Map();
const roomMeta = new Map();

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join-room', ({ roomId, userName, userId }) => {
    const rid = roomId.toUpperCase();
    currentRoom = rid;
    socket.join(rid);

    if (!rooms.has(rid))    rooms.set(rid, new Map());
    if (!roomMeta.has(rid)) roomMeta.set(rid, { hostSocketId: null, locked: false });

    const room = rooms.get(rid);
    const meta = roomMeta.get(rid);

    // Reject if room is locked (and there IS a live host)
    const hostAlive = meta.hostSocketId && room.has(meta.hostSocketId);
    if (meta.locked && hostAlive) {
      socket.emit('join-rejected', 'Room is locked by the host');
      socket.leave(rid);
      currentRoom = null;
      return;
    }

    // Evict stale socket for same userId
    for (const [sid, data] of room.entries()) {
      if (data.userId === userId && sid !== socket.id) {
        room.delete(sid);
        io.to(rid).emit('peer-left', { socketId: sid });
        if (meta.hostSocketId === sid) meta.hostSocketId = socket.id;
      }
    }

    // Assign host if none
    if (!meta.hostSocketId || !room.has(meta.hostSocketId)) {
      meta.hostSocketId = socket.id;
    }

    const isHost = meta.hostSocketId === socket.id;

    // Send existing participants (excluding self userId)
    const existing = [...room.entries()]
      .filter(([, d]) => d.userId !== userId)
      .map(([sid, d]) => ({ socketId: sid, name: d.name, userId: d.userId }));

    socket.emit('existing-participants', existing);
    socket.emit('your-role', { isHost, hostSocketId: meta.hostSocketId, locked: meta.locked });
    socket.to(rid).emit('peer-joined', { socketId: socket.id, name: userName, userId });

    room.set(socket.id, { name: userName, userId });
    io.to(rid).emit('participant-count', room.size);
  });

  // ── WebRTC signaling ───────────────────────────────────────────────────────
  socket.on('offer',         ({ to, offer })      => io.to(to).emit('offer',         { from: socket.id, offer }));
  socket.on('answer',        ({ to, answer })     => io.to(to).emit('answer',        { from: socket.id, answer }));
  socket.on('ice-candidate', ({ to, candidate })  => io.to(to).emit('ice-candidate', { from: socket.id, candidate }));

  // ── Media state ────────────────────────────────────────────────────────────
  socket.on('media-state', ({ audio, video, screen }) => {
    socket.to(currentRoom).emit('peer-media-state', { socketId: socket.id, audio, video, screen });
  });

  // ── Chat ───────────────────────────────────────────────────────────────────
  socket.on('chat-message', ({ message }) => {
    const room   = rooms.get(currentRoom);
    const sender = room?.get(socket.id);
    if (!sender || !message?.trim()) return;
    io.to(currentRoom).emit('chat-message', {
      id:      `${socket.id}-${Date.now()}-${Math.random()}`,
      name:    sender.name,
      message: message.trim(),
      time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      socketId: socket.id,
    });
  });

  // ── Host controls ──────────────────────────────────────────────────────────
  const assertHost = () => roomMeta.get(currentRoom)?.hostSocketId === socket.id;

  socket.on('host:mute', ({ targetSocketId }) => {
    if (!assertHost()) return;
    io.to(targetSocketId).emit('force-mute');
  });

  socket.on('host:request-unmute', ({ targetSocketId }) => {
    if (!assertHost()) return;
    io.to(targetSocketId).emit('unmute-request');
  });

  socket.on('host:kick', ({ targetSocketId }) => {
    if (!assertHost()) return;
    io.to(targetSocketId).emit('you-were-kicked');
    const room = rooms.get(currentRoom);
    room?.delete(targetSocketId);
    io.to(currentRoom).emit('peer-left', { socketId: targetSocketId });
    io.to(currentRoom).emit('participant-count', room?.size || 0);
  });

  socket.on('host:toggle-lock', () => {
    if (!assertHost()) return;
    const meta = roomMeta.get(currentRoom);
    if (!meta) return;
    meta.locked = !meta.locked;
    io.to(currentRoom).emit('room-lock-changed', { locked: meta.locked });
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    const meta = roomMeta.get(currentRoom);
    if (!room) return;

    room.delete(socket.id);
    socket.to(currentRoom).emit('peer-left', { socketId: socket.id });

    if (room.size === 0) {
      rooms.delete(currentRoom);
      roomMeta.delete(currentRoom);
    } else {
      if (meta?.hostSocketId === socket.id) {
        meta.hostSocketId = room.keys().next().value;
        io.to(currentRoom).emit('host-changed', { newHostSocketId: meta.hostSocketId });
      }
      io.to(currentRoom).emit('participant-count', room.size);
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });
