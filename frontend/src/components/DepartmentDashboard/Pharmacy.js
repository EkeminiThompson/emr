import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  IconButton,
  Divider,
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';

// Initialize axios instance with interceptors
const createApiClient = (token, handleLogout) => {
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  api.interceptors.request.use(config => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => Promise.reject(error));

  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        handleLogout();
      }
      return Promise.reject(error);
    }
  );

  return api;
};

function PatientSearch({ searchData, handleSearchChange, searchPatients, patients, error, handlePatientSelect, loading }) {
  return (
    <Paper sx={{ padding: 3 }}>
      <Typography variant="h5">Search Patients</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={searchData.patient_id}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Surname"
            name="surname"
            value={searchData.surname}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={searchData.other_names}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Hospital Registration Number"
            name="hospital_reg_number"
            value={searchData.hospital_reg_number}
            onChange={handleSearchChange}
          />
        </Grid>
      </Grid>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={searchPatients} 
        sx={{ marginTop: 2 }} 
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Search'}
      </Button>

      {patients.length > 0 && (
        <Paper sx={{ marginTop: 3, padding: 2 }}>
          <Typography variant="h5">Search Results</Typography>
          <List>
            {patients.map((patient) => (
              <ListItem key={patient.patient_id}>
                <ListItemText
                  primary={`${patient.surname}, ${patient.other_names} (ID: ${patient.patient_id})`}
                />
                <Button 
                  variant="outlined" 
                  onClick={() => handlePatientSelect(patient)}
                >
                  View Pharmacy Records
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      {error && <Typography color="error" sx={{ marginTop: 2 }}>{error}</Typography>}
    </Paper>
  );
}

function PharmacyHistory({ pharmacyRecords, handleDeleteRecord, handleEditRecord, handleMarkAsPaid, handleDownloadReceipt }) {
  return (
    <Paper sx={{ marginTop: 3, padding: 2 }}>
      <Typography variant="h5">Pharmacy Records</Typography>
      <List>
        {pharmacyRecords.map((record) => (
          <ListItem key={record.pharmacy_id}>
            <ListItemText
              primary={`Medication: ${record.medication_name}, Dosage: ${record.dosage_and_route}`}
              secondary={`Frequency: ${record.frequency}, Total Cost: ₦${record.total_cost}, Status: ${record.is_paid ? 'Paid' : 'Unpaid'}`}
            />
            <Button 
              variant="outlined" 
              sx={{ marginRight: 1 }} 
              onClick={() => handleEditRecord(record)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleDeleteRecord(record.pharmacy_id)}
            >
              Delete
            </Button>
            {!record.is_paid && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleMarkAsPaid(record.pharmacy_id)}
                sx={{ marginLeft: 1 }}
              >
                Mark as Paid
              </Button>
            )}
            {record.is_paid && (
              <Button
                variant="outlined"
                color="success"
                onClick={() => handleDownloadReceipt(record)}
                sx={{ marginLeft: 1 }}
              >
                Download Receipt
              </Button>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

function AddPharmacyRecord({ pharmacyData, setPharmacyData, addPharmacyRecord, drugs, loading }) {
  const calculateTotalCost = () => {
    return pharmacyData.drug_orders.reduce((total, drug) => total + (drug.price || 0) * (drug.quantity || 0), 0);
  };

  const handleAddDrug = () => {
    setPharmacyData(prev => ({
      ...prev,
      drug_orders: [...prev.drug_orders, { drug_id: '', quantity: 1, price: 0.0 }]
    }));
  };

  const handleDrugChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDrugs = pharmacyData.drug_orders.map((drug, i) =>
      i === index ? { ...drug, [name]: value } : drug
    );
    setPharmacyData({ ...pharmacyData, drug_orders: updatedDrugs });
  };

  const handleSubmit = () => {
    const total_cost = calculateTotalCost();
    const pharmacyRecord = {
      ...pharmacyData,
      drug_orders: pharmacyData.drug_orders.map(drug => ({
        drug_id: parseInt(drug.drug_id, 10),
        quantity: parseInt(drug.quantity, 10),
        price: drug.price ? parseFloat(drug.price) : null,
      }))
    };
    addPharmacyRecord(pharmacyRecord);
  };

  return (
    <Paper sx={{ marginTop: 3, padding: 2 }}>
      <Typography variant="h5">Add Pharmacy Record</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={pharmacyData.patient_id}
            disabled
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Medication Name"
            name="medication_name"
            value={pharmacyData.medication_name}
            onChange={(e) => setPharmacyData({ ...pharmacyData, medication_name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Dosage and Route"
            name="dosage_and_route"
            value={pharmacyData.dosage_and_route}
            onChange={(e) => setPharmacyData({ ...pharmacyData, dosage_and_route: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Frequency"
            name="frequency"
            value={pharmacyData.frequency}
            onChange={(e) => setPharmacyData({ ...pharmacyData, frequency: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Dispensation Date"
            name="dispensation_date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={pharmacyData.dispensation_date}
            onChange={(e) => setPharmacyData({ ...pharmacyData, dispensation_date: e.target.value })}
            required
          />
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ marginTop: 2 }}>Drug Orders</Typography>
      {pharmacyData.drug_orders.map((drug, index) => (
        <Grid container spacing={2} key={index}>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Drug</InputLabel>
              <Select
                name="drug_id"
                value={drug.drug_id || ''}
                onChange={(e) => handleDrugChange(index, e)}
                label="Drug"
                required
              >
                {drugs.map((drugOption) => (
                  <MenuItem key={drugOption.id} value={drugOption.id}>
                    {drugOption.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={drug.quantity}
              onChange={(e) => handleDrugChange(index, e)}
              required
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={drug.price || ''}
              onChange={(e) => handleDrugChange(index, e)}
            />
          </Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={handleAddDrug} sx={{ marginTop: 2 }}>
        Add Drug
      </Button>
      <Typography variant="h6" sx={{ marginTop: 2 }}>
        Total Cost: ₦{calculateTotalCost().toFixed(2)}
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSubmit} 
        sx={{ marginTop: 2 }} 
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Save Record'}
      </Button>
    </Paper>
  );
}

function WalkInSale({ drugs, loading, handleSubmit }) {
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [drugOrders, setDrugOrders] = useState([{ drug_id: '', quantity: 1, price: 0 }]);

  const calculateTotal = () => {
    return drugOrders.reduce((total, item) => {
      const price = item.price || drugs.find(d => d.id === item.drug_id)?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleAddDrug = () => {
    setDrugOrders([...drugOrders, { drug_id: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveDrug = (index) => {
    const newOrders = [...drugOrders];
    newOrders.splice(index, 1);
    setDrugOrders(newOrders);
  };

  const handleDrugChange = (index, field, value) => {
    const newOrders = [...drugOrders];
    newOrders[index][field] = field === 'drug_id' ? value : field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
    
    if (field === 'drug_id' && value) {
      const selectedDrug = drugs.find(d => d.id === value);
      if (selectedDrug) {
        newOrders[index].price = selectedDrug.price;
      }
    }
    
    setDrugOrders(newOrders);
  };

  const handleFormSubmit = async () => {
    const saleData = {
      customer_name: customerName,
      drug_orders: drugOrders.map(order => ({
        drug_id: order.drug_id,
        quantity: order.quantity,
        price: order.price
      }))
    };
    await handleSubmit(saleData);
  };

  return (
    <Paper sx={{ padding: 3, marginTop: 3 }}>
      <Typography variant="h5" gutterBottom>Walk-In Sale</Typography>
      
      <TextField
        fullWidth
        label="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        sx={{ marginBottom: 3 }}
      />
      
      <Typography variant="h6" sx={{ marginBottom: 2 }}>Items</Typography>
      
      {drugOrders.map((order, index) => (
        <Box key={index} sx={{ marginBottom: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={5}>
              <FormControl fullWidth>
                <InputLabel>Drug</InputLabel>
                <Select
                  value={order.drug_id || ''}
                  onChange={(e) => handleDrugChange(index, 'drug_id', e.target.value)}
                  label="Drug"
                  required
                >
                  {drugs.map((drug) => (
                    <MenuItem key={drug.id} value={drug.id}>
                      {drug.name} (₦{drug.price.toFixed(2)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label="Qty"
                type="number"
                value={order.quantity}
                onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={order.price}
                onChange={(e) => handleDrugChange(index, 'price', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton onClick={() => handleRemoveDrug(index)} color="error">
                <RemoveCircleOutline />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      ))}
      
      <Button 
        startIcon={<AddCircleOutline />} 
        onClick={handleAddDrug}
        sx={{ marginBottom: 3 }}
      >
        Add Item
      </Button>
      
      <Divider sx={{ marginY: 2 }} />
      
      <Typography variant="h6" sx={{ textAlign: 'right', marginBottom: 3 }}>
        Total: ₦{calculateTotal().toFixed(2)}
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleFormSubmit}
        disabled={loading || drugOrders.some(order => !order.drug_id)}
        fullWidth
        size="large"
      >
        {loading ? <CircularProgress size={24} /> : 'Process Sale & Download Receipt'}
      </Button>
    </Paper>
  );
}

function EditPharmacyDialog({ open, onClose, pharmacyRecord, setPharmacyRecord, handleUpdateRecord, drugs, loading }) {
  const calculateTotalCost = () => {
    return pharmacyRecord.drug_orders.reduce((total, drug) => total + (drug.price || 0) * (drug.quantity || 0), 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPharmacyRecord({ ...pharmacyRecord, [name]: value });
  };

  const handleDrugChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDrugs = pharmacyRecord.drug_orders.map((drug, i) =>
      i === index ? { ...drug, [name]: value } : drug
    );
    setPharmacyRecord({ ...pharmacyRecord, drug_orders: updatedDrugs });
  };

  const handleAddDrug = () => {
    setPharmacyRecord(prev => ({
      ...prev,
      drug_orders: [...prev.drug_orders, { drug_id: '', quantity: 1, price: 0.0 }]
    }));
  };

  const handleRemoveDrug = (index) => {
    const updatedDrugs = pharmacyRecord.drug_orders.filter((_, i) => i !== index);
    setPharmacyRecord({ ...pharmacyRecord, drug_orders: updatedDrugs });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Pharmacy Record</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Medication Name"
              name="medication_name"
              value={pharmacyRecord.medication_name || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dosage and Route"
              name="dosage_and_route"
              value={pharmacyRecord.dosage_and_route || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Frequency"
              name="frequency"
              value={pharmacyRecord.frequency || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dispensation Date"
              name="dispensation_date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={pharmacyRecord.dispensation_date || ''}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ marginTop: 2 }}>Drug Orders</Typography>
            {pharmacyRecord.drug_orders.map((drug, index) => (
              <Grid container spacing={2} key={index} sx={{ marginBottom: 2 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Drug</InputLabel>
                    <Select
                      name="drug_id"
                      value={drug.drug_id || ''}
                      onChange={(e) => handleDrugChange(index, e)}
                      label="Drug"
                      required
                    >
                      {drugs.map((drugOption) => (
                        <MenuItem key={drugOption.id} value={drugOption.id}>
                          {drugOption.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={drug.quantity}
                    onChange={(e) => handleDrugChange(index, e)}
                    required
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Price"
                    name="price"
                    type="number"
                    value={drug.price || ''}
                    onChange={(e) => handleDrugChange(index, e)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleRemoveDrug(index)}
                    sx={{ marginTop: 1 }}
                  >
                    Remove Drug
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Button variant="outlined" onClick={handleAddDrug} sx={{ marginTop: 2 }}>
              Add Drug
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ marginTop: 2 }}>
              Total Cost: ₦{calculateTotalCost().toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleUpdateRecord} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PharmacyDashboard({ setIsLoggedIn, user }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const [roles, setRoles] = useState([]);
  const [searchData, setSearchData] = useState({
    patient_id: '',
    surname: '',
    other_names: '',
    hospital_reg_number: ''
  });
  const [pharmacyData, setPharmacyData] = useState({
    patient_id: '',
    medication_name: '',
    dosage_and_route: '',
    frequency: '',
    dispensation_date: new Date().toISOString().split('T')[0],
    drug_orders: [],
  });
  const [patients, setPatients] = useState([]);
  const [pharmacyRecords, setPharmacyRecords] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pharmacyRecord, setPharmacyRecord] = useState(null);
  const [drugs, setDrugs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('roles');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const api = createApiClient(token, handleLogout);

  useEffect(() => {
    const verifyTokenAndFetchData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          handleLogout();
          return;
        }

        setRoles(decoded.roles || JSON.parse(localStorage.getItem('roles') || '[]'));
        await fetchDrugs();
      } catch (error) {
        console.error('Token verification failed:', error);
        handleLogout();
      }
    };

    verifyTokenAndFetchData();
  }, []);

  const logAuditAction = async (action, entityId, description) => {
    try {
      await api.post('/v1/audit/audit-logs/', {
        action,
        entity_type: 'Pharmacy',
        entity_id: entityId,
        description
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const fetchDrugs = async () => {
    try {
      const response = await api.get('/v1/pharmacy/drugs');
      setDrugs(response.data);
    } catch (err) {
      setError("Error fetching drugs.");
    }
  };

  const searchPatients = async () => {
    const { patient_id, surname, other_names, hospital_reg_number } = searchData;
    setLoading(true);
    try {
      const response = await api.get('/v1/pharmacy/patients', {
        params: { patient_id, surname, other_names, hospital_reg_number },
      });
      setPatients(response.data.patients);
      setError(null);
    } catch (err) {
      setError("No patients found.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setPharmacyData({ ...pharmacyData, patient_id: patient.patient_id });
    try {
      const response = await api.get(`/v1/pharmacy/patients/${patient.patient_id}/pharmacy`);
      setPharmacyRecords(response.data);
      setError(null);
    } catch (err) {
      setError("Error fetching pharmacy records for this patient.");
    }
  };

  const addPharmacyRecord = async (record) => {
    setLoading(true);
    try {
      const response = await api.post(`/v1/pharmacy/patients/${record.patient_id}/pharmacy`, record);
      setPharmacyRecords([...pharmacyRecords, response.data]);
      setMessage("Pharmacy record created successfully.");
      
      await logAuditAction(
        'pharmacy_record_create',
        response.data.pharmacy_id,
        `Created pharmacy record for patient ${record.patient_id}`
      );
    } catch (err) {
      setError("Out of stock Or Use walkin-sale");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (record_id) => {
    setLoading(true);
    try {
      await api.delete(`/v1/pharmacy/patients/${selectedPatient.patient_id}/pharmacy/${record_id}`);
      setPharmacyRecords(pharmacyRecords.filter(record => record.pharmacy_id !== record_id));
      setMessage("Pharmacy record deleted successfully.");
      
      await logAuditAction(
        'pharmacy_record_delete',
        record_id,
        `Deleted pharmacy record ${record_id} for patient ${selectedPatient.patient_id}`
      );
    } catch (err) {
      setError("Error deleting pharmacy record.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = (record) => {
    setPharmacyRecord(record);
    setEditDialogOpen(true);
  };

  const handleUpdateRecord = async () => {
    setLoading(true);
    try {
      const response = await api.put(
        `/v1/pharmacy/patients/${pharmacyRecord.patient_id}/pharmacy/${pharmacyRecord.pharmacy_id}`,
        pharmacyRecord
      );
      const updatedRecords = pharmacyRecords.map(item =>
        item.pharmacy_id === pharmacyRecord.pharmacy_id ? response.data : item
      );
      setPharmacyRecords(updatedRecords);
      setMessage("Pharmacy record updated successfully.");
      setEditDialogOpen(false);
      
      await logAuditAction(
        'pharmacy_record_update',
        pharmacyRecord.pharmacy_id,
        `Updated pharmacy record ${pharmacyRecord.pharmacy_id} for patient ${pharmacyRecord.patient_id}`
      );
    } catch (err) {
      setError("Error updating pharmacy record.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (record_id) => {
    setLoading(true);
    try {
      const response = await api.patch(
        `/v1/pharmacy/patients/${selectedPatient.patient_id}/pharmacy/${record_id}/mark-as-paid`
      );
      const updatedRecords = pharmacyRecords.map(record =>
        record.pharmacy_id === record_id ? { ...record, is_paid: true } : record
      );
      setPharmacyRecords(updatedRecords);
      setMessage("Pharmacy record marked as paid successfully.");
      
      await logAuditAction(
        'pharmacy_record_paid',
        record_id,
        `Marked pharmacy record ${record_id} as paid for patient ${selectedPatient.patient_id}`
      );
    } catch (err) {
      setError("Error marking pharmacy record as paid.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (record) => {
    try {
      const response = await api.get(
        `/v1/pharmacy/patients/${selectedPatient.patient_id}/pharmacy/${record.pharmacy_id}/download-receipt`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Receipt_${record.pharmacy_id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      await logAuditAction(
        'pharmacy_receipt_download',
        record.pharmacy_id,
        `Downloaded receipt for pharmacy record ${record.pharmacy_id}`
      );
    } catch (err) {
      console.error("Error downloading receipt:", err);
      setError("Error generating receipt.");
    }
  };

  const handleWalkInSale = async (saleData) => {
    setLoading(true);
    try {
      const response = await api.post('/v1/pharmacy/walkin-sale', saleData, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `WalkIn_Receipt_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

      await logAuditAction(
        'walkin_sale',
        null,
        `Processed walk-in sale for ${saleData.customer_name} with ${saleData.drug_orders.length} items`
      );

      setMessage('Walk-in sale processed successfully! Receipt downloaded.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error processing walk-in sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)} 
        sx={{ marginBottom: 3 }}
      >
        <Tab label="Patient Pharmacy" />
        <Tab label="Walk-In Sales" />
      </Tabs>
      
      {activeTab === 0 ? (
        <>
          <PatientSearch
            searchData={searchData}
            handleSearchChange={handleSearchChange}
            searchPatients={searchPatients}
            patients={patients}
            error={error}
            handlePatientSelect={handlePatientSelect}
            loading={loading}
          />
          {selectedPatient && (
            <div>
              <PharmacyHistory
                pharmacyRecords={pharmacyRecords}
                handleDeleteRecord={handleDeleteRecord}
                handleEditRecord={handleEditRecord}
                handleMarkAsPaid={handleMarkAsPaid}
                handleDownloadReceipt={handleDownloadReceipt}
              />
              <AddPharmacyRecord
                pharmacyData={pharmacyData}
                setPharmacyData={setPharmacyData}
                addPharmacyRecord={addPharmacyRecord}
                drugs={drugs}
                loading={loading}
              />
            </div>
          )}
        </>
      ) : (
        <WalkInSale 
          drugs={drugs} 
          loading={loading} 
          handleSubmit={handleWalkInSale}
        />
      )}
      
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
      >
        <Alert severity="success">{message}</Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      {pharmacyRecord && (
        <EditPharmacyDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          pharmacyRecord={pharmacyRecord}
          setPharmacyRecord={setPharmacyRecord}
          handleUpdateRecord={handleUpdateRecord}
          drugs={drugs}
          loading={loading}
        />
      )}
    </Container>
  );
}

export default PharmacyDashboard;