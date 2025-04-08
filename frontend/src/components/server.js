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

const messages = []; // Store all messages
const users = new Map(); // Track users and their roles

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for user role information
  socket.on("setUserRole", (user) => {
    console.log("User role set:", user);
    users.set(socket.id, user.roles); // Store user roles
  });

  // Send existing messages to the new user (filtered by their roles)
  const userRoles = users.get(socket.id) || [];
  const filteredMessages = messages.filter(
    (msg) =>
      msg.roles.includes("All") || // Include messages for all roles
      msg.roles.some((role) => userRoles.includes(role)) // Include messages for the user's roles
  );
  socket.emit("messages", filteredMessages);

  // Listen for new messages
  socket.on("sendMessage", (message) => {
    console.log("Received message:", message);

    // Create a new message object
    const newMessage = {
      id: messages.length + 1, // Generate a unique ID
      sender: message.sender, // Sender's name
      text: message.text, // Message content
      roles: message.roles || ["All"], // Default to ["All"] if no roles are specified
      timestamp: new Date(), // Timestamp of the message
    };

    // Save the message
    messages.push(newMessage);

    // Broadcast the message to clients with matching roles
    users.forEach((roles, userId) => {
      if (
        newMessage.roles.includes("All") || // Send to all roles
        newMessage.roles.some((role) => roles.includes(role)) // Send to matching roles
      ) {
        io.to(userId).emit("newMessage", newMessage);
      }
    });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    users.delete(socket.id); // Remove user from tracking
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});