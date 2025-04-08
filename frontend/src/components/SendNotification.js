// SendNotification.js
import React, { useState, useEffect } from "react";

const SendNotification = ({ department }) => {
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to WebSocket server
    const socket = new WebSocket("ws://localhost:8000");

    // Open WebSocket connection
    socket.addEventListener("open", () => {
      console.log("Connected to WebSocket");
    });

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const sendNotification = () => {
    if (ws && message) {
      // Send notification about the patient
      const notification = {
        department: department,
        task: message, // The task/message describing the patient's status
        action: "notify", // Action type: "notify", "done", etc.
        patient: "John Doe", // Example, could be dynamic
      };

      // Send the message to the server
      ws.send(JSON.stringify(notification));

      setMessage(""); // Clear message input after sending
    }
  };

  return (
    <div>
      <h2>Send Notification</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter patient task/status"
      ></textarea>
      <button onClick={sendNotification}>Send</button>
    </div>
  );
};

export default SendNotification;
