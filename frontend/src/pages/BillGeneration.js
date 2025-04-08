import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  TextField, Button, Container, Typography, Grid, Paper, List, ListItem, 
  ListItemText, Snackbar, Alert, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, Select, MenuItem, Box, IconButton,
  CircularProgress
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { FeeTypeEnum } from './enums';
import { jwtDecode } from 'jwt-decode';

// Constants for better maintainability
const API_BASE_URL = '/v1/billing/v1';
const DOCTORS_API_URL = '/v1/admin/doctors/';
const AUDIT_API_URL = '/v1/audit/audit-logs/';
const SNACKBAR_AUTO_HIDE_DURATION = 6000;

// Utility function for API error handling
const handleApiError = (error, setError) => {
  console.error('API Error:', error);
  setError(error.response?.data?.message || "An error occurred");
  return null;
};

// Search Component
const BillSearch = React.memo(({ 
  searchData, 
  handleSearchChange, 
  searchPatients, 
  patients = [], 
  error, 
  handlePatientSelect,
  loading 
}) => (
  <Paper sx={{ padding: 3, mb: 3 }}>
    <Typography variant="h5" gutterBottom>Search Patients</Typography>
    <Grid container spacing={2}>
      {['patient_id', 'surname', 'other_names', 'hospital_reg_number'].map((field) => (
        <Grid item xs={12} sm={6} key={field}>
          <TextField
            fullWidth
            label={field.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
            name={field}
            value={searchData[field]}
            onChange={handleSearchChange}
          />
        </Grid>
      ))}
    </Grid>
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={searchPatients}
        disabled={loading}
      >
        Search
        {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
      </Button>
    </Box>

    {patients.length > 0 && (
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h5" gutterBottom>Search Results</Typography>
        <List>
          {patients.map((patient) => (
            <ListItem key={patient.patient_id} divider>
              <ListItemText
                primary={`${patient.surname}, ${patient.other_names}`}
                secondary={`ID: ${patient.patient_id} | Reg: ${patient.hospital_reg_number}`}
              />
              <Button 
                variant="outlined" 
                onClick={() => handlePatientSelect(patient)}
                disabled={loading}
              >
                View Billing History
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>
    )}
    {error && (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )}
  </Paper>
));

// Billing History Component
const BillingHistory = React.memo(({ 
  billings, 
  handleDeleteBilling, 
  handleEditBilling, 
  handleMarkAsPaid, 
  handleDownloadReceipt,
  loading 
}) => {
  if (billings.length === 0) return null;

  return (
    <Paper sx={{ mt: 3, p: 2 }}>
      <Typography variant="h5" gutterBottom>Billing History</Typography>
      <List>
        {billings.map((billing) => (
          <ListItem key={billing.billing_id} divider>
            <ListItemText
              primary={`Invoice #${billing.invoice_number} - ₦${billing.total_bill}`}
              secondary={`Doctor: ${billing.doctor_id} | Status: ${billing.status} | Date: ${new Date(billing.invoice_date).toLocaleDateString()}`}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {billing.status === "Unpaid" && (
                <Button 
                  variant="outlined" 
                  onClick={() => handleMarkAsPaid(billing.billing_id)}
                  disabled={loading}
                >
                  Mark Paid
                </Button>
              )}
              {billing.status === "Paid" && (
                <Button 
                  variant="outlined" 
                  onClick={() => handleDownloadReceipt(billing.billing_id)}
                  disabled={loading}
                >
                  Receipt
                </Button>
              )}
              <Button 
                variant="outlined" 
                onClick={() => handleEditBilling(billing)}
                disabled={loading}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDeleteBilling(billing.billing_id)}
                disabled={loading}
              >
                Delete
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
});

// Fee Item Component
const FeeItem = ({ fee, index, handleFeeChange, handleRemoveFee }) => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={5}>
      <FormControl fullWidth>
        <InputLabel>Fee Type</InputLabel>
        <Select
          name="fee_type"
          value={fee.fee_type}
          onChange={(e) => handleFeeChange(index, e)}
          label="Fee Type"
        >
          {Object.entries(FeeTypeEnum).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={5}>
      <TextField
        fullWidth
        label="Amount"
        name="amount"
        type="number"
        value={fee.amount}
        onChange={(e) => handleFeeChange(index, e)}
        inputProps={{ min: 0, step: 0.01 }}
      />
    </Grid>
    <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton color="error" onClick={() => handleRemoveFee(index)}>
        <RemoveCircleOutline />
      </IconButton>
    </Grid>
  </Grid>
);

// Add Billing Component
const AddBilling = React.memo(({ billingData, setBillingData, addBilling, doctors, loading }) => {
  const calculateTotalFees = useCallback(() => {
    const totalFees = billingData.fees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
    const discountPercentage = parseFloat(billingData.discount_percentage || 0);
    const discountAmount = parseFloat(billingData.discount_amount || 0);
    const discountBasedOnPercentage = totalFees * (discountPercentage / 100);
    const totalDiscount = Math.max(discountBasedOnPercentage, discountAmount);
    return totalFees - totalDiscount;
  }, [billingData.fees, billingData.discount_percentage, billingData.discount_amount]);

  const handleAddFee = () => {
    setBillingData(prev => ({
      ...prev,
      fees: [...prev.fees, { fee_type: '', amount: '', billing_id: 0 }],
    }));
  };

  const handleFeeChange = (index, e) => {
    const { name, value } = e.target;
    setBillingData(prev => ({
      ...prev,
      fees: prev.fees.map((fee, i) => (i === index ? { ...fee, [name]: value } : fee)),
    }));
  };

  const handleRemoveFee = (index) => {
    setBillingData(prev => ({
      ...prev,
      fees: prev.fees.filter((_, i) => i !== index),
    }));
  };

  const handleDoctorChange = (e) => {
    setBillingData(prev => ({ ...prev, doctor_id: e.target.value }));
  };

  const handleSubmit = () => {
    const billData = {
      ...billingData,
      invoice_status: "not_generated",
      invoice_date: new Date().toISOString(),
      total_bill: parseFloat(billingData.total_bill),
      discount_percentage: parseFloat(billingData.discount_percentage || 0),
      discount_amount: parseFloat(billingData.discount_amount || 0),
      doctor_id: parseInt(billingData.doctor_id, 10),
      fees: billingData.fees.map(fee => ({
        ...fee,
        amount: parseFloat(fee.amount || 0),
      })),
    };
    addBilling(billData);
  };

  useEffect(() => {
    const totalBill = calculateTotalFees();
    setBillingData(prev => ({ ...prev, total_bill: totalBill.toFixed(2) }));
  }, [calculateTotalFees, setBillingData]);

  return (
    <Paper sx={{ mt: 3, p: 2 }}>
      <Typography variant="h5" gutterBottom>Create New Billing</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Patient ID"
            value={billingData.patient_id}
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Doctor</InputLabel>
            <Select
              label="Doctor"
              value={billingData.doctor_id || ''}
              onChange={handleDoctorChange}
            >
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.full_name} ({doctor.specialty})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Bill"
            value={billingData.total_bill}
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Discount Percentage"
            name="discount_percentage"
            type="number"
            value={billingData.discount_percentage}
            onChange={(e) => setBillingData(prev => ({ ...prev, discount_percentage: e.target.value }))}
            inputProps={{ min: 0, max: 100, step: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Discount Amount"
            name="discount_amount"
            type="number"
            value={billingData.discount_amount}
            onChange={(e) => setBillingData(prev => ({ ...prev, discount_amount: e.target.value }))}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Fees</Typography>
      {billingData.fees.map((fee, index) => (
        <FeeItem 
          key={index} 
          fee={fee} 
          index={index} 
          handleFeeChange={handleFeeChange} 
          handleRemoveFee={handleRemoveFee} 
        />
      ))}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<AddCircleOutline />} 
          onClick={handleAddFee}
        >
          Add Fee
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={loading || !billingData.doctor_id || billingData.fees.length === 0}
        >
          Create Billing
          {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
        </Button>
      </Box>
    </Paper>
  );
});

// Edit Billing Dialog Component
const EditBillingDialog = React.memo(({ 
  open, 
  onClose, 
  billing, 
  setBilling, 
  handleUpdateBilling, 
  doctors,
  loading 
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBilling(prev => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (e) => {
    setBilling(prev => ({ ...prev, doctor_id: e.target.value }));
  };

  const handleFeeChange = (index, e) => {
    const { name, value } = e.target;
    setBilling(prev => ({
      ...prev,
      fees: prev.fees.map((fee, i) => (i === index ? { ...fee, [name]: value } : fee)),
    }));
  };

  const handleAddFee = () => {
    setBilling(prev => ({
      ...prev,
      fees: [...prev.fees, { fee_type: '', amount: '' }],
    }));
  };

  const handleRemoveFee = (index) => {
    setBilling(prev => ({
      ...prev,
      fees: prev.fees.filter((_, i) => i !== index),
    }));
  };

  if (!billing) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Billing Record</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Doctor</InputLabel>
              <Select
                label="Doctor"
                value={billing.doctor_id || ''}
                onChange={handleDoctorChange}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.full_name} ({doctor.specialty})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Bill"
              name="total_bill"
              type="number"
              value={billing.total_bill || ''}
              onChange={handleChange}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Discount Percentage"
              name="discount_percentage"
              type="number"
              value={billing.discount_percentage || ''}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100, step: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Discount Amount"
              name="discount_amount"
              type="number"
              value={billing.discount_amount || ''}
              onChange={handleChange}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Fees</Typography>
            {billing.fees?.map((fee, index) => (
              <FeeItem 
                key={index} 
                fee={fee} 
                index={index} 
                handleFeeChange={handleFeeChange} 
                handleRemoveFee={handleRemoveFee} 
              />
            ))}
            <Button 
              variant="outlined" 
              startIcon={<AddCircleOutline />} 
              onClick={handleAddFee}
              sx={{ mt: 1 }}
            >
              Add Fee
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpdateBilling} 
          color="primary"
          disabled={loading || !billing.doctor_id || billing.fees.length === 0}
        >
          Update
          {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// Main Component
function BillGeneration({ setIsLoggedIn }) {
  const [searchData, setSearchData] = useState({
    patient_id: '',
    surname: '',
    other_names: '',
    hospital_reg_number: ''
  });

  const [billingData, setBillingData] = useState({
    patient_id: '',
    doctor_id: '',
    total_bill: '',
    discount_percentage: '0',
    discount_amount: '0',
    fees: []
  });

  const [patients, setPatients] = useState([]);
  const [billings, setBillings] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [billingToEdit, setBillingToEdit] = useState(null);
  const [doctors, setDoctors] = useState([]);
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

  // Centralized logout function
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('roles');
    setIsLoggedIn(false);
    navigate('/login');
  };

  // Verify token and fetch data on component mount
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

        // Handle roles carefully to avoid JSON parsing errors
        let userRoles = [];
        if (decoded.roles) {
          userRoles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
        } else {
          try {
            const storedRoles = localStorage.getItem('roles');
            userRoles = storedRoles ? JSON.parse(storedRoles) : [];
          } catch (e) {
            console.error('Error parsing roles:', e);
            userRoles = [];
          }
        }

        setRoles(userRoles);
        await fetchDoctors();
      } catch (error) {
        console.error('Token verification failed:', error);
        handleLogout();
      }
    };

    verifyTokenAndFetchData();
  }, []);

  const logAuditAction = async (action, entityId, description) => {
    try {
      await api.post(AUDIT_API_URL, {
        action,
        entity_type: 'Billing',
        entity_id: entityId,
        description
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get(DOCTORS_API_URL);
      setDoctors(response.data);
    } catch (error) {
      handleApiError(error, setError);
    }
  };

  const searchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${API_BASE_URL}/patients/`, {
        params: searchData,
      });
      setPatients(response.data.patients || []);
      setError(null);
    } catch (error) {
      handleApiError(error, setError);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientSelect = async (patient) => {
    setLoading(true);
    setSelectedPatient(patient);
    setBillingData(prev => ({ 
      ...prev, 
      patient_id: patient.patient_id,
      fees: [] 
    }));
    
    try {
      const response = await api.get(`${API_BASE_URL}/patients/${patient.patient_id}/billings`);
      setBillings(response.data || []);
      setError(null);
    } catch (error) {
      handleApiError(error, setError);
      setBillings([]);
    } finally {
      setLoading(false);
    }
  };

  const addBilling = async (billData) => {
    setLoading(true);
    try {
      const response = await api.post(
        `${API_BASE_URL}/patients/${billData.patient_id}/billings`, 
        billData
      );
      setBillings(prev => [...prev, response.data]);
      setMessage("Billing created successfully.");
      setBillingData(prev => ({ ...prev, fees: [] }));
      
      // Log audit action
      await logAuditAction(
        'billing_create',
        response.data.billing_id,
        `Created billing for patient ${billData.patient_id} with total ₦${billData.total_bill}`
      );
    } catch (error) {
      handleApiError(error, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBilling = async (billing_id) => {
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/patients/${selectedPatient.patient_id}/billings/${billing_id}`
      );
      setBillings(prev => prev.filter(b => b.billing_id !== billing_id));
      setMessage("Billing deleted successfully.");
      
      // Log audit action
      await logAuditAction(
        'billing_delete',
        billing_id,
        `Deleted billing ${billing_id} for patient ${selectedPatient.patient_id}`
      );
    } catch (error) {
      handleApiError(error, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBilling = (billing) => {
    setBillingToEdit(billing);
    setEditDialogOpen(true);
  };

  const handleUpdateBilling = async () => {
    setLoading(true);
    try {
      if (billingToEdit.discount_percentage && billingToEdit.discount_amount) {
        billingToEdit.discount_amount = null;
      }
      
      const response = await api.put(
        `${API_BASE_URL}/patients/${billingToEdit.patient_id}/billings/${billingToEdit.billing_id}`,
        billingToEdit
      );
      
      setBillings(prev => prev.map(b => 
        b.billing_id === billingToEdit.billing_id ? response.data : b
      ));
      setMessage("Billing updated successfully.");
      setEditDialogOpen(false);
      
      // Log audit action
      await logAuditAction(
        'billing_update',
        billingToEdit.billing_id,
        `Updated billing ${billingToEdit.billing_id} for patient ${billingToEdit.patient_id}`
      );
    } catch (error) {
      handleApiError(error, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (billing_id) => {
    setLoading(true);
    try {
      const response = await api.patch(
        `${API_BASE_URL}/patients/${selectedPatient.patient_id}/billings/${billing_id}/mark-as-paid`
      );
      setBillings(prev => prev.map(b => 
        b.billing_id === billing_id ? response.data : b
      ));
      setMessage("Billing marked as paid successfully.");
      
      // Log audit action
      await logAuditAction(
        'billing_paid',
        billing_id,
        `Marked billing ${billing_id} as paid for patient ${selectedPatient.patient_id}`
      );
    } catch (error) {
      handleApiError(error, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (billing_id) => {
    setLoading(true);
    try {
      const response = await api.get(
        `${API_BASE_URL}/patients/${selectedPatient.patient_id}/billings/${billing_id}/download-receipt`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${billing_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setMessage("Receipt downloaded successfully.");
      
      // Log audit action
      await logAuditAction(
        'receipt_download',
        billing_id,
        `Downloaded receipt for billing ${billing_id}`
      );
    } catch (error) {
      handleApiError(error, setError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <BillSearch
        searchData={searchData}
        handleSearchChange={handleSearchChange}
        searchPatients={searchPatients}
        patients={patients}
        error={error}
        handlePatientSelect={handlePatientSelect}
        loading={loading}
      />
      
      {selectedPatient && (
        <>
          <BillingHistory
            billings={billings}
            handleDeleteBilling={handleDeleteBilling}
            handleEditBilling={handleEditBilling}
            handleMarkAsPaid={handleMarkAsPaid}
            handleDownloadReceipt={handleDownloadReceipt}
            loading={loading}
          />
          
          <AddBilling
            billingData={billingData}
            setBillingData={setBillingData}
            addBilling={addBilling}
            doctors={doctors}
            loading={loading}
          />
        </>
      )}
      
      <Snackbar
        open={!!message}
        autoHideDuration={SNACKBAR_AUTO_HIDE_DURATION}
        onClose={() => setMessage('')}
      >
        <Alert severity="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={SNACKBAR_AUTO_HIDE_DURATION}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <EditBillingDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        billing={billingToEdit}
        setBilling={setBillingToEdit}
        handleUpdateBilling={handleUpdateBilling}
        doctors={doctors}
        loading={loading}
      />
    </Container>
  );
}

export default BillGeneration;