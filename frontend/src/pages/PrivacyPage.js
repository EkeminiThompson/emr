import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance'; 
import {
  Container, Typography, Paper, Box, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, Tab,
  Grid, Alert, Chip
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = '/v1/audit/audit-logs/';

const AuditLogs = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('week');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [actionType, setActionType] = useState('');
  const [entityType, setEntityType] = useState('');

  // Get and validate token from localStorage
  const token = localStorage.getItem('access_token');
  const [roles, setRoles] = useState([]);

  // Initialize axios instance with interceptors
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor to include token
  api.interceptors.request.use(config => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });

  // Add response interceptor to handle 401 errors
  api.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401) {
      handleLogout();
    }
    return Promise.reject(error);
  });

  // Available filters
  const actionTypes = [
    'login', 'logout', 'patient_create', 'patient_update', 
    'billing_create', 'drug_update', 'user_update', 'pharmacy_record_create'
  ];
  
  const entityTypes = [
    'Patient', 'Billing', 'Drug', 'User', 'Pharmacy', 'Doctor', 'Nurse'
  ];

  // Check authentication and decode token on component mount
  useEffect(() => {
    const verifyTokenAndFetchData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Decode token to get roles and expiration
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          handleLogout();
          return;
        }

        setRoles(decoded.roles || JSON.parse(localStorage.getItem('roles') || '[]'));

        if (!decoded.roles?.includes('Admin')) {
          setError("You don't have admin privileges to view audit logs");
          return;
        }

        await fetchAuditLogs();
      } catch (error) {
        console.error('Token verification failed:', error);
        handleLogout();
      }
    };

    verifyTokenAndFetchData();
  }, []);

  // Centralized logout function
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('roles');
    setIsLoggedIn(false);
    navigate('/login');
  };

  // Fetch audit logs with proper authentication
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        time_frame: timeFrame === 'custom' ? null : timeFrame,
        start_date: timeFrame === 'custom' && startDate ? startDate.toISOString().split('T')[0] : null,
        end_date: timeFrame === 'custom' && endDate ? endDate.toISOString().split('T')[0] : null,
        action: actionType || null,
        entity_type: entityType || null,
        include_user: true  // Ensure we get user details
      };

      // Remove null parameters
      Object.keys(params).forEach(key => params[key] === null && delete params[key]);

      const response = await api.get(API_BASE_URL, { params });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      if (error.response?.status === 403) {
        setError("You don't have admin privileges to view audit logs");
      } else {
        setError(error.response?.data?.detail || "Failed to load audit logs. Please try again.");
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for time frame changes
  const handleTimeFrameChange = (event, newValue) => {
    setTimeFrame(newValue);
    if (newValue !== 'custom') {
      fetchAuditLogs();
    }
  };

  // Handler for date changes in custom range
  useEffect(() => {
    if (timeFrame === 'custom' && startDate && endDate) {
      fetchAuditLogs();
    }
  }, [startDate, endDate]);

  // Format date for display
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get color for action chips
  const getActionColor = (action) => {
    const colors = {
      login: 'success',
      logout: 'info',
      patient_create: 'primary',
      patient_update: 'secondary',
      billing_create: 'warning',
      drug_update: 'error',
      user_update: 'success',
      pharmacy_record_create: 'info'
    };
    return colors[action] || 'default';
  };

  // Get display name for user
  const getUserDisplayName = (user) => {
    if (!user) return 'System';
    return user.full_name || user.username || user.email || 'Unknown User';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Audit Logs
      </Typography>

      {error && (
        <Alert severity={error.includes('privileges') ? 'warning' : 'error'} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ padding: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={timeFrame} 
            onChange={handleTimeFrameChange}
            aria-label="time frame tabs"
          >
            <Tab label="Today" value="day" />
            <Tab label="This Week" value="week" />
            <Tab label="This Month" value="month" />
            <Tab label="This Year" value="year" />
            <Tab label="All Time" value="total" />
            <Tab label="Custom Range" value="custom" />
          </Tabs>
        </Box>

        {timeFrame === 'custom' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start Date"
                className="date-picker-input"
                dateFormat="yyyy-MM-dd"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="End Date"
                className="date-picker-input"
                dateFormat="yyyy-MM-dd"
              />
            </Grid>
          </Grid>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Action Type</InputLabel>
              <Select
                value={actionType}
                onChange={(e) => {
                  setActionType(e.target.value);
                  fetchAuditLogs();
                }}
                label="Action Type"
              >
                <MenuItem value="">All Actions</MenuItem>
                {actionTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  fetchAuditLogs();
                }}
                label="Entity Type"
              >
                <MenuItem value="">All Entities</MenuItem>
                {entityTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              onClick={fetchAuditLogs}
              disabled={loading}
              sx={{ height: '56px' }}
              fullWidth
            >
              Refresh Logs
              {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </Grid>
        </Grid>

        {logs.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell>{getUserDisplayName(log.user)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action.replace(/_/g, ' ')} 
                        color={getActionColor(log.action)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {log.entity_type && (
                        <Chip 
                          label={`${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ''}`}
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>{log.description}</TableCell>
                    <TableCell>{log.ip_address || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : !loading && (
          <Typography variant="body1" sx={{ textAlign: 'center', p: 3 }}>
            No audit logs found for the selected criteria
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default AuditLogs;