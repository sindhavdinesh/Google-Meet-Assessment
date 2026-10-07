import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 5e7 // 50MB for file transfers
});

// State storage
// rooms: { [roomId]: { hostId: string, participants: { [socketId]: participantData }, waitingRoom: { [socketId]: participantData } } }
const rooms = new Map();

// Helper to get or create room
function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      hostId: null,
      participants: new Map(),
      waitingRoom: new Map(),
      chatMessages: []
    });
  }
  return rooms.get(roomId);
}

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/create-room', (req, res) => {
  const roomId = uuidv4().substring(0, 11).replace(/(.{3})(.{4})(.{3})/, '$1-$2-$3') || uuidv4().substring(0, 9);
  res.json({ roomId });
});

app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.json({ exists: false, participantCount: 0 });
  }
  return res.json({
    exists: true,
    participantCount: room.participants.size,
    hasHost: !!room.hostId
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  let currentRoomId = null;
  let currentUserData = null;

  // Request to join or ask to join
  socket.on('request-join', ({ roomId, userName, userAvatar, isAudioOn, isVideoOn }) => {
    currentRoomId = roomId;
    const room = getRoom(roomId);

    currentUserData = {
      id: socket.id,
      name: userName || 'Guest',
      avatar: userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`,
      isAudioOn: !!isAudioOn,
      isVideoOn: !!isVideoOn,
      isHandRaised: false,
      isScreenSharing: false,
      isHost: false,
      joinedAt: Date.now()
    };

    // If room is empty or has no host, this user becomes the host immediately
    if (room.participants.size === 0 || !room.hostId) {
      room.hostId = socket.id;
      currentUserData.isHost = true;
      room.participants.set(socket.id, currentUserData);
      socket.join(roomId);

      socket.emit('join-approved', {
        roomId,
        isHost: true,
        participants: Array.from(room.participants.values()),
        chatMessages: room.chatMessages
      });

      console.log(`[Host Joined] ${currentUserData.name} (${socket.id}) created/hosted room ${roomId}`);
    } else {
      // Room has an existing host - add to waiting room
      room.waitingRoom.set(socket.id, currentUserData);
      socket.emit('waiting-for-host');

      // Notify host that someone wants to join
      io.to(room.hostId).emit('participant-knocked', {
        applicant: currentUserData
      });
      console.log(`[Knock] ${currentUserData.name} is waiting for host approval in room ${roomId}`);
    }
  });

  // Host admits applicant
  socket.on('admit-applicant', ({ applicantId }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    const applicant = room.waitingRoom.get(applicantId);
    if (!applicant) return;

    room.waitingRoom.delete(applicantId);
    room.participants.set(applicantId, applicant);

    const applicantSocket = io.sockets.sockets.get(applicantId);
    if (applicantSocket) {
      applicantSocket.join(currentRoomId);
      applicantSocket.emit('join-approved', {
        roomId: currentRoomId,
        isHost: false,
        participants: Array.from(room.participants.values()),
        chatMessages: room.chatMessages
      });

      // Notify others in room to establish WebRTC connection
      applicantSocket.to(currentRoomId).emit('user-joined', {
        user: applicant
      });
    }

    console.log(`[Admitted] Host ${socket.id} admitted ${applicant.name}`);
  });

  // Host denies applicant
  socket.on('deny-applicant', ({ applicantId }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    const applicant = room.waitingRoom.get(applicantId);
    if (applicant) {
      room.waitingRoom.delete(applicantId);
      io.to(applicantId).emit('join-denied');
      console.log(`[Denied] Host ${socket.id} denied ${applicant.name}`);
    }
  });

  // Direct join (fallback or instant bypass if configured)
  socket.on('direct-join', ({ roomId, userName, userAvatar, isAudioOn, isVideoOn }) => {
    currentRoomId = roomId;
    const room = getRoom(roomId);

    currentUserData = {
      id: socket.id,
      name: userName || 'Guest',
      avatar: userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`,
      isAudioOn: !!isAudioOn,
      isVideoOn: !!isVideoOn,
      isHandRaised: false,
      isScreenSharing: false,
      isHost: room.participants.size === 0 || !room.hostId,
      joinedAt: Date.now()
    };

    if (currentUserData.isHost) {
      room.hostId = socket.id;
    }

    room.participants.set(socket.id, currentUserData);
    socket.join(roomId);

    // Tell the joining user about existing participants
    socket.emit('join-approved', {
      roomId,
      isHost: currentUserData.isHost,
      participants: Array.from(room.participants.values()),
      chatMessages: room.chatMessages
    });

    // Notify other peers in room
    socket.to(roomId).emit('user-joined', {
      user: currentUserData
    });

    console.log(`[Direct Joined] ${currentUserData.name} joined room ${roomId}`);
  });

  // WebRTC Signaling: Offer
  socket.on('signal-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('signal-offer', {
      callerId: socket.id,
      offer
    });
  });

  // WebRTC Signaling: Answer
  socket.on('signal-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('signal-answer', {
      responderId: socket.id,
      answer
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('signal-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('signal-ice-candidate', {
      senderId: socket.id,
      candidate
    });
  });

  // Media toggles
  socket.on('toggle-audio', ({ isAudioOn }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.participants.get(socket.id);
    if (user) {
      user.isAudioOn = isAudioOn;
      io.to(currentRoomId).emit('user-updated', { user });
    }
  });

  socket.on('toggle-video', ({ isVideoOn }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.participants.get(socket.id);
    if (user) {
      user.isVideoOn = isVideoOn;
      io.to(currentRoomId).emit('user-updated', { user });
    }
  });

  socket.on('toggle-screen-share', ({ isScreenSharing }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.participants.get(socket.id);
    if (user) {
      user.isScreenSharing = isScreenSharing;
      io.to(currentRoomId).emit('user-updated', { user });
    }
  });

  // Hand raise logic (9.5)
  socket.on('toggle-hand-raise', ({ isHandRaised }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.participants.get(socket.id);
    if (user) {
      user.isHandRaised = isHandRaised;
      io.to(currentRoomId).emit('hand-raise-updated', {
        userId: socket.id,
        userName: user.name,
        isHandRaised
      });
      io.to(currentRoomId).emit('user-updated', { user });
    }
  });

  // Floating Emoji Reaction
  socket.on('send-reaction', ({ emoji }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.participants.get(socket.id);
    io.to(currentRoomId).emit('receive-reaction', {
      userId: socket.id,
      userName: user ? user.name : 'Participant',
      emoji,
      id: uuidv4()
    });
  });

  // In-call Chat Message (8.9)
  socket.on('send-message', ({ text }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.participants.get(socket.id);
    const message = {
      id: uuidv4(),
      senderId: socket.id,
      senderName: user ? user.name : 'Unknown',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    room.chatMessages.push(message);
    io.to(currentRoomId).emit('receive-message', message);
  });

  // File Sharing (9.3)
  socket.on('share-file', ({ fileName, fileType, fileSize, fileData }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.participants.get(socket.id);
    const fileMessage = {
      id: uuidv4(),
      senderId: socket.id,
      senderName: user ? user.name : 'Unknown',
      fileName,
      fileType,
      fileSize,
      fileData, // base64 data url
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'file'
    };

    room.chatMessages.push(fileMessage);
    io.to(currentRoomId).emit('receive-message', fileMessage);
    console.log(`[File Shared] ${fileName} (${fileSize}) shared by ${user?.name} in room ${currentRoomId}`);
  });

  // Host Permission: Mute a participant or Mute all (9.6)
  socket.on('host-mute-participant', ({ targetId }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    io.to(targetId).emit('force-mute');
  });

  socket.on('host-mute-all', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    // Send force-mute to everyone except the host
    socket.to(currentRoomId).emit('force-mute');
  });

  // Host Permission: Kick / Remove participant (9.6)
  socket.on('host-remove-participant', ({ targetId }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    io.to(targetId).emit('force-removed', { reason: 'Removed by host' });
  });

  // Whiteboard drawing synchronization (bonus collaboration)
  socket.on('draw-action', (drawData) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('draw-action', drawData);
  });

  socket.on('clear-board', () => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('clear-board');
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    if (!currentRoomId) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    // Check if in waiting room
    if (room.waitingRoom.has(socket.id)) {
      room.waitingRoom.delete(socket.id);
      if (room.hostId) {
        io.to(room.hostId).emit('waiting-room-updated', {
          waiting: Array.from(room.waitingRoom.values())
        });
      }
    }

    // Check if was participant
    if (room.participants.has(socket.id)) {
      const leavingUser = room.participants.get(socket.id);
      room.participants.delete(socket.id);

      io.to(currentRoomId).emit('user-left', {
        userId: socket.id,
        userName: leavingUser ? leavingUser.name : 'A participant'
      });

      // If host left, elect next host or clean up
      if (room.hostId === socket.id) {
        if (room.participants.size > 0) {
          const nextHost = room.participants.values().next().value;
          nextHost.isHost = true;
          room.hostId = nextHost.id;
          io.to(currentRoomId).emit('new-host-elected', { hostId: nextHost.id, hostName: nextHost.name });
          io.to(nextHost.id).emit('promoted-to-host');
        } else {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Google Meet Signaling Server running on port ${PORT}`);
});
