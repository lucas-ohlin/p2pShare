const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

io.on("connection", socket => {
  socket.on("join", room => {
    socket.join(room);
  });

  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", data);
  });
});
