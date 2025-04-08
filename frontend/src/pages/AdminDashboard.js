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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchDoctors = async () => {
    const response = await axios.get("/v1/admin/doctors/");
    setDoctors(response.data);
  };

  const fetchUsers = async () => {
    const response = await axios.get("/v1/admin/users/");
    setUsers(response.data);
  };

  const fetchStaff = async () => {
    const response = await axios.get("/v1/admin/staff/");
    setStaff(response.data);
  };

  const fetchRoles = async () => {
    const response = await axios.get("/v1/admin/roles/");
    setRoles(response.data);
  };

  const fetchNurses = async () => {
    const response = await axios.get("/v1/admin/nurses/");
    setNurses(response.data);
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
  const [roles, setRoles] = useState([]); // State to store available roles

  // Fetch roles when the component mounts
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get("/v1/admin/roles/");
        setRoles(response.data);
      } catch (error) {
        setError("Failed to fetch roles.");
      }
    };
    fetchRoles();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (e) => {
    const selectedRoleIds = e.target.value; // Array of selected role IDs
    setFormData({ ...formData, role_ids: selectedRoleIds });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleAddOrUpdate = async () => {
    if (isUser && !editMode && formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (isUser && !editMode && (!formData.password || formData.password.length < 6)) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    try {
      if (editMode) {
        await axios.put(`${endpoint}${formData.id}/`, formData);
      } else {
        const { id, ...newEntity } = formData;
        await axios.post(endpoint, newEntity);
      }
      fetchData();
      setFormData({});
      setEditMode(false);
      setConfirmPassword("");
    } catch (error) {
      setError(`Error: ${error.response?.data?.detail || error.message}`);
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
      setError(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
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
              {columns.map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column === "Role IDs"
                      ? (row.role_ids ? row.role_ids.join(", ") : "")
                      : row[column.toLowerCase().replace(" ", "_")]}
                  </TableCell>
                ))}
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

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        {editMode ? "Edit" : "Add New"} {title}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
        {columns.map((column) => {
          if (column === "Role IDs" && isUser) {
            return (
              <FormControl fullWidth key={column}>
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  label="Roles"
                  value={formData.role_ids || []}
                  onChange={handleRoleChange}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          } else if (column === "Password" && isUser && !editMode) {
            return (
              <>
                <TextField
                  key={column}
                  label={column}
                  name="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  key="ConfirmPassword"
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                />
              </>
            );
          } else if (column !== "ID") {
            return (
              <TextField
                key={column}
                label={column}
                name={column.toLowerCase().replace(" ", "_")}
                value={formData[column.toLowerCase().replace(" ", "_")] || ""}
                onChange={handleInputChange}
              />
            );
          }
          return null;
        })}
      </Box>
      <Button variant="contained" color="primary" onClick={handleAddOrUpdate}>
        {editMode ? "Update" : "Add"} {title}
      </Button>

      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Dashboard;
