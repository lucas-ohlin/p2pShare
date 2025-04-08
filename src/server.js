const io = require("socket.io")(3000, { cors: { origin: "*" } });
const roomMembers = {};

console.log("Signaling server started on port 3000");

io.on("connection", (socket) => {
  console.log(`[${new Date().toLocaleTimeString()}] Client connected: ${socket.id}`);

  socket.on("join", (room) => {
    const userId = `User-${socket.id.slice(-4)}`;
    socket.join(room);
    socket.room = room;
    socket.userId = userId;

    if (!roomMembers[room]) {
      roomMembers[room] = [];
    }

    if (!roomMembers[room].includes(userId)) {
      roomMembers[room].push(userId);
    }

    const roomSize = roomMembers[room].length;
    socket.emit("initiator", roomSize === 1);
    socket.emit("userInfo", { userId });

    io.to(room).emit("userJoined", { user: userId, message: `${userId} joined the room.` });
    io.to(room).emit("participants", roomMembers[room]);
  });

  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", { from: socket.userId, data });
  });

  socket.on("chatMessage", ({ room, user, message }) => {
    io.to(room).emit("chatMessage", { user, message });
  });

  socket.on("disconnect", (reason) => {
    const room = socket.room;
    const userId = socket.userId;

    if (room && userId && roomMembers[room]) {
      roomMembers[room] = roomMembers[room].filter((u) => u !== userId);
      socket.to(room).emit("userLeft", { user: userId, message: `${userId} left the room.` });
      socket.to(room).emit("participants", roomMembers[room]);

      if (roomMembers[room].length === 0) {
        delete roomMembers[room];
      }
    }
  });

  socket.on("leave", () => {
    const room = socket.room;
    const userId = socket.userId;
    socket.disconnect(true);
  });

  socket.on("ready-for-connection", ({ room, userId }) => {
    socket.to(room).emit("new-user-ready", { userId });
  });
  

  socket.on("connect_error", (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] Connection Error: ${err.message}`);
  });
});

io.engine.on("connection_error", (err) => {
  console.error("SOCKET.IO ENGINE CONNECTION ERROR:");
  console.error("Code:", err.code);
  console.error("Message:", err.message);
  console.error("Context:", err.context);
});

console.log("Server event listeners attached.");
