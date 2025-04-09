import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Constants
//const API_BASE_URL = '/v1/social-work/v1';
const SOCIAL_WORK_FIELDS = [
  'housing_status',
  'employment_status',
  'family_support_system',
  'counseling_sessions',
  'financial_assistance',
  'referrals_to_agencies',
  'support_groups'
];

// Fields that should use multiline
const MULTILINE_FIELDS = [
  'family_support_system',
  'counseling_sessions',
  'referrals_to_agencies',
  'support_groups'
];

// Patient Search Component
function PatientSearch({ searchData, handleSearchChange, searchPatients, patients, error, handlePatientSelect, loading }) {
  return (
    <Paper sx={{ padding: 3, marginBottom: 3 }}>
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
        sx={{ marginTop: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Search'}
      </Button>

      {patients.length > 0 && (
        <Paper sx={{ marginTop: 3, padding: 2 }}>
          <Typography variant="h6" gutterBottom>Search Results</Typography>
          <List>
            {patients.map((patient) => (
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
                  View Social Work History
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      {error && (
        <Alert severity="error" sx={{ marginTop: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}

// Social Work History Component
function SocialWorkHistory({ socialWorkHistory, handleEditRecord, handleDeleteRecord, deleteLoading }) {
  return (
    <Paper sx={{ marginTop: 3, padding: 3 }}>
      <Typography variant="h5" gutterBottom>Social Work History</Typography>
      
      {socialWorkHistory.length > 0 ? (
        <List>
          {socialWorkHistory.map((record, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <Grid container spacing={2}>
                  {SOCIAL_WORK_FIELDS.map((field) => (
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
                      sx={{ marginRight: 1 }}
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
              {index < socialWorkHistory.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          No social work records found
        </Typography>
      )}
    </Paper>
  );
}

// Add Social Work Record Component
function AddSocialWorkRecord({ socialWorkData, setSocialWorkData, addSocialWorkRecord, loading }) {
  return (
    <Paper sx={{ marginTop: 3, padding: 3 }}>
      <Typography variant="h5" gutterBottom>Add Social Work Record</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={socialWorkData.patient_id}
            disabled
            sx={{ marginBottom: 2 }}
          />
        </Grid>
        {SOCIAL_WORK_FIELDS.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, ' ')}
              name={field}
              value={socialWorkData[field]}
              onChange={(e) => setSocialWorkData({ ...socialWorkData, [field]: e.target.value })}
              disabled={loading}
              multiline={MULTILINE_FIELDS.includes(field)}
              rows={MULTILINE_FIELDS.includes(field) ? 3 : 1}
            />
          </Grid>
        ))}
      </Grid>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={addSocialWorkRecord} 
        sx={{ marginTop: 2 }}
        disabled={loading || !socialWorkData.patient_id}
      >
        {loading ? <CircularProgress size={24} /> : 'Add Record'}
      </Button>
    </Paper>
  );
}

// Edit Dialog Component
function EditDialog({ open, onClose, record, setEditRecord, handleUpdateRecord, loading }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditRecord({ ...record, [name]: value });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Social Work Record</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ marginTop: 1 }}>
          {SOCIAL_WORK_FIELDS.map((field) => (
            <Grid item xs={12} sm={6} key={field}>
              <TextField
                fullWidth
                label={field.replace(/_/g, ' ')}
                name={field}
                value={record?.[field] || ''}
                onChange={handleChange}
                disabled={loading}
                multiline={MULTILINE_FIELDS.includes(field)}
                rows={MULTILINE_FIELDS.includes(field) ? 3 : 1}
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
          {loading ? <CircularProgress size={24} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Confirmation Dialog
function ConfirmationDialog({ open, onClose, onConfirm, title, message, loading }) {
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

// Main SocialWork Component
function SocialWork() {
  const [socialWorkData, setSocialWorkData] = useState({
    patient_id: '',
    ...Object.fromEntries(SOCIAL_WORK_FIELDS.map(field => [field, '']))
  });

  const [searchData, setSearchData] = useState({
    patient_id: '',
    surname: '',
    other_names: '',
    hospital_reg_number: '',
  });

  const [patients, setPatients] = useState([]);
  const [socialWorkHistory, setSocialWorkHistory] = useState([]);
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

  const navigate = useNavigate();

  // Fetch social work history for a patient
  const fetchSocialWorkHistory = async (patient_id) => {
    if (!patient_id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/v1/social-work/v1/patients/${patient_id}/socialwork`);
      setSocialWorkHistory(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch social work history");
      setSocialWorkHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Search patients
  const searchPatients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/v1/social-work/v1/patients`, {
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
    setSocialWorkData(prev => ({ ...prev, patient_id: patient.patient_id }));
    fetchSocialWorkHistory(patient.patient_id);
  };

  // Add new social work record
  const addSocialWorkRecord = async () => {
    if (!socialWorkData.patient_id) {
      setError("Please select a patient first");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/v1/social-work/v1/patients/${socialWorkData.patient_id}/socialwork`,
        socialWorkData
      );
      setMessage("Record added successfully");
      fetchSocialWorkHistory(socialWorkData.patient_id);
      // Reset form but keep patient_id
      setSocialWorkData(prev => ({
        patient_id: prev.patient_id,
        ...Object.fromEntries(SOCIAL_WORK_FIELDS.map(field => [field, '']))
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
        `/v1/social-work/v1/patients/${editRecord.patient_id}/socialwork/${editRecord.id}`,
        editRecord
      );
      setMessage("Record updated successfully");
      fetchSocialWorkHistory(editRecord.patient_id);
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
        `/v1/social-work/v1/patients/${selectedPatient.patient_id}/socialwork/${recordToDelete}`
      );
      setMessage("Record deleted successfully");
      fetchSocialWorkHistory(selectedPatient.patient_id);
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
        Social Work Records
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
          <SocialWorkHistory
            socialWorkHistory={socialWorkHistory}
            handleEditRecord={(record) => {
              setEditRecord(record);
              setEditDialogOpen(true);
            }}
            handleDeleteRecord={handleDeleteRecord}
            deleteLoading={deleteLoading}
          />

          <AddSocialWorkRecord
            socialWorkData={socialWorkData}
            setSocialWorkData={setSocialWorkData}
            addSocialWorkRecord={addSocialWorkRecord}
            loading={loading}
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
        >
          {error || message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SocialWork;