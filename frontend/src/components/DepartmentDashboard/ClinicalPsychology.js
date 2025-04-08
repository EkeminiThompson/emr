import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  TextField, Button, Container, Typography, Grid, Paper, Alert,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Box, Divider, Chip, Snackbar
} from '@mui/material';
import { 
  Delete, Edit, Search, Add, Psychology, MedicalServices, 
  MonitorHeart, Notes, Person 
} from '@mui/icons-material';

const ClinicalPsychology = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patient_id: '',
    // Vitals
    temperature: '', blood_pressure: '', pulse_rate: '', respiratory_rate: '',
    // Psychological
    present_psychological_concerns: '', history_of_mental_illness: '', risk_assessment_suicide_self_harm: '',
    // Therapy
    tests_administered: '', scores_and_interpretation: '', type_of_therapy: '', 
    progress_notes: '', interventions_during_acute_episodes: '',
    // Referral
    source_of_referral: '', reasons_for_referral: '', special_features_of_the_case: ''
  });

  const [search, setSearch] = useState({ patient_id: '', surname: '', other_names: '', hospital_reg_number: '' });
  const [state, setState] = useState({
    patients: [], clinicalHistory: [], selectedPatient: null,
    loading: false, error: null, message: '',
    editDialogOpen: false, editRecord: null, submitting: false
  });

  const fetchClinicalHistory = useCallback(async (patientId) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.get(`/v1/clinical/${patientId}/clinical`);
      setState(prev => ({ ...prev, clinicalHistory: res.data || [], loading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "Error fetching records", loading: false }));
    }
  }, []);

  const searchPatients = useCallback(async (params) => {
    try {
      const res = await axios.get('/v1/clinical/', { params });
      setState(prev => ({ ...prev, patients: res.data.patients || [] }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "Search failed", patients: [] }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState(prev => ({ ...prev, submitting: true }));
    try {
      await axios.post(`/v1/clinical/${formData.patient_id}/clinical`, formData);
      setState(prev => ({ ...prev, message: "Record added!", submitting: false }));
      fetchClinicalHistory(formData.patient_id);
      setFormData(prev => ({ ...prev, ...Object.fromEntries(
        Object.keys(prev).filter(k => k !== 'patient_id').map(k => [k, ''])
      )}));
    } catch (err) {
      setState(prev => ({ ...prev, error: "Submission failed", submitting: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await axios.delete(`/v1/clinical/${state.selectedPatient.patient_id}/clinical/${id}`);
      setState(prev => ({
        ...prev,
        clinicalHistory: prev.clinicalHistory.filter(r => r.id !== id),
        message: "Record deleted"
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "Deletion failed" }));
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(
        `/v1/clinical/${state.editRecord.patient_id}/clinical/${state.editRecord.id}`,
        state.editRecord
      );
      setState(prev => ({
        ...prev,
        message: "Record updated",
        editDialogOpen: false
      }));
      fetchClinicalHistory(state.editRecord.patient_id);
    } catch (err) {
      setState(prev => ({ ...prev, error: "Update failed" }));
    }
  };

  const fieldGroups = [
    {
      title: "Vitals", icon: <MonitorHeart />,
      fields: [
        { name: 'temperature', label: 'Temperature (°C)' },
        { name: 'blood_pressure', label: 'Blood Pressure (mmHg)' },
        { name: 'pulse_rate', label: 'Pulse Rate (bpm)' },
        { name: 'respiratory_rate', label: 'Respiratory Rate' }
      ]
    },
    {
      title: "Psychological", icon: <Psychology />,
      fields: [
        { name: 'present_psychological_concerns', label: 'Concerns', multiline: true },
        { name: 'history_of_mental_illness', label: 'Mental Illness History', multiline: true },
        { name: 'risk_assessment_suicide_self_harm', label: 'Risk Assessment', multiline: true }
      ]
    },
    {
      title: "Therapy", icon: <MedicalServices />,
      fields: [
        { name: 'tests_administered', label: 'Tests Administered' },
        { name: 'scores_and_interpretation', label: 'Scores', multiline: true },
        { name: 'type_of_therapy', label: 'Therapy Type' },
        { name: 'progress_notes', label: 'Progress Notes', multiline: true }
      ]
    },
    {
      title: "Referral", icon: <Person />,
      fields: [
        { name: 'source_of_referral', label: 'Referral Source' },
        { name: 'reasons_for_referral', label: 'Referral Reasons', multiline: true },
        { name: 'special_features_of_the_case', label: 'Special Features', multiline: true }
      ]
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Psychology sx={{ mr: 1 }} /> Clinical Psychology
      </Typography>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Search sx={{ mr: 1, verticalAlign: 'middle' }} /> Search Patients
        </Typography>
        <Grid container spacing={2}>
          {['patient_id', 'surname', 'other_names', 'hospital_reg_number'].map(field => (
            <Grid item xs={12} sm={6} md={3} key={field}>
              <TextField
                fullWidth
                label={field.replace('_', ' ')}
                name={field}
                value={search[field]}
                onChange={(e) => setSearch(prev => ({ ...prev, [field]: e.target.value }))}
                onBlur={() => searchPatients(search)}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Search Results */}
      {state.patients.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Search Results</Typography>
          <Grid container spacing={2}>
            {state.patients.map(patient => (
              <Grid item xs={12} sm={6} key={patient.patient_id}>
                <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => {
                  setState(prev => ({ ...prev, selectedPatient: patient }));
                  setFormData(prev => ({ ...prev, patient_id: patient.patient_id }));
                  fetchClinicalHistory(patient.patient_id);
                }}>
                  <Typography>{patient.surname}, {patient.other_names}</Typography>
                  <Typography variant="body2">ID: {patient.patient_id}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Clinical History */}
      {state.selectedPatient && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Records for {state.selectedPatient.surname}, {state.selectedPatient.other_names}
          </Typography>
          
          {state.loading ? <CircularProgress /> : 
           state.clinicalHistory.length === 0 ? <Alert severity="info">No records found</Alert> :
           <Grid container spacing={2}>
            {state.clinicalHistory.map(record => (
              <Grid item xs={12} key={record.id}>
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between">
                    <div>
                      {fieldGroups.map(group => (
                        group.fields.some(f => record[f.name]) && (
                          <Box key={group.title} mb={2}>
                            <Typography variant="subtitle2">{group.title}</Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              {group.fields.map(f => record[f.name] && (
                                <Chip 
                                  key={f.name}
                                  label={`${f.label}: ${record[f.name]}`}
                                  size="small"
                                />
                              ))}
                            </Box>
                          </Box>
                        )
                      ))}
                    </div>
                    <div>
                      <Button startIcon={<Edit />} onClick={() => 
                        setState(prev => ({ ...prev, editRecord: record, editDialogOpen: true }))
                      }>
                        Edit
                      </Button>
                      <Button 
                        startIcon={<Delete />} 
                        color="error"
                        onClick={() => handleDelete(record.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>}
        </Paper>
      )}

      {/* Add New Record Form */}
      {state.selectedPatient && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Clinical Record
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {fieldGroups.map(group => (
                <React.Fragment key={group.title}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      {group.icon} {group.title}
                    </Typography>
                    <Divider />
                  </Grid>
                  {group.fields.map(field => (
                    <Grid item xs={12} sm={field.multiline ? 12 : 6} key={field.name}>
                      <TextField
                        fullWidth
                        label={field.label}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                        multiline={field.multiline}
                        rows={field.multiline ? 3 : 1}
                      />
                    </Grid>
                  ))}
                </React.Fragment>
              ))}
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={state.submitting}
                  startIcon={state.submitting ? <CircularProgress size={20} /> : <Add />}
                >
                  {state.submitting ? 'Submitting...' : 'Add Record'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={state.editDialogOpen} onClose={() => setState(prev => ({ ...prev, editDialogOpen: false }))}>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {fieldGroups.map(group => (
              <React.Fragment key={group.title}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">{group.title}</Typography>
                  <Divider />
                </Grid>
                {group.fields.map(field => (
                  <Grid item xs={12} sm={field.multiline ? 12 : 6} key={field.name}>
                    <TextField
                      fullWidth
                      label={field.label}
                      name={field.name}
                      value={state.editRecord?.[field.name] || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        editRecord: { ...prev.editRecord, [field.name]: e.target.value }
                      }))}
                      multiline={field.multiline}
                      rows={field.multiline ? 3 : 1}
                    />
                  </Grid>
                ))}
              </React.Fragment>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setState(prev => ({ ...prev, editDialogOpen: false }))}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!state.message || !!state.error}
        autoHideDuration={6000}
        onClose={() => setState(prev => ({ ...prev, message: '', error: null }))}
      >
        <Alert severity={state.error ? 'error' : 'success'}>
          {state.error || state.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClinicalPsychology;