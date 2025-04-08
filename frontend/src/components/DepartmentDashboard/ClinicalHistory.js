import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosInstance';
import { 
  Container, Typography, Paper, List, ListItem, Button, 
  Snackbar, Alert, Box, Card, CardContent, Grid, 
  Collapse, Dialog, DialogActions, DialogContent, 
  DialogTitle, TextField, FormControl
} from '@mui/material';
import { jsPDF } from "jspdf";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClinicalHistory = async () => {
      if (!patient_id) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/v1/clinical/v1/patients/${patient_id}/clinical`);
        
        if (Array.isArray(response.data)) {
          setClinicalHistory(response.data);
          setFilteredHistory(response.data);
          setError(null);
        } else {
          setClinicalHistory([]);
          setFilteredHistory([]);
          setError("No clinical records found.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching clinical records");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicalHistory();
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
    setEditRecord(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(
        `/v1/clinical/v1/patients/${patient_id}/clinical/${editRecord.id}`, 
        editRecord
      );
      
      setMessage("Clinical record updated successfully!");
      setClinicalHistory(prev => prev.map(record => 
        record.id === editRecord.id ? editRecord : record
      ));
      setFilteredHistory(prev => prev.map(record => 
        record.id === editRecord.id ? editRecord : record
      ));
      handleCloseEditDialog();
    } catch (err) {
      setError(err.response?.data?.message || "Error updating clinical record");
      console.error("Update Error:", err);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      await axios.delete(`/v1/clinical/v1/patients/${patient_id}/clinical/${recordId}`);
      setMessage("Clinical record deleted successfully!");
      setClinicalHistory(prev => prev.filter(record => record.id !== recordId));
      setFilteredHistory(prev => prev.filter(record => record.id !== recordId));
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting clinical record");
      console.error("Delete Error:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') setStartDate(value);
    if (name === 'endDate') setEndDate(value);
  };

  const filterRecordsByDate = () => {
    if (!startDate && !endDate) return clinicalHistory;
    
    return clinicalHistory.filter(record => {
      const recordDate = new Date(record.created_at);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      return (!start || recordDate >= start) && (!end || recordDate <= end);
    });
  };

  const handleFilterClick = () => {
    const filtered = filterRecordsByDate();
    setFilteredHistory(filtered);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Clinical History Report for Patient ID: ${patient_id}`, 20, 20);

    let yOffset = 30;
    filteredHistory.forEach(record => {
      doc.setFontSize(12);
      doc.text(`Date: ${record.created_at || 'N/A'}`, 20, yOffset);
      doc.text(`Temp: ${record.temperature || 'N/A'}`, 20, yOffset + 10);
      doc.text(`BP: ${record.blood_pressure || 'N/A'}`, 20, yOffset + 20);
      doc.text(`Pulse: ${record.pulse_rate || 'N/A'}`, 20, yOffset + 30);
      doc.text(`Resp Rate: ${record.respiratory_rate || 'N/A'}`, 20, yOffset + 40);
      yOffset += 50;
    });

    doc.save(`clinical_history_${patient_id}.pdf`);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" gutterBottom>
        Clinical History for Patient ID: {patient_id}
      </Typography>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Date Range Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          type="date"
          label="Start Date"
          name="startDate"
          value={startDate}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          type="date"
          label="End Date"
          name="endDate"
          value={endDate}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <Button 
          variant="contained" 
          onClick={handleFilterClick}
          disabled={loading}
        >
          Filter
        </Button>
      </Box>

      {/* Clinical Records */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Clinical Records ({filteredHistory.length})
        </Typography>

        {filteredHistory.length > 0 ? (
          <List>
            {filteredHistory.map(record => (
              <ListItem key={record.id} sx={{ mb: 2 }}>
                <Card variant="outlined" sx={{ width: '100%' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6">
                          Date: {record.created_at || 'N/A'}
                        </Typography>
                        <Typography>Temp: {record.temperature || 'N/A'}</Typography>
                        <Typography>BP: {record.blood_pressure || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography>Pulse: {record.pulse_rate || 'N/A'}</Typography>
                        <Typography>Resp Rate: {record.respiratory_rate || 'N/A'}</Typography>
                        <Typography>Psych Concerns: {record.present_psychological_concerns || 'N/A'}</Typography>
                      </Grid>
                    </Grid>

                    <Button 
                      onClick={() => handleExpandClick(record.id)} 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                    >
                      {expandedRecord === record.id ? 'Hide Details' : 'Show Details'}
                    </Button>

                    <Collapse in={expandedRecord === record.id}>
                      <Box sx={{ mt: 2 }}>
                        <Typography>Mental Illness History: {record.history_of_mental_illness || 'N/A'}</Typography>
                        <Typography>Risk Assessment: {record.risk_assessment_suicide_self_harm || 'N/A'}</Typography>
                        <Typography>Tests: {record.tests_administered || 'N/A'}</Typography>
                        <Typography>Interpretation: {record.scores_and_interpretation || 'N/A'}</Typography>
                        <Typography>Therapy Type: {record.type_of_therapy || 'N/A'}</Typography>
                      </Box>
                    </Collapse>
                  </CardContent>

                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(record.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleEditClick(record)}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                  </Box>
                </Card>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">
            {loading ? 'Loading...' : 'No clinical records found'}
          </Typography>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} fullWidth maxWidth="md">
        <DialogTitle>Edit Clinical Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              { label: "Temperature", name: "temperature" },
              { label: "Blood Pressure", name: "blood_pressure" },
              { label: "Pulse Rate", name: "pulse_rate" },
              { label: "Respiratory Rate", name: "respiratory_rate" },
              { label: "Psychological Concerns", name: "present_psychological_concerns" },
              { label: "History of Mental Illness", name: "history_of_mental_illness" },
            ].map(field => (
              <Grid item xs={12} sm={6} key={field.name}>
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  value={editRecord?.[field.name] || ''}
                  onChange={handleEditChange}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveEdit} color="primary" variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={exportToPDF}
          disabled={filteredHistory.length === 0 || loading}
        >
          Export to PDF
        </Button>
      </Box>

      {/* Notifications */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success">{message}</Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
}

export default ClinicalHistory;