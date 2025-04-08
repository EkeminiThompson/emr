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
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { useReactToPrint } from 'react-to-print';

// Constants
const LABORATORY_FIELDS = [
  'tests_requested_by_physicians',
  'urgency',
  'test_results',
  'reference_ranges',
  'pathologist_comments',
  'specimen_type',
  'date_time_of_collection',
  'chain_of_custody'
];
const URGENCY_OPTIONS = ['Routine', 'Urgent', 'STAT'];

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

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setEditRecord(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Laboratory Record</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {LABORATORY_FIELDS.map(field => (
            <Grid item xs={12} sm={6} key={field}>
              {field === 'urgency' ? (
                <FormControl fullWidth>
                  <InputLabel>Urgency</InputLabel>
                  <Select
                    label="Urgency"
                    name={field}
                    value={record?.[field] || ''}
                    onChange={handleSelectChange}
                    disabled={loading}
                  >
                    {URGENCY_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label={field.replace(/_/g, ' ')}
                  name={field}
                  value={record?.[field] || ''}
                  onChange={handleChange}
                  disabled={loading}
                  multiline={['test_results', 'pathologist_comments'].includes(field)}
                  rows={['test_results', 'pathologist_comments'].includes(field) ? 4 : 1}
                />
              )}
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
                  View Laboratory Records
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

// Laboratory Records Component
function LaboratoryRecords({ 
  records, 
  handleEditRecord, 
  handleDeleteRecord, 
  deleteLoading, 
  printRef,
  selectedPatient,
  downloadLoading,
  handleDownloadRecord
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
        <Typography variant="h5" gutterBottom>Laboratory Records</Typography>
        <Box>
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
      </Box>
      
      {records.length > 0 ? (
        <List>
          {records.map((record, index) => (
            <React.Fragment key={record.id}>
              <ListItem>
                <Grid container spacing={2}>
                  {LABORATORY_FIELDS.map(field => (
                    <Grid item xs={12} sm={6} key={field}>
                      <Typography variant="body1">
                        <strong>{field.replace(/_/g, ' ')}:</strong> {record[field] || 'N/A'}
                      </Typography>
                    </Grid>
                  ))}
                  <Grid item xs={12} container justifyContent="flex-end">
                    <Tooltip title="Download PDF">
                      <IconButton
                        color="primary"
                        onClick={() => handleDownloadRecord(record.id, 'pdf')}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? <CircularProgress size={24} /> : <DownloadIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Record">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditRecord(record)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Record">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? <CircularProgress size={24} /> : <DeleteIcon />}
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </ListItem>
              {index < records.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          No laboratory records found
        </Typography>
      )}
    </Paper>
  );
}

// Add Laboratory Record Component
function AddLaboratoryRecord({ 
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
      <Typography variant="h5" gutterBottom>Add Laboratory Record</Typography>
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
        {LABORATORY_FIELDS.map(field => (
          <Grid item xs={12} sm={6} key={field}>
            {field === 'urgency' ? (
              <FormControl fullWidth>
                <InputLabel>Urgency</InputLabel>
                <Select
                  label="Urgency"
                  name={field}
                  value={data[field] || ''}
                  onChange={handleChange}
                  disabled={loading || !selectedPatient}
                >
                  {URGENCY_OPTIONS.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                label={field.replace(/_/g, ' ')}
                name={field}
                value={data[field]}
                onChange={handleChange}
                disabled={loading || !selectedPatient}
                multiline={['test_results', 'pathologist_comments'].includes(field)}
                rows={['test_results', 'pathologist_comments'].includes(field) ? 4 : 1}
              />
            )}
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

// Main Laboratory Component
function Laboratory() {
  const [laboratoryData, setLaboratoryData] = useState({
    patient_id: '',
    ...Object.fromEntries(LABORATORY_FIELDS.map(field => [
      field, 
      field === 'urgency' ? 'Routine' : ''
    ]))
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
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  
  // Dialog States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Print Ref
  const printRef = useRef();
  const navigate = useNavigate();

  // Fetch laboratory records for a patient
  const fetchRecords = async (patient_id) => {
    if (!patient_id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/v1/laboratory/${patient_id}/laboratory`);
      setRecords(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch laboratory records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Search patients
  const searchPatients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/v1/laboratory/`, {
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
    setLaboratoryData(prev => ({ 
      ...prev, 
      patient_id: patient.patient_id 
    }));
    fetchRecords(patient.patient_id);
  };

  // Add new laboratory record
  const addRecord = async () => {
    if (!laboratoryData.patient_id) {
      setError("Please select a patient first");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/v1/laboratory/${laboratoryData.patient_id}/laboratory`,
        laboratoryData
      );
      setMessage("Record added successfully");
      fetchRecords(laboratoryData.patient_id);
      // Reset form but keep patient_id and default urgency
      setLaboratoryData(prev => ({
        patient_id: prev.patient_id,
        ...Object.fromEntries(LABORATORY_FIELDS.map(field => [
          field, 
          field === 'urgency' ? 'Routine' : ''
        ]))
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
        `/v1/laboratory/${editRecord.patient_id}/laboratory/${editRecord.id}`,
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
        `/v1/laboratory/${selectedPatient.patient_id}/laboratory/${recordToDelete}`
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

  // Download laboratory record
  const handleDownloadRecord = async (recordId, format = 'pdf') => {
    if (!recordId || !selectedPatient) return;

    setDownloadLoading(true);
    try {
      // First get the record to ensure it exists
      const record = records.find(r => r.id === recordId);
      if (!record) {
        throw new Error("Record not found");
      }

      // Trigger download
      const response = await axios.get(
        `/v1/laboratory/${selectedPatient.patient_id}/laboratory/${recordId}/download`,
        {
          responseType: 'blob', // Important for file downloads
          params: { format }
        }
      );

      // Create a download link and trigger click
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header or create one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `lab_result_${selectedPatient.surname}_${recordId}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setMessage(`Download started successfully (${format.toUpperCase()})`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download record");
    } finally {
      setDownloadLoading(false);
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
        Laboratory Management
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
          <LaboratoryRecords
            records={records}
            handleEditRecord={(record) => {
              setEditRecord(record);
              setEditDialogOpen(true);
            }}
            handleDeleteRecord={handleDeleteRecord}
            deleteLoading={deleteLoading}
            printRef={printRef}
            selectedPatient={selectedPatient}
            downloadLoading={downloadLoading}
            handleDownloadRecord={handleDownloadRecord}
          />

          <AddLaboratoryRecord
            data={laboratoryData}
            setData={setLaboratoryData}
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

export default Laboratory;