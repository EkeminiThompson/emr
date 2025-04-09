import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axiosInstance';
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
  Divider,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import { useReactToPrint } from 'react-to-print';

// Constants
const OCCUPATIONAL_FIELDS = [
  'long_term_goals',
  'short_term_goals',
  'adls_performance',
  'cognitive_motor_skills',
  'therapy_sessions',
  'assistive_devices',
  'improvements_observed',
  'barriers_to_progress'
];

// EditDialog Component
const EditDialog = ({ 
  open, 
  onClose, 
  record, 
  setEditRecord, 
  handleUpdateRecord, 
  loading 
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditRecord(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Occupational Therapy Record</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {OCCUPATIONAL_FIELDS.map(field => (
            <Grid item xs={12} sm={6} key={field}>
              <TextField
                fullWidth
                label={field.replace(/_/g, ' ')}
                name={field}
                value={record?.[field] || ''}
                onChange={handleChange}
                disabled={loading}
                multiline
                rows={4}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpdateRecord} 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Patient Search Component
function PatientSearch({ 
  searchData, 
  handleSearchChange, 
  searchPatients, 
  patients, 
  error, 
  handlePatientSelect, 
  loading 
}) {
  return (
    <Paper sx={{ padding: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>Search Patients</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={searchData.patient_id}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Surname"
            name="surname"
            value={searchData.surname}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={searchData.other_names}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Hospital Registration Number"
            name="hospital_reg_number"
            value={searchData.hospital_reg_number}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </Grid>
      </Grid>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={searchPatients} 
        sx={{ mt: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Search'}
      </Button>

      {patients.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>Search Results</Typography>
          <List>
            {patients.map(patient => (
              <ListItem key={patient.patient_id}>
                <ListItemText
                  primary={`${patient.surname}, ${patient.other_names}`}
                  secondary={`ID: ${patient.patient_id}`}
                />
                <Button 
                  variant="outlined" 
                  onClick={() => handlePatientSelect(patient)}
                  disabled={loading}
                >
                  View Occupational Therapy Records
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
  );
}

// Occupational Therapy Records Component
function OccupationalTherapyRecords({ 
  records, 
  handleEditRecord, 
  handleDeleteRecord, 
  deleteLoading, 
  printRef 
}) {
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <Paper sx={{ mt: 3, p: 3 }} ref={printRef}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Typography variant="h5" gutterBottom>Occupational Therapy Records</Typography>
        <Tooltip title="Print Records">
          <IconButton 
            color="primary" 
            onClick={handlePrint}
            sx={{ ml: 2 }}
          >
            <PrintIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {records.length > 0 ? (
        <List>
          {records.map((record, index) => (
            <React.Fragment key={record.id}>
              <ListItem>
                <Grid container spacing={2}>
                  {OCCUPATIONAL_FIELDS.map(field => (
                    <Grid item xs={12} sm={6} key={field}>
                      <Typography variant="body1">
                        <strong>{field.replace(/_/g, ' ')}:</strong> {record[field] || 'N/A'}
                      </Typography>
                    </Grid>
                  ))}
                  <Grid item xs={12} container justifyContent="flex-end">
                    <IconButton
                      color="primary"
                      onClick={() => handleEditRecord(record)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteRecord(record.id)}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? <CircularProgress size={24} /> : <DeleteIcon />}
                    </IconButton>
                  </Grid>
                </Grid>
              </ListItem>
              {index < records.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          No occupational therapy records found
        </Typography>
      )}
    </Paper>
  );
}

// Add Occupational Therapy Record Component
function AddOccupationalTherapyRecord({ 
  data, 
  setData, 
  onSubmit, 
  loading, 
  selectedPatient 
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h5" gutterBottom>Add Occupational Therapy Record</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={data.patient_id}
            disabled
            sx={{ mb: 2 }}
          />
        </Grid>
        {OCCUPATIONAL_FIELDS.map(field => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, ' ')}
              name={field}
              value={data[field]}
              onChange={handleChange}
              disabled={loading || !selectedPatient}
              multiline
              rows={4}
            />
          </Grid>
        ))}
      </Grid>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={onSubmit} 
        sx={{ mt: 2 }}
        disabled={loading || !selectedPatient}
      >
        {loading ? <CircularProgress size={24} /> : 'Add Record'}
      </Button>
    </Paper>
  );
}

// Confirmation Dialog
function ConfirmationDialog({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  loading 
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main OccupationalTherapy Component
function OccupationalTherapy() {
  const [occupationalTherapyData, setOccupationalTherapyData] = useState({
    patient_id: '',
    ...Object.fromEntries(OCCUPATIONAL_FIELDS.map(field => [field, '']))
  });

  const [searchData, setSearchData] = useState({
    patient_id: '',
    surname: '',
    other_names: '',
    hospital_reg_number: '',
  });

  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  
  // Dialog States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Print Ref
  const printRef = useRef();
  const navigate = useNavigate();

  // Fetch occupational therapy records for a patient
  const fetchRecords = async (patient_id) => {
    if (!patient_id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/v1/occupational/v1/patients/${patient_id}/occupationaltherapy`);
      setRecords(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch occupational therapy records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Search patients
  const searchPatients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/v1/occupational/v1/patients/`, {
        params: searchData
      });
      setPatients(response.data.patients || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search patients");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setOccupationalTherapyData(prev => ({ 
      ...prev, 
      patient_id: patient.patient_id 
    }));
    fetchRecords(patient.patient_id);
  };

  // Add new occupational therapy record
  const addRecord = async () => {
    if (!occupationalTherapyData.patient_id) {
      setError("Please select a patient first");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/v1/occupational/v1/patients/${occupationalTherapyData.patient_id}/occupationaltherapy`,
        occupationalTherapyData
      );
      setMessage("Record added successfully");
      fetchRecords(occupationalTherapyData.patient_id);
      // Reset form but keep patient_id
      setOccupationalTherapyData(prev => ({
        patient_id: prev.patient_id,
        ...Object.fromEntries(OCCUPATIONAL_FIELDS.map(field => [field, '']))
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  // Update existing record
  const updateRecord = async () => {
    if (!editRecord) return;

    setLoading(true);
    try {
      await axios.put(
        `/v1/occupational/v1/patients/${editRecord.patient_id}/occupationaltherapy/${editRecord.id}`,
        editRecord
      );
      setMessage("Record updated successfully");
      fetchRecords(editRecord.patient_id);
      setEditDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  // Delete record with confirmation
  const handleDeleteRecord = (recordId) => {
    setRecordToDelete(recordId);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete || !selectedPatient) return;

    setDeleteLoading(true);
    try {
      await axios.delete(
        `/v1/occupational/v1/patients/${selectedPatient.patient_id}/occupationaltherapy/${recordToDelete}`
      );
      setMessage("Record deleted successfully");
      fetchRecords(selectedPatient.patient_id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete record");
    } finally {
      setDeleteLoading(false);
      setConfirmDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  // Handle search field changes
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  // Reset alerts after timeout
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Occupational Therapy Records
      </Typography>

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
        <>
          <OccupationalTherapyRecords
            records={records}
            handleEditRecord={(record) => {
              setEditRecord(record);
              setEditDialogOpen(true);
            }}
            handleDeleteRecord={handleDeleteRecord}
            deleteLoading={deleteLoading}
            printRef={printRef}
          />

          <AddOccupationalTherapyRecord
            data={occupationalTherapyData}
            setData={setOccupationalTherapyData}
            onSubmit={addRecord}
            loading={loading}
            selectedPatient={selectedPatient}
          />
        </>
      )}

      {/* Edit Dialog */}
      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        record={editRecord}
        setEditRecord={setEditRecord}
        handleUpdateRecord={updateRecord}
        loading={loading}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record?"
        loading={deleteLoading}
      />

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message || !!error}
        autoHideDuration={6000}
        onClose={() => {
          setMessage('');
          setError(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={error ? 'error' : 'success'} 
          onClose={() => error ? setError(null) : setMessage('')}
          sx={{ width: '100%' }}
        >
          {error || message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default OccupationalTherapy;