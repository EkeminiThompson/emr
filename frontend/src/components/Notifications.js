import React, { useEffect, useState } from "react";
import { notification } from "antd";

const Notifications = ({ department }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${department}`);

    ws.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);

      // Show Ant Design notification popup
      notification.info({
        message: "New Notification",
        description: newNotification.message,
        placement: "topRight",
      });
    };

    ws.onerror = (error) => console.error("WebSocket Error:", error);
    ws.onclose = () => setTimeout(() => window.location.reload(), 5000);

    return () => ws.close();
  }, [department]);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <li key={index}>
              <strong>From:</strong> {notif.sender_id} - {notif.message}
            </li>
          ))
        ) : (
          <p>No notifications</p>
        )}
      </ul>
    </div>
  );
};

export default Notifications;
