import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Paper, List, ListItem, Button, Snackbar, Alert, Box, Card, CardContent, Grid, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { jsPDF } from "jspdf";  // Import jsPDF for PDF generation

function ClinicalHistory({ patient_id }) {
  const [clinicalHistory, setClinicalHistory] = useState([]);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editRecord, setEditRecord] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);

  useEffect(() => {
    const fetchClinicalHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/v1/clinical/v1/patients/${patient_id}/clinical`);
        console.log("Backend Response:", response.data); // Log the response to inspect the structure

        if (Array.isArray(response.data) && response.data.length > 0) {
          setClinicalHistory(response.data); // Set data directly as an array
          setFilteredHistory(response.data);  // Set filtered data initially to the same as full data
          setError(null);
        } else {
          setClinicalHistory([]);
          setFilteredHistory([]);
          setError("No clinical records found.");
        }
      } catch (err) {
        setError("Error fetching clinical records.");
      }
    };

    if (patient_id) {
      fetchClinicalHistory();
    }
  }, [patient_id]);

  const handleExpandClick = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const handleEditClick = (record) => {
    setEditRecord(record);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditRecord(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(`http://localhost:8000/v1/clinical/v1/patients/${patient_id}/clinical/${editRecord.id}`, editRecord);
      if (response.status === 200) {
        setMessage("Clinical record updated successfully!");
        setClinicalHistory((prev) =>
          prev.map((record) => (record.id === editRecord.id ? editRecord : record))
        );
        setFilteredHistory((prev) =>
          prev.map((record) => (record.id === editRecord.id ? editRecord : record))
        );
        handleCloseEditDialog();
      } else {
        setError(response.data.detail || "Error updating clinical record.");
      }
    } catch (err) {
      setError("Error updating clinical record.");
    }
  };

  const handleDelete = async (recordId) => {
    try {
      await axios.delete(`http://localhost:8000/v1/clinical/v1/patients/${patient_id}/clinical/${recordId}`);
      setMessage("Clinical record deleted successfully!");
      setClinicalHistory((prev) => prev.filter((record) => record.id !== recordId));
      setFilteredHistory((prev) => prev.filter((record) => record.id !== recordId));
    } catch (err) {
      setError("Error deleting clinical record.");
    }
  };

  // Handle filtering by date range
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') setStartDate(value);
    if (name === 'endDate') setEndDate(value);
  };

  const filterRecordsByDate = (records) => {
    if (!startDate && !endDate) return records;
    return records.filter((record) => {
      const recordDate = new Date(record.created_at);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || recordDate >= start) && (!end || recordDate <= end);
    });
  };

  // Handle the filter button click
  const handleFilterClick = () => {
    const filtered = filterRecordsByDate(clinicalHistory);
    setFilteredHistory(filtered);
  };

  // Export clinical records to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Clinical History Report for Patient ID: ${patient_id}`, 20, 20);

    let yOffset = 30;
    filteredHistory.forEach((record) => {
      doc.setFontSize(12);
      doc.text(`Date of Record: ${record.created_at || 'N/A'}`, 20, yOffset);
      doc.text(`Temperature: ${record.temperature || 'N/A'}`, 20, yOffset + 10);
      doc.text(`Blood Pressure: ${record.blood_pressure || 'N/A'}`, 20, yOffset + 20);
      doc.text(`Pulse Rate: ${record.pulse_rate || 'N/A'}`, 20, yOffset + 30);
      doc.text(`Respiratory Rate: ${record.respiratory_rate || 'N/A'}`, 20, yOffset + 40);
      yOffset += 50; // Increase offset for next record
    });

    doc.save('clinical_history_report.pdf');
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" gutterBottom>
        Clinical History for Patient ID: {patient_id}
      </Typography>

      {/* Date Range Filter */}
      <Box sx={{ marginBottom: 2 }}>
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <TextField
            type="date"
            label="Start Date"
            name="startDate"
            value={startDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
        </FormControl>
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <TextField
            type="date"
            label="End Date"
            name="endDate"
            value={endDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
        </FormControl>
        <Button variant="contained" onClick={handleFilterClick}>
          Filter by Date
        </Button>
      </Box>

      {/* Display clinical history */}
      <Paper sx={{ padding: 3 }}>
        <Typography variant="h6" gutterBottom>
          Clinical Records:
        </Typography>

        {filteredHistory.length > 0 ? (
          <List>
            {filteredHistory.map((record) => (
              <ListItem key={record.id} sx={{ marginBottom: 2 }}>
                <Card variant="outlined" sx={{ width: '100%' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Date of Record: {record.created_at || 'N/A'}</Typography>
                        <Typography variant="body2">Temperature: {record.temperature || 'N/A'}</Typography>
                        <Typography variant="body2">Blood Pressure: {record.blood_pressure || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">Pulse Rate: {record.pulse_rate || 'N/A'}</Typography>
                        <Typography variant="body2">Respiratory Rate: {record.respiratory_rate || 'N/A'}</Typography>
                        <Typography variant="body2">Psychological Concerns: {record.present_psychological_concerns || 'N/A'}</Typography>
                      </Grid>
                    </Grid>

                    {/* Expandable section for more details */}
                    <Button onClick={() => handleExpandClick(record.id)} variant="outlined" sx={{ marginTop: 2 }}>
                      {expandedRecord === record.id ? 'Hide Details' : 'Show Details'}
                    </Button>

                    <Collapse in={expandedRecord === record.id} timeout="auto" unmountOnExit>
                      <Box sx={{ marginTop: 2 }}>
                        <Typography variant="body1">History of Mental Illness: {record.history_of_mental_illness || 'N/A'}</Typography>
                        <Typography variant="body1">Risk Assessment (Suicide/Self-Harm): {record.risk_assessment_suicide_self_harm || 'N/A'}</Typography>
                        <Typography variant="body1">Tests Administered: {record.tests_administered || 'N/A'}</Typography>
                        <Typography variant="body1">Scores & Interpretation: {record.scores_and_interpretation || 'N/A'}</Typography>
                        <Typography variant="body1">Type of Therapy: {record.type_of_therapy || 'N/A'}</Typography>
                        <Typography variant="body1">Interventions During Acute Episodes: {record.interventions_during_acute_episodes || 'N/A'}</Typography>
                        <Typography variant="body1">Special Features of the Case: {record.special_features_of_the_case || 'N/A'}</Typography>
                      </Box>
                    </Collapse>
                  </CardContent>

                  {/* Action buttons */}
                  <Box sx={{ padding: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      sx={{ marginRight: 1 }}
                      onClick={() => handleDelete(record.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{ marginRight: 1 }}
                      onClick={() => handleEditClick(record)}
                    >
                      Edit
                    </Button>
                  </Box>
                </Card>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">No clinical records found for this patient.</Typography>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Clinical Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Temperature"
                name="temperature"
                value={editRecord?.temperature || ''}
                onChange={handleEditChange}
                sx={{ marginBottom: 2 }}
              />
              <TextField
                fullWidth
                label="Blood Pressure"
                name="blood_pressure"
                value={editRecord?.blood_pressure || ''}
                onChange={handleEditChange}
                sx={{ marginBottom: 2 }}
              />
              <TextField
                fullWidth
                label="Pulse Rate"
                name="pulse_rate"
                value={editRecord?.pulse_rate || ''}
                onChange={handleEditChange}
                sx={{ marginBottom: 2 }}
              />
              <TextField
                fullWidth
                label="Respiratory Rate"
                name="respiratory_rate"
                value={editRecord?.respiratory_rate || ''}
                onChange={handleEditChange}
                sx={{ marginBottom: 2 }}
              />
              <TextField
                fullWidth
                label="Psychological Concerns"
                name="present_psychological_concerns"
                value={editRecord?.present_psychological_concerns || ''}
                onChange={handleEditChange}
                sx={{ marginBottom: 2 }}
              />
              <TextField
                fullWidth
                label="History of Mental Illness"
                name="history_of_mental_illness"
                value={editRecord?.history_of_mental_illness || ''}
                onChange={handleEditChange}
                sx={{ marginBottom: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveEdit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message/Error Display */}
      {message && (
        <Snackbar open={true} autoHideDuration={6000} onClose={() => setMessage('')}>
          <Alert onClose={() => setMessage('')} severity="success" sx={{ width: '100%' }}>
            {message}
          </Alert>
        </Snackbar>
      )}
      {error && (
        <Snackbar open={true} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {/* Export Button */}
      <Button variant="contained" sx={{ marginTop: 3 }} onClick={exportToPDF}>
        Export to PDF
      </Button>
    </Container>
  );
}

export default ClinicalHistory;
