import React, { useState } from "react";
import { notification } from "antd";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Tooltip,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Avatar,
  MenuItem,
  Menu,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Home,
  Dashboard,
  People,
  CalendarToday,
  AttachMoney,
  Description,
  Science,
  LocalPharmacy,
  Work,
  Psychology,
  Healing,
  ExpandLess,
  ExpandMore,
  PostAdd,
  History,
  Medication,
  Menu as MenuIcon,
} from "@mui/icons-material";

const NavItem = ({ to, icon, text, selected }) => (
  <Tooltip title={text} arrow aria-label={text}>
    <ListItem button component={Link} to={to} selected={selected} sx={{ py: 0.5 }}>
      <ListItemIcon sx={{ minWidth: '40px' }}>{icon}</ListItemIcon>
      <ListItemText primary={text} sx={{ fontSize: '0.875rem' }} />
    </ListItem>
  </Tooltip>
);

const Nav = ({ isLoggedIn, setIsLoggedIn, user }) => {
  // Early return if not logged in
  if (!isLoggedIn) return null;

  const [open, setOpen] = useState({
    departments: false,
    patients: false,
    appointments: false,
    services: false,
    reports: false,
    legal: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const userName = user?.name || "John Doe";
  const userProfilePic = user?.profilePic || "https://www.w3schools.com/w3images/avatar2.png";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleToggle = (section) => {
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isSelected = (path) => location.pathname.startsWith(path);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    handleProfileMenuClose();
    navigate("/");

    notification.success({
      message: "Logged Out",
      description: "You have successfully logged out.",
    });
  };

  const handleProfile = () => {
    navigate("/profile");
    handleProfileMenuClose();
  };

  const drawer = (
    <List component="nav" sx={{ py: 0 }}>
      {/* General Links */}
      <NavItem to="/home" icon={<Home />} text="Home" selected={isSelected("/home")} />

      {/* Dashboard Links */}
      <ListItem button onClick={() => handleToggle("dashboard")} sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: '40px' }}>
          <Dashboard />
        </ListItemIcon>
        <ListItemText primary="Dashboard" sx={{ fontSize: '0.875rem' }} />
        {open.dashboard ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open.dashboard} timeout="auto" unmountOnExit sx={{ transition: "all 0.3s ease" }}>
        <List component="div" disablePadding>
          <NavItem
            to="/dashboard"
            icon={<Dashboard />}
            text="SQL Sales"
            selected={isSelected("/dashboard")}
          />
          <NavItem
            to="/admin"
            icon={<Dashboard />}
            text="Admin Dashboard"
            selected={isSelected("/admin")}
          />
        </List>
      </Collapse>

      {/* Patient & Appointment Links */}
      <ListItem button onClick={() => handleToggle("patients")} sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: '40px' }}>
          <People />
        </ListItemIcon>
        <ListItemText primary="Patients" sx={{ fontSize: '0.875rem' }} />
        {open.patients ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open.patients} timeout="auto" unmountOnExit sx={{ transition: "all 0.3s ease" }}>
        <List component="div" disablePadding>
          <NavItem
            to="/patient-details"
            icon={<People />}
            text="OutPatients"
            selected={isSelected("/patient-details")}
          />
          <NavItem
            to="/patient-dashboard"
            icon={<People />}
            text="Patient Dashboard"
            selected={isSelected("/patient-dashboard")}
          />
          <NavItem
            to="/patient-form"
            icon={<PostAdd />}
            text="Patient Form"
            selected={isSelected("/patient-form")}
          />
          <NavItem
            to="/nurses-note"
            icon={<PostAdd />}
            text="Nurses Note"
            selected={isSelected("/nurses-note")}
          />
          <NavItem
            to="/mental-health-form"
            icon={<Psychology />}
            text="Doctors Note"
            selected={isSelected("/mental-health-form")}
          />
        </List>
      </Collapse>

      {/* Appointment Links */}
      <ListItem button onClick={() => handleToggle("appointments")} sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: '40px' }}>
          <CalendarToday />
        </ListItemIcon>
        <ListItemText primary="Appointments" sx={{ fontSize: '0.875rem' }} />
        {open.appointments ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open.appointments} timeout="auto" unmountOnExit sx={{ transition: "all 0.3s ease" }}>
        <List component="div" disablePadding>
          <NavItem
            to="/appointment-history"
            icon={<History />}
            text="Appointment History"
            selected={isSelected("/appointment-history")}
          />
          <NavItem
            to="/appointment-create"
            icon={<PostAdd />}
            text="Create Appointment"
            selected={isSelected("/appointment-create")}
          />
        </List>
      </Collapse>

      {/* Services Section */}
      <ListItem button onClick={() => handleToggle("services")} sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: '40px' }}>
          <Work />
        </ListItemIcon>
        <ListItemText primary="Services" sx={{ fontSize: '0.875rem' }} />
        {open.services ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open.services} timeout="auto" unmountOnExit sx={{ transition: "all 0.3s ease" }}>
        <List component="div" disablePadding>
          <NavItem
            to="/pharmacy"
            icon={<LocalPharmacy />}
            text="Pharmacy"
            selected={isSelected("/pharmacy")}
          />
          <NavItem
            to="/social-work"
            icon={<Psychology />}
            text="Social Work"
            selected={isSelected("/social-work")}
          />
          <NavItem
            to="/laboratory"
            icon={<Science />}
            text="Laboratory"
            selected={isSelected("/laboratory")}
          />
          <NavItem
            to="/occupational-therapy"
            icon={<Healing />}
            text="Occupational Therapy"
            selected={isSelected("/occupational-therapy")}
          />
          <NavItem
            to="/clinical-psychology"
            icon={<Psychology />}
            text="Clinical Psychology"
            selected={isSelected("/clinical-psychology")}
          />
        </List>
      </Collapse>

      {/* Billing Section */}
      <NavItem
        to="/bill-generation"
        icon={<AttachMoney />}
        text="Billing"
        selected={isSelected("/bill-generation")}
      />

      {/* Reports & Reminders Section */}
      <ListItem button onClick={() => handleToggle("reports")} sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: '40px' }}>
          <Description />
        </ListItemIcon>
        <ListItemText primary="Reports & Drugs" sx={{ fontSize: '0.875rem' }} />
        {open.reports ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open.reports} timeout="auto" unmountOnExit sx={{ transition: "all 0.3s ease" }}>
        <List component="div" disablePadding>
          <NavItem
            to="/report-generator"
            icon={<Description />}
            text="Report Generator"
            selected={isSelected("/report-generator")}
          />
          <NavItem
            to="/appointment-reminder"
            icon={<Medication />}
            text="Drugs"
            selected={isSelected("/appointment-reminder")}
          />
        </List>
      </Collapse>

      {/* Legal Section */}
      <ListItem button onClick={() => handleToggle("legal")} sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: '40px' }}>
          <Description />
        </ListItemIcon>
        <ListItemText primary="AuditLogs & Terms" sx={{ fontSize: '0.875rem' }} />
        {open.legal ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open.legal} timeout="auto" unmountOnExit sx={{ transition: "all 0.3s ease" }}>
        <List component="div" disablePadding>
          <NavItem
            to="/terms"
            icon={<Description />}
            text="Terms"
            selected={isSelected("/terms")}
          />
          <NavItem
            to="/privacy-policy"
            icon={<Description />}
            text="Audit"
            selected={isSelected("/privacy-policy")}
          />
        </List>
      </Collapse>
    </List>
  );

  return (
    <div>
      {/* Top Bar (AppBar) */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" noWrap sx={{ flexGrow: 1 }}>
            Renewal Ridge Hospital & Resort
          </Typography>

          {/* Links in the top bar */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              component={Link}
              to="/home"
              sx={{ mr: 2, fontSize: "0.8rem" }}
            >
              Home
            </IconButton>
            <IconButton
              color="inherit"
              component={Link}
              to="/departments"
              sx={{ mr: 2, fontSize: "0.8rem" }}
            >
              Departments
            </IconButton>
            <IconButton
              color="inherit"
              component={Link}
              to="/chat"
              sx={{ mr: 2, fontSize: "0.8rem" }}
            >
              Chat
            </IconButton>

            <IconButton
              color="inherit"
              component={Link}
              to="/bill-generation"
              sx={{ mr: 2, fontSize: "0.8rem" }}
            >
              Billing
            </IconButton>

            {/* Profile Avatar */}
            <IconButton onClick={handleProfileMenuOpen} aria-label="profile">
              <Avatar alt={userName} src={userProfilePic} onError={(e) => { e.target.src = 'path/to/default/avatar.png'; }} />
            </IconButton>
          </div>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            aria-labelledby="profile-menu"
          >
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer (Side Navigation) */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            backgroundColor: "#f5f5f5",
            marginTop: "64px",
            zIndex: (theme) => theme.zIndex.drawer,
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Container
        sx={{
          flexGrow: 1,
          marginTop: "16px",
          padding: "16px",
          marginRight: "16px",
          marginLeft: isMobile ? (mobileOpen ? "240px" : "6px") : "6px",
          maxWidth: "100%",
          overflowX: "hidden",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Main content will be rendered here */}
      </Container>
    </div>
  );
};

export default Nav;