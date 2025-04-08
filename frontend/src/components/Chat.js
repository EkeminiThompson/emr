import React, { useState, useEffect, useContext } from "react";
import { SocketContext } from "./SocketContext";
import { Select } from "antd";

const { Option } = Select;

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const socket = useContext(SocketContext);

  // Role routes mapping
  const roleRoutes = {
    Admin: "/admin",
    Doctor: "/mental-health",
    Pharmacy: "/pharmacy",
    Laboratory: "/laboratory",
    "Occupational Therapy": "/occupational-therapy",
    "Clinical Psychology": "/clinical-psychology",
    Nursing: "/nursing",
    "Social Work": "/social-work",
    Account: "/billing",
  };

  // Role options for the dropdown
  const roleOptions = Object.keys(roleRoutes);

  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem("chatMessages"));
    if (savedMessages) {
      setMessages(savedMessages);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Send user roles to the server
    socket.emit("setUserRole", { roles: user.roles });

    // Listen for initial messages (already filtered by the server)
    socket.on("messages", (initialMessages) => {
      console.log("Received initial messages:", initialMessages);
      setMessages(initialMessages);
      localStorage.setItem("chatMessages", JSON.stringify(initialMessages));
    });

    // Listen for new messages (already filtered by the server)
    socket.on("newMessage", (message) => {
      console.log("Received new message:", message);

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
        return updatedMessages;
      });

      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification("New message received!", {
          body: `${message.sender}: ${message.text}`,
        });
      } else {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    });

    // Request notification permission
    if (Notification.permission !== "denied" && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      socket.off("messages");
      socket.off("newMessage");
    };
  }, [socket, user]);

  const handleSendMessage = () => {
    if (!user || !socket) {
      console.error("User or socket is not defined.");
      return;
    }

    if (newMessage.trim()) {
      const message = {
        sender: user.full_name,
        text: newMessage,
        roles: selectedRoles.length > 0 ? selectedRoles : ["All"], // Send to selected roles or all
        timestamp: new Date(),
      };
      console.log("Sending message:", message);
      socket.emit("sendMessage", message);
      setNewMessage("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Team Chat</h2>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <div className="message-sender">{msg.sender}</div>
            <div className="message-text">{msg.text}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <Select
          mode="multiple"
          placeholder="Select roles (default: All)"
          style={{ width: "100%", marginBottom: "10px" }}
          onChange={(values) => setSelectedRoles(values)}
        >
          {roleOptions.map((role) => (
            <Option key={role} value={role}>
              {role}
            </Option>
          ))}
        </Select>
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>

      {/* In-app Notification dialog */}
      {showNotification && <div className="notification">New message received!</div>}

      {/* CSS embedded */}
      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #f5f5f5;
          padding: 20px;
          box-sizing: border-box;
        }

        .chat-header {
          background-color: #007bff;
          color: white;
          padding: 15px;
          border-radius: 8px 8px 0 0;
          text-align: center;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background-color: white;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .message {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .message-sender {
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }

        .message-text {
          color: #333;
          margin-bottom: 5px;
        }

        .message-timestamp {
          font-size: 0.8rem;
          color: #777;
        }

        .chat-input {
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .input-container {
          display: flex;
          gap: 10px;
        }

        .input-container input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1rem;
        }

        .input-container button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
        }

        .input-container button:hover {
          background-color: #0056b3;
        }

        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #4caf50;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          font-size: 16px;
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Chat;