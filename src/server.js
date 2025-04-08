const io = require('socket.io')(3000, {cors: { origin: '*' }});
const roomMembers = {};

io.on('connection', socket => {
  socket.on('join', room => {
    socket.join(room);
    socket.room = room;

    const userId = `User-${socket.id.slice(-4)}`;
    socket.userId = userId;

    if (!roomMembers[room]) {
      roomMembers[room] = [];
    }
    
    if (!roomMembers[room].includes(userId)) {
      roomMembers[room].push(userId);
    }    

    const roomSize = roomMembers[room].length;
    socket.emit('initiator', roomSize === 1);

    // Notify all users in the room
    io.to(room).emit('userJoined', { user: userId, message: `${userId} joined the room.` });
    io.to(room).emit('participants', roomMembers[room]);
  });

  socket.on('signal', ({ room, data }) => {
    socket.to(room).emit('signal', data);
  });

  socket.on('disconnect', () => {
    const room = socket.room;
    const userId = socket.userId;

    if (room && roomMembers[room]) {
      roomMembers[room] = roomMembers[room].filter(u => u !== userId);

      socket.to(room).emit('userLeft', { user: userId, message: `${userId} left the room.` });
      socket.to(room).emit('participants', roomMembers[room]);

      if (roomMembers[room].length === 0) {
        delete roomMembers[room];  
      }
    }
  });

  socket.on('leave', () => {
    const room = socket.room;
    const userId = socket.userId;
  
    if (room && roomMembers[room]) {
      roomMembers[room] = roomMembers[room].filter(u => u !== userId);
  
      io.to(room).emit('userLeft', { user: userId, message: `${userId} left the room.` });
      io.to(room).emit('participants', roomMembers[room]);
  
      if (roomMembers[room].length === 0) {
        delete roomMembers[room];
      }
    }
  });  
});
