import express, { urlencoded } from 'express';
import dotenv from 'dotenv';
import {createServer} from 'http';
import {Server} from 'socket.io';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5001;

const httpServer = createServer(app);

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();  

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

 socket.on("join-room", (data) => {    
    const { roomId, userId } = data;
    console.log(`User with ID: ${userId} joined room: ${roomId}`);

    emailToSocketMapping.set(userId, socket.id);
    socketToEmailMapping.set(socket.id, userId);

    socket.join(roomId);
    socket.emit("joined-room", roomId);
    socket.broadcast.to(roomId).emit("user-joined", { userId});
  });

  socket.on("call-user", (data) => {
    const { offer, userId } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const targetSocketId = emailToSocketMapping.get(userId);
   
    socket.to(targetSocketId).emit("incoming-call", { offer, from: fromEmail });
  });

  socket.on("call-accepted", (data) => {
    const { answer, from } = data;
    const targetSocketId = emailToSocketMapping.get(from);
    socket.to(targetSocketId).emit("call-accepted", { answer });
  });

  // 🔥 NEW: ICE Candidate handling
  socket.on("ice-candidate", (data) => {
    const { candidate } = data;
    const fromUserId = socketToEmailMapping.get(socket.id);
    
    console.log(`Relaying ICE candidate from user: ${fromUserId}`);
    
    // Find all users in the same rooms and send to them
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) { // Don't send to self
        socket.to(room).emit("ice-candidate", { candidate });
      }
    });
  });

  socket.on("disconnect", () => {
    const userId = socketToEmailMapping.get(socket.id);
    console.log("User disconnected", socket.id, "UserId:", userId);
    
    // Clean up mappings
    if (userId) {
      emailToSocketMapping.delete(userId);
    }
    socketToEmailMapping.delete(socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});