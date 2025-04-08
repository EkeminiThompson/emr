import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Add, Edit, Delete, AddCircle, RemoveCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Constants
const API_BASE_URL = '/v1/admin/v1/admin/drugs/';
const AUDIT_API_URL = '/v1/audit/audit-logs/';
const SNACKBAR_AUTO_HIDE_DURATION = 6000;

// Initial drug data structure
const initialDrugData = {
  id: null,
  name: '',
  description: '',
  instructions: '',
  prescribed_date: new Date().toISOString().split('T')[0],
  price: 0.0,
  is_active: true,
  expiration_date: '',
  stock: 0,
};

function DrugsPage({ setIsLoggedIn }) {
  const [drugs, setDrugs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDrug, setCurrentDrug] = useState(initialDrugData);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

  // Check if drug is active based on expiration date
  const isDrugActive = (expirationDate) => {
    if (!expirationDate) return true;
    const today = new Date();
    const expDate = new Date(expirationDate);
    return expDate >= today;
  };

  // Centralized logout function
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('roles');
    setIsLoggedIn(false);
    navigate('/login');
  };

  // Log audit actions
  const logAuditAction = async (action, entityId, description) => {
    try {
      await api.post(AUDIT_API_URL, {
        action,
        entity_type: 'Drug',
        entity_id: entityId,
        description
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  // Fetch drugs from backend
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

        // Only proceed if user has appropriate role
        if (!decoded.roles?.some(role => ['Admin', 'Pharmacist'].includes(role))) {
          setError("You don't have permission to access this page");
          return;
        }

        setLoading(true);
        const response = await api.get(API_BASE_URL);
        const drugsWithStatus = response.data.map((drug) => ({
          ...drug,
          stock: drug.total_stock || 0,
          is_active: isDrugActive(drug.expiration_date) && drug.is_active
        }));
        setDrugs(drugsWithStatus);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch drugs. Please try again later.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyTokenAndFetchData();
  }, []);

  // Filter drugs based on search term
  const filteredDrugs = drugs.filter((drug) =>
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (drug = null) => {
    setCurrentDrug(drug || initialDrugData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDrug(initialDrugData);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDrug((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleActive = (e) => {
    setCurrentDrug((prev) => ({ ...prev, is_active: e.target.checked }));
  };

  const handleQuantityChange = (drugId, value) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [drugId]: value,
    }));
  };

  const validateDrug = () => {
    if (!currentDrug.name.trim()) {
      setError('Drug name is required');
      return false;
    }
    if (currentDrug.price <= 0) {
      setError('Price must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSaveDrug = async () => {
    if (!validateDrug()) return;

    setActionLoading(true);
    try {
      const payload = {
        ...currentDrug,
        price: parseFloat(currentDrug.price),
        is_active: isDrugActive(currentDrug.expiration_date) && currentDrug.is_active
      };

      if (currentDrug.id) {
        // Update existing drug
        const response = await api.put(`${API_BASE_URL}${currentDrug.id}`, payload);
        setDrugs((prev) =>
          prev.map((drug) => (drug.id === currentDrug.id ? { 
            ...response.data, 
            is_active: isDrugActive(response.data.expiration_date) && response.data.is_active 
          } : drug))
        );
        setMessage('Drug updated successfully');
        await logAuditAction(
          'drug_update',
          currentDrug.id,
          `Updated drug: ${currentDrug.name} (ID: ${currentDrug.id})`
        );
      } else {
        // Create new drug
        const response = await api.post(API_BASE_URL, payload);
        const newDrug = { 
          ...response.data, 
          is_active: isDrugActive(response.data.expiration_date) && response.data.is_active 
        };
        setDrugs((prev) => [...prev, newDrug]);
        setMessage('Drug created successfully');
        await logAuditAction(
          'drug_create',
          response.data.id,
          `Created new drug: ${response.data.name} (ID: ${response.data.id})`
        );
      }
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save drug');
      console.error('Save error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDrug = async (id) => {
    if (!window.confirm('Are you sure you want to delete this drug?')) return;

    setActionLoading(true);
    try {
      const drugToDelete = drugs.find(d => d.id === id);
      await api.delete(`${API_BASE_URL}${id}`);
      setDrugs((prev) => prev.filter((drug) => drug.id !== id));
      setMessage('Drug deleted successfully');
      await logAuditAction(
        'drug_delete',
        id,
        `Deleted drug: ${drugToDelete.name} (ID: ${id})`
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete drug');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockUpdate = async (drugId, action) => {
    const quantity = parseInt(quantityInputs[drugId] || 0);
    const drug = drugs.find(d => d.id === drugId);
    
    if (isNaN(quantity)) {
      setError('Please enter a valid quantity');
      return;
    }
    
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (action === 'sell') {
      if (drug.stock < quantity) {
        setError('Insufficient stock available');
        return;
      }
    }

    setActionLoading(true);
    try {
      const endpoint = action === 'add' ? 'stock' : 'sell';
      const response = await api.patch(
        `${API_BASE_URL}${drugId}/${endpoint}`,
        { quantity }
      );

      setDrugs((prev) =>
        prev.map((drug) =>
          drug.id === drugId ? { 
            ...drug, 
            stock: response.data.quantity,
            is_active: isDrugActive(drug.expiration_date) && drug.is_active
          } : drug
        )
      );

      // Clear the quantity input
      setQuantityInputs((prev) => ({ ...prev, [drugId]: '' }));

      setMessage(`Stock ${action === 'add' ? 'added' : 'sold'} successfully`);
      
      // Log the stock update
      await logAuditAction(
        `drug_stock_${action}`,
        drugId,
        `${action === 'add' ? 'Added' : 'Sold'} ${quantity} units of ${drug.name} (ID: ${drugId})`
      );
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} stock`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Drug Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add New Drug
        </Button>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        label="Search drugs by name or description"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {error && error.includes("permission") ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Available Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expiration Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrugs.map((drug) => (
                <TableRow key={drug.id}>
                  <TableCell>{drug.name}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>{drug.description}</TableCell>
                  <TableCell>₦{drug.price.toFixed(2)}</TableCell>
                  <TableCell>{drug.stock}</TableCell>
                  <TableCell>
                    <Chip
                      label={drug.is_active ? 'Active' : 'Inactive'}
                      color={drug.is_active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{drug.expiration_date || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={quantityInputs[drug.id] || ''}
                        onChange={(e) => handleQuantityChange(drug.id, e.target.value)}
                        sx={{ width: 80 }}
                        inputProps={{ min: 1 }}
                      />
                      <IconButton
                        color="primary"
                        onClick={() => handleStockUpdate(drug.id, 'add')}
                        disabled={actionLoading}
                      >
                        <AddCircle />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleStockUpdate(drug.id, 'sell')}
                        disabled={actionLoading || drug.stock <= 0}
                      >
                        <RemoveCircle />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(drug)}
                        disabled={actionLoading}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteDrug(drug.id)}
                        disabled={actionLoading}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Drug Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentDrug.id ? 'Edit Drug' : 'Add New Drug'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name *"
                name="name"
                value={currentDrug.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={currentDrug.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Price *"
                name="price"
                type="number"
                value={currentDrug.price}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                name="instructions"
                value={currentDrug.instructions}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prescribed Date"
                name="prescribed_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={currentDrug.prescribed_date}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiration Date"
                name="expiration_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={currentDrug.expiration_date}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentDrug.is_active}
                    onChange={handleToggleActive}
                    color="primary"
                    disabled={currentDrug.expiration_date && !isDrugActive(currentDrug.expiration_date)}
                  />
                }
                label="Active"
              />
              {currentDrug.expiration_date && !isDrugActive(currentDrug.expiration_date) && (
                <Typography variant="caption" color="error">
                  Drug is expired and cannot be activated
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary" disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDrug}
            color="primary"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!message}
        autoHideDuration={SNACKBAR_AUTO_HIDE_DURATION}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={SNACKBAR_AUTO_HIDE_DURATION}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default DrugsPage;