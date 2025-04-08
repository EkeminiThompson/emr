const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow frontend to connect
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
    io.emit("newMessage", newMessage); // Broadcast the message to all clients
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});