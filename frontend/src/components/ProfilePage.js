import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, notification, Spin, Card } from "antd";
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";

const ProfilePage = ({ setIsLoggedIn }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Fetch the logged-in user's details
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login"); // Redirect to login if no token is found
          return;
        }

        // Check token expiry
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          throw new Error("Token has expired");
        }

        // Fetch user details
        const response = await axios.get("/v1/admin/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (error.response?.status === 401 || error.message === "Token has expired") {
          // Token is invalid or expired
          localStorage.removeItem("access_token");
          localStorage.removeItem("roles");
          setIsLoggedIn(false);
          navigate("/login"); // Redirect to login
        } else {
          notification.error({
            message: "Error",
            description: error.response?.data?.detail || "Failed to fetch user details. Please try again.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [navigate, setIsLoggedIn]);

  // Handle password change
  const handleChangePassword = async (values) => {
    const { currentPassword, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      notification.error({
        message: "Error",
        description: "New password and confirm password do not match.",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login"); // Redirect to login if no token is found
        return;
      }

      // Send password change request
      const response = await axios.put(
        `/v1/admin/users/change-password`, // Use the correct endpoint
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      notification.success({
        message: "Success",
        description: "Password changed successfully.",
      });

      // Clear the form
      form.resetFields();

      // Logout the user and redirect to "/"
      handleLogout();
    } catch (error) {
      console.error("Error changing password:", error);

      if (error.response?.status === 422) {
        // Handle validation errors
        const validationErrors = error.response.data.detail;
        notification.error({
          message: "Validation Error",
          description: validationErrors.map((err) => err.msg).join(", "),
        });
      } else {
        notification.error({
          message: "Error",
          description: error.response?.data?.detail || "Failed to change password. Please try again.",
        });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("roles");
    setIsLoggedIn(false);
    navigate("/"); // Redirect to home page after logout
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20%" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null; // Return nothing if user data is not loaded
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <Card title="Profile" bordered={false}>
        {/* Display User Details */}
        <div style={{ marginBottom: "24px" }}>
          <p>
            <UserOutlined /> <strong>Username:</strong> {user.username}
          </p>
          <p>
            <MailOutlined /> <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Full Name:</strong> {user.full_name}
          </p>
          <p>
            <strong>Roles:</strong>{" "}
            {user.roles && user.roles.map((role) => role.name).join(", ")}
          </p>
        </div>

        {/* Change Password Form */}
        <Form form={form} onFinish={handleChangePassword} layout="vertical">
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: "Please enter your current password." }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter a new password." },
              { min: 8, message: "Password must be at least 8 characters long." },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("The two passwords do not match.");
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              Change Password
            </Button>
          </Form.Item>
        </Form>

        {/* Logout Button */}
        <Button type="danger" onClick={handleLogout} style={{ marginTop: "16px" }}>
          Logout
        </Button>
      </Card>
    </div>
  );
};

export default ProfilePage;