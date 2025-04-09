import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance'; // Import the configured axios instance
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

// Patient Search Component
function PatientSearch({ searchData, handleSearchChange, searchPatients, patients, error, handlePatientSelect }) {
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
      <Button variant="contained" color="primary" onClick={searchPatients} sx={{ marginTop: 2 }}>
        Search
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
                <Button variant="outlined" onClick={() => handlePatientSelect(patient)}>
                  View Mental Health History
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

// Mental Health History Component
function MentalHealthHistory({ mentalHealthHistory, handleEditRecord, handleDeleteRecord, deleteLoading }) {
  const [remarks, setRemarks] = useState({});
  const [newRemark, setNewRemark] = useState('');

  // Load remarks from local storage when the component mounts
  useEffect(() => {
    const loadedRemarks = {};
    mentalHealthHistory.forEach((record) => {
      const remarkKey = `remark_${record.mental_health_id}`;
      const savedRemark = localStorage.getItem(remarkKey);
      if (savedRemark) {
        loadedRemarks[record.mental_health_id] = savedRemark;
      }
    });
    setRemarks(loadedRemarks);
  }, [mentalHealthHistory]);

  // Handle remark input change
  const handleRemarkChange = (event) => {
    setNewRemark(event.target.value);
  };

  // Save remark to local storage and update state
  const handleSaveRemark = (recordId) => {
    if (newRemark.trim() === '') return; // Don't save empty remarks
    const remarkKey = `remark_${recordId}`;
    localStorage.setItem(remarkKey, newRemark);
    setRemarks((prevRemarks) => ({
      ...prevRemarks,
      [recordId]: newRemark,
    }));
    setNewRemark(''); // Clear the input field after saving
  };

  return (
    <Paper sx={{ marginTop: 3, padding: 3, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Mental Health History
      </Typography>

      {mentalHealthHistory.length > 0 ? (
        <List>
          {mentalHealthHistory.map((record, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start" sx={{ paddingBottom: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Patient ID: {record.patient_id}
                    </Typography>
                    <Divider sx={{ marginBottom: 2 }} />
                  </Grid>

                  {/* Existing fields */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Complaints:
                    </Typography>
                    <Typography variant="body2">{record?.present_complaints || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      History of Present Illness:
                    </Typography>
                    <Typography variant="body2">{record?.history_of_present_illness || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Past Psychiatric History:
                    </Typography>
                    <Typography variant="body2">{record?.past_psychiatric_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Past Medical History:
                    </Typography>
                    <Typography variant="body2">{record?.past_medical_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Drug History:
                    </Typography>
                    <Typography variant="body2">{record?.drug_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Family History:
                    </Typography>
                    <Typography variant="body2">{record?.family_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Prenatal History:
                    </Typography>
                    <Typography variant="body2">{record?.prenatal || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Delivery and Postnatal History:
                    </Typography>
                    <Typography variant="body2">{record?.delivery_and_postnatal || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Childhood History:
                    </Typography>
                    <Typography variant="body2">{record?.childhood_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Late Childhood and Adolescence:
                    </Typography>
                    <Typography variant="body2">{record?.late_childhood_and_adolescence || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Educational History:
                    </Typography>
                    <Typography variant="body2">{record?.educational_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Psychosexual History:
                    </Typography>
                    <Typography variant="body2">{record?.psychosexual_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Emotional and Physical Postures:
                    </Typography>
                    <Typography variant="body2">{record?.emotional_and_physical_postures || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Marital History:
                    </Typography>
                    <Typography variant="body2">{record?.marital_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Occupational History:
                    </Typography>
                    <Typography variant="body2">{record?.occupational_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Military Service:
                    </Typography>
                    <Typography variant="body2">{record?.military_service || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Forensic History:
                    </Typography>
                    <Typography variant="body2">{record?.forensic_history || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Premorbid Personality:
                    </Typography>
                    <Typography variant="body2">{record?.premorbid_personality || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Mental State Examination:
                    </Typography>
                    <Typography variant="body2">{record?.mental_state_examination || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Physical Examination:
                    </Typography>
                    <Typography variant="body2">{record?.physical_examination || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      PAN Score:
                    </Typography>
                    <Typography variant="body2">{record?.pan_score || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      BPRS Score:
                    </Typography>
                    <Typography variant="body2">{record?.bprs_score || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Zung Depression Score:
                    </Typography>
                    <Typography variant="body2">{record?.zung_depression_score || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Zung Anxiety Score:
                    </Typography>
                    <Typography variant="body2">{record?.zung_anxiety_score || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Diagnostic Formulation:
                    </Typography>
                    <Typography variant="body2">{record?.diagnostic_formulation || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Summary of Problems:
                    </Typography>
                    <Typography variant="body2">{record?.summary_of_problems || 'N/A'}</Typography>
                  </Grid>

                  {/* Remark Field */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Add Clinical Note"
                      variant="outlined"
                      value={newRemark}
                      onChange={handleRemarkChange}
                      sx={{ marginTop: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSaveRemark(record.mental_health_id)}
                      sx={{ marginTop: 2 }}
                    >
                      Save Remark
                    </Button>
                  </Grid>

                  {/* Display Saved Remark */}
                  {remarks[record.mental_health_id] && (
                    <Grid item xs={12}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', marginTop: 2 }}>
                        Saved Remark:
                      </Typography>
                      <Typography variant="body2">{remarks[record.mental_health_id]}</Typography>
                    </Grid>
                  )}

                  {/* Action buttons */}
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
                      onClick={() => handleDeleteRecord(record.mental_health_id)}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? <CircularProgress size={24} color="inherit" /> : <DeleteIcon />}
                    </IconButton>
                  </Grid>
                </Grid>
              </ListItem>
              <Divider sx={{ marginBottom: 2 }} />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" align="center">
          No records available.
        </Typography>
      )}
    </Paper>
  );
}



// Add Mental Health Record Component
function AddMentalHealthRecord({ mentalHealthData, setMentalHealthData, addMentalHealthRecord }) {
  const multiLineFields = [
    'present_complaints', 'history_of_present_illness', 'past_psychiatric_history',
    'past_medical_history', 'drug_history', 'family_history', 'prenatal',
    'delivery_and_postnatal', 'childhood_history', 'late_childhood_and_adolescence',
    'educational_history', 'psychosexual_history', 'emotional_and_physical_postures',
    'marital_history', 'occupational_history', 'military_service', 'forensic_history',
    'premorbid_personality', 'mental_state_examination', 'physical_examination',
    'diagnostic_formulation', 'summary_of_problems',
  ];

  return (
    <Paper sx={{ marginTop: 3, padding: 2 }}>
      <Typography variant="h5">Add Mental Health Record</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={mentalHealthData.patient_id}
            onChange={(e) => setMentalHealthData({ ...mentalHealthData, patient_id: e.target.value })}
            disabled
            sx={{ marginBottom: 2 }}
          />
        </Grid>
        {[
          'present_complaints', 'history_of_present_illness', 'past_psychiatric_history',
          'past_medical_history', 'drug_history', 'family_history', 'prenatal',
          'delivery_and_postnatal', 'childhood_history', 'late_childhood_and_adolescence',
          'educational_history', 'psychosexual_history', 'emotional_and_physical_postures',
          'marital_history', 'occupational_history', 'military_service', 'forensic_history',
          'premorbid_personality', 'mental_state_examination', 'physical_examination',
          'pan_score', 'bprs_score', 'zung_depression_score', 'zung_anxiety_score',
          'diagnostic_formulation', 'summary_of_problems',
        ].map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={field.replace(/_/g, ' ').toUpperCase()}
              name={field}
              value={mentalHealthData[field]}
              onChange={(e) => setMentalHealthData({ ...mentalHealthData, [field]: e.target.value })}
              multiline={multiLineFields.includes(field)}
              rows={multiLineFields.includes(field) ? 4 : 1}
            />
          </Grid>
        ))}
      </Grid>
      <Button variant="contained" color="primary" onClick={addMentalHealthRecord} sx={{ marginTop: 2 }}>
        Add Record
      </Button>
    </Paper>
  );
}

// Edit Dialog for Editing Mental Health Record
function EditDialog({ open, onClose, record, setEditRecord, handleUpdateRecord }) {
  const multiLineFields = [
    'present_complaints', 'history_of_present_illness', 'past_psychiatric_history',
    'past_medical_history', 'drug_history', 'family_history', 'prenatal',
    'delivery_and_postnatal', 'childhood_history', 'late_childhood_and_adolescence',
    'educational_history', 'psychosexual_history', 'emotional_and_physical_postures',
    'marital_history', 'occupational_history', 'military_service', 'forensic_history',
    'premorbid_personality', 'mental_state_examination', 'physical_examination',
    'diagnostic_formulation', 'summary_of_problems',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditRecord({ ...record, [name]: value });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Mental Health Record</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {[
            'present_complaints', 'history_of_present_illness', 'past_psychiatric_history',
            'past_medical_history', 'drug_history', 'family_history', 'prenatal',
            'delivery_and_postnatal', 'childhood_history', 'late_childhood_and_adolescence',
            'educational_history', 'psychosexual_history', 'emotional_and_physical_postures',
            'marital_history', 'occupational_history', 'military_service', 'forensic_history',
            'premorbid_personality', 'mental_state_examination', 'physical_examination',
            'pan_score', 'bprs_score', 'zung_depression_score', 'zung_anxiety_score',
            'diagnostic_formulation', 'summary_of_problems',
          ].map((field) => (
            <Grid item xs={12} sm={6} key={field}>
              <TextField
                fullWidth
                label={field.replace(/_/g, ' ').toUpperCase()}
                name={field}
                value={record?.[field] || ''}
                onChange={handleChange}
                multiline={multiLineFields.includes(field)}
                rows={multiLineFields.includes(field) ? 4 : 1}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleUpdateRecord} color="primary">Update</Button>
      </DialogActions>
    </Dialog>
  );
}

// Main MentalHealth Component
function MentalHealth() {
  const [mentalHealthData, setMentalHealthData] = useState({
    patient_id: '',
    present_complaints: '',
    history_of_present_illness: '',
    past_psychiatric_history: '',
    past_medical_history: '',
    drug_history: '',
    family_history: '',
    prenatal: '',
    delivery_and_postnatal: '',
    childhood_history: '',
    late_childhood_and_adolescence: '',
    educational_history: '',
    psychosexual_history: '',
    emotional_and_physical_postures: '',
    marital_history: '',
    occupational_history: '',
    military_service: '',
    forensic_history: '',
    premorbid_personality: '',
    mental_state_examination: '',
    physical_examination: '',
    pan_score: '',
    bprs_score: '',
    zung_depression_score: '',
    zung_anxiety_score: '',
    diagnostic_formulation: '',
    summary_of_problems: 'Summary and Prescription',
  });

  const [searchData, setSearchData] = useState({
    patient_id: '',
    surname: '',
    other_names: '',
    hospital_reg_number: '',
  });

  const [patients, setPatients] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [mentalHealthHistory, setMentalHealthHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  const fetchMentalHealthHistory = async (patient_id) => {
    if (mentalHealthHistory.length > 0 && selectedPatient?.patient_id === patient_id) return;

    setLoading(true);
    try {
      const response = await axios.get(`/v1/mental-health/v1/patients/${patient_id}/mentalhealth`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setMentalHealthHistory(response.data);
        setError(null);
      } else {
        setMentalHealthHistory([]);
        setError("No mental health records found.");
      }
    } catch (err) {
      setError("Error fetching mental health records.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const searchPatients = async () => {
    const { patient_id, surname, other_names, hospital_reg_number } = searchData;
    try {
      const response = await axios.get(`/v1/mental-health/v1/patients/`, {
        params: { patient_id, surname, other_names, hospital_reg_number },
      });

      if (response.data.patients) {
        setPatients(response.data.patients);
        setError(null);
      } else {
        setPatients([]);
        setError("No patients found.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error searching for patients.");
      setPatients([]);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setMentalHealthData({ ...mentalHealthData, patient_id: patient.patient_id });
    fetchMentalHealthHistory(patient.patient_id);
  };

  const addMentalHealthRecord = async () => {
    try {
      const response = await axios.post(
        `/v1/mental-health/v1/patients/${mentalHealthData.patient_id}/mentalhealth`,
        mentalHealthData
      );

      if (response.status === 200) {
        setMessage("Mental health record added successfully!");
        setError(null);
        setMentalHealthData({
          patient_id: '',
          present_complaints: '',
          history_of_present_illness: '',
          past_psychiatric_history: '',
          past_medical_history: '',
          drug_history: '',
          family_history: '',
          prenatal: '',
          delivery_and_postnatal: '',
          childhood_history: '',
          late_childhood_and_adolescence: '',
          educational_history: '',
          psychosexual_history: '',
          emotional_and_physical_postures: '',
          marital_history: '',
          occupational_history: '',
          military_service: '',
          forensic_history: '',
          premorbid_personality: '',
          mental_state_examination: '',
          physical_examination: '',
          pan_score: '',
          bprs_score: '',
          zung_depression_score: '',
          zung_anxiety_score: '',
          diagnostic_formulation: '',
          summary_of_problems: '',
        });

        fetchMentalHealthHistory(mentalHealthData.patient_id); // Refresh the history
      } else {
        setError(response.data.detail || "Error adding mental health record.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error adding mental health record.");
    }
  };

  const handleDeleteRecord = async (recordId) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`/v1/mental-health/v1/patients/${selectedPatient.patient_id}/mentalhealth/${recordId}`);
      setMentalHealthHistory(mentalHealthHistory.filter((record) => record.mental_health_id !== recordId));
      setMessage('Record deleted successfully.');
    } catch (err) {
      setError('Error deleting record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditRecord = (record) => {
    if (record) {
      setEditRecord(record);
      setEditDialogOpen(true);
    } else {
      setError("Record not found.");
    }
  };

  const updateRecord = async () => {
    try {
      const response = await axios.put(
        `/v1/mental-health/v1/patients/${editRecord.patient_id}/mentalhealth/${editRecord.mental_health_id}`,
        editRecord
      );

      if (response.status === 200) {
        setMessage("Record updated successfully!");
        setError(null);
        fetchMentalHealthHistory(editRecord.patient_id); // Refresh the history
        setEditDialogOpen(false);
      } else {
        setError(response.data.detail || "Error updating mental health record.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error updating mental health record.");
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" align="center" gutterBottom>
        Mental Health Records
      </Typography>

      <PatientSearch
        searchData={searchData}
        handleSearchChange={handleSearchChange}
        searchPatients={searchPatients}
        patients={patients}
        error={error}
        handlePatientSelect={handlePatientSelect}
      />

      {loading ? (
        <CircularProgress sx={{ marginTop: 2 }} />
      ) : (
        <MentalHealthHistory
          mentalHealthHistory={mentalHealthHistory}
          handleEditRecord={handleEditRecord}
          handleDeleteRecord={handleDeleteRecord}
          deleteLoading={deleteLoading}
        />
      )}

      <AddMentalHealthRecord
        mentalHealthData={mentalHealthData}
        setMentalHealthData={setMentalHealthData}
        addMentalHealthRecord={addMentalHealthRecord}
      />

      {/* Edit Dialog */}
      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        record={editRecord}
        setEditRecord={setEditRecord}
        handleUpdateRecord={updateRecord}
      />

      <Snackbar
        open={message !== ''}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
      >
        <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>
      </Snackbar>

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </Container>
  );
}

export default MentalHealth;
