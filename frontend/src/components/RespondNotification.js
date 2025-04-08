// RespondNotification.js
import React, { useState, useEffect } from "react";

const RespondNotification = ({ department }) => {
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to WebSocket server
    const socket = new WebSocket("ws://localhost:8000");

    // Open WebSocket connection
    socket.addEventListener("open", () => {
      console.log("Connected to WebSocket");
    });

    // Listen for incoming notifications
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.department === department) {
        setNotifications((prev) => [
          ...prev,
          `${data.patient} - ${data.task}: ${data.action}`,
        ]);
      }
    });

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [department]);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notification, index) => (
          <li key={index}>{notification}</li>
        ))}
      </ul>
    </div>
  );
};

export default RespondNotification;
