import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Form, Input, Button, notification, Card, Typography, ConfigProvider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://emr-5.onrender.com";

const Login = ({ setIsLoggedIn, setUser }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Role-based navigation mapping
  const roleRoutes = {
    Admin: "/home",
    Doctor: "/mental-health",
    Pharmacy: "/pharmacy",
    Laboratory: "/laboratory",
    "Occupational Therapy": "/occupational-therapy",
    "Clinical Psychology": "/clinical-psychology",
    Nursing: "/nursing",
    "Social Work": "/social-work",
    Account: "/billing",
  };

  const handleApiLogin = async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/v1/admin/v1/auth/login`, {
      username,
      password,
    });

    if (response.data.success && response.data.access_token) {
      const token = response.data.access_token;

      if (typeof token !== "string" || token.trim() === "") {
        throw new Error("Invalid access token received");
      }

      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        throw new Error("Token has expired");
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("roles", JSON.stringify(decodedToken.roles || response.data.user.roles));

      setIsLoggedIn(true);
      setUser(response.data.user);

      const roles = decodedToken.roles || response.data.user.roles || [];
      const navigateTo = roles.includes("Admin") ? "/admin" : getRoleBasedRoute(roles);
      navigate(navigateTo);
    } else {
      throw new Error("Invalid username or password.");
    }
  };

  const getRoleBasedRoute = (roles) => {
    for (const role of roles) {
      if (roleRoutes[role]) {
        return roleRoutes[role];
      }
    }
    return "/home";
  };

  const handleLogin = async (values) => {
    const { username, password } = values;
    setLoading(true);

    try {
      await handleApiLogin(username, password);
    } catch (err) {
      console.error("Login error:", err);
      notification.error({
        message: "Error",
        description: err.response?.data?.detail || "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
        },
      }}
    >
      <div style={styles.loginContainer}>
        <div style={styles.leftPanel}>
          {/* Removed the brand container with title and tagline */}
        </div>
        
        <div style={styles.rightPanel}>
          <Card style={styles.loginCard} variant="borderless">
            <Title level={3} style={styles.loginTitle}>Welcome Back</Title>
            <Text style={styles.welcomeText}>Please login to your account</Text>
            
            <Form form={form} onFinish={handleLogin} layout="vertical" style={styles.form}>
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Please enter your username" }]}
              >
                <Input 
                  prefix={<UserOutlined style={styles.inputPrefix} />} 
                  placeholder="Username" 
                  size="large"
                  style={styles.input}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: "Please enter your password" }]}
              >
                <Input.Password 
                  prefix={<LockOutlined style={styles.inputPrefix} />} 
                  placeholder="Password" 
                  size="large"
                  style={styles.input}
                />
              </Form.Item>

              <Form.Item style={styles.submitButtonContainer}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  block
                  size="large"
                  style={styles.submitButton}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

// Styles remain unchanged
const styles = {
  loginContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: 'white',
    backgroundImage: 'url(/renewal.png)',
    backgroundSize: '150%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    position: 'relative',
    '@media (maxWidth: 768px)': {
      display: 'none',
    },
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#ffffff',
    '@media (maxWidth: 768px)': {
      padding: '1rem',
    },
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    padding: '2rem',
    border: 'none',
  },
  loginTitle: {
    textAlign: 'center',
    marginBottom: '0.5rem',
    fontWeight: 600,
    color: '#262626',
  },
  welcomeText: {
    textAlign: 'center',
    color: '#8c8c8c',
    marginBottom: '2rem',
    display: 'block',
  },
  form: {
    marginTop: '1.5rem',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '16px',
  },
  inputPrefix: {
    color: '#bfbfbf',
    marginRight: '8px',
  },
  submitButtonContainer: {
    marginTop: '1.5rem',
  },
  submitButton: {
    height: '44px',
    borderRadius: '6px',
    fontWeight: 500,
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    border: 'none',
    fontSize: '16px',
  },
};

export default Login;