import React, { useState, useEffect } from "react";
import axios from '../api/axiosInstance';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDoctors(),
          fetchUsers(),
          fetchStaff(),
          fetchRoles(),
          fetchNurses(),
        ]);
      } catch (error) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("/v1/admin/doctors/");
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/v1/admin/users/");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axios.get("/v1/admin/staff/");
      setStaff(response.data);
    } catch (error) {
      console.error("Error fetching staff:", error);
      throw error;
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get("/v1/admin/roles/");
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await axios.get("/v1/admin/nurses/");
      setNurses(response.data);
    } catch (error) {
      console.error("Error fetching nurses:", error);
      throw error;
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box sx={{ width: "100%", padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Doctors" />
        <Tab label="Users" />
        <Tab label="Staff" />
        <Tab label="Roles" />
        <Tab label="Nurses" />
      </Tabs>

      {loading && <CircularProgress sx={{ display: "block", margin: "20px auto" }} />}

      {tabValue === 0 && (
        <EntityTab
          title="Doctors"
          data={doctors}
          columns={["ID", "Full Name", "Specialty", "User ID"]}
          endpoint="/v1/admin/doctors/"
          fetchData={fetchDoctors}
        />
      )}

      {tabValue === 1 && (
        <EntityTab
          title="Users"
          data={users}
          columns={["ID", "Username", "Full Name", "Email", "Password", "Role IDs"]}
          endpoint="/v1/admin/users/"
          fetchData={fetchUsers}
          isUser={true}
        />
      )}

      {tabValue === 2 && (
        <EntityTab
          title="Staff"
          data={staff}
          columns={["ID", "User ID", "Department"]}
          endpoint="/v1/admin/staff/"
          fetchData={fetchStaff}
        />
      )}

      {tabValue === 3 && (
        <EntityTab
          title="Roles"
          data={roles}
          columns={["ID", "Name", "Description"]}
          endpoint="/v1/admin/roles/"
          fetchData={fetchRoles}
        />
      )}

      {tabValue === 4 && (
        <EntityTab
          title="Nurses"
          data={nurses}
          columns={["ID", "Full Name", "Department", "User ID"]}
          endpoint="/v1/admin/nurses/"
          fetchData={fetchNurses}
        />
      )}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const EntityTab = ({ title, data, columns, endpoint, fetchData, isUser = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get("/v1/admin/roles/");
        setRoles(response.data);
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError("Failed to fetch roles.");
      }
    };
    
    if (isUser) {
      fetchRoles();
    }
  }, [isUser]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (e) => {
    setFormData({ ...formData, role_ids: e.target.value });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleAddOrUpdate = async () => {
    try {
      if (isUser && !editMode) {
        if (formData.password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }
      }

      if (editMode) {
        await axios.put(`${endpoint}${formData.id}/`, formData);
      } else {
        await axios.post(endpoint, formData);
      }
      
      fetchData();
      setFormData({});
      setEditMode(false);
      setConfirmPassword("");
      setError(null);
    } catch (error) {
      console.error("API Error:", error);
      setError(error.response?.data?.message || "An error occurred");
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditMode(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${endpoint}${id}/`);
      fetchData();
    } catch (error) {
      console.error("Delete Error:", error);
      setError(error.response?.data?.message || "Failed to delete");
    }
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>

      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={handleSearch}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map(row => (
              <TableRow key={row.id}>
                {columns.map(column => {
                  const key = column.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <TableCell key={`${row.id}-${key}`}>
                      {column === "Role IDs" 
                        ? row.role_ids?.join(', ') || ''
                        : row[key]}
                    </TableCell>
                  );
                })}
                <TableCell>
                  <IconButton onClick={() => handleEdit(row)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(row.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4, p: 3, border: '1px solid #ddd', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          {editMode ? "Edit" : "Add New"} {title}
        </Typography>
        
        {columns.map(column => {
          const fieldName = column.toLowerCase().replace(/\s+/g, '_');
          
          if (column === "Role IDs" && isUser) {
            return (
              <FormControl fullWidth key="roles" sx={{ mb: 2 }}>
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={formData.role_ids || []}
                  onChange={handleRoleChange}
                  label="Roles"
                >
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          
          if (column === "Password" && isUser) {
            if (editMode) return null;
            return (
              <React.Fragment key="password-fields">
                <TextField
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  fullWidth
                  sx={{ mb: 2 }}
                  required={!editMode}
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  fullWidth
                  sx={{ mb: 2 }}
                  required={!editMode}
                />
              </React.Fragment>
            );
          }
          
          if (column !== "ID") {
            return (
              <TextField
                key={fieldName}
                label={column}
                name={fieldName}
                value={formData[fieldName] || ''}
                onChange={handleInputChange}
                fullWidth
                sx={{ mb: 2 }}
                type={column === "Password" ? "password" : "text"}
              />
            );
          }
          return null;
        })}

        <Button 
          variant="contained" 
          onClick={handleAddOrUpdate}
          sx={{ mt: 2 }}
        >
          {editMode ? "Update" : "Add"} {title}
        </Button>

        {editMode && (
          <Button 
            variant="outlined" 
            onClick={() => {
              setFormData({});
              setEditMode(false);
              setConfirmPassword("");
            }}
            sx={{ mt: 2, ml: 2 }}
          >
            Cancel
          </Button>
        )}
      </Box>

      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Dashboard;