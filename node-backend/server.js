const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://emr-5esm.vercel.app", // Allow your Vercel frontend
    methods: ["GET", "POST"],
  },
});

const messages = [];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send existing messages to the new user
  socket.emit("messages", messages);

  // Listen for new messages
  socket.on("sendMessage", (message) => {
    console.log("Received message:", message);
    const newMessage = {
      id: messages.length + 1,
      sender: message.sender,
      text: message.text,
      timestamp: new Date(),
    };
    messages.push(newMessage);
    io.emit("newMessage", newMessage); // Broadcast to everyone
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// ====== THIS PART IS IMPORTANT ======
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
