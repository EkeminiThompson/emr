import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosInstance';
import {
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Paper,
} from '@mui/material';

// Base URL for API (adjust to match your backend API URL) 
//const API_URL = 'http://localhost:8000/psychology/';

const PsychologyCrud = () => {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);

  // Form data state
  const [formData, setFormData] = useState({
    hospital_reg_number: '',
    patient_category: 'Outpatient',
    organization_name: '',
    visit_id: '',
    age: 0,
    gender: '',
    marital_status: '',
    phone_number: '',
    folder_number: '',
    card_number: '',
    clinic: '',
    specialty_unit: '',
    psychology_fee: 0.0,
  });

  // Fetch all psychology records
  const fetchRecords = async () => {
    try {
      const response = await axios.get(/psychology/);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Search functionality (search by multiple fields including surname, other names, visit_id)
  const handleSearch = () => {
    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      const filteredRecords = records.filter((record) => {
        return (
          record.visit_id.toLowerCase().includes(lowerSearchQuery) ||
          record.hospital_reg_number.toLowerCase().includes(lowerSearchQuery) ||
          record.organization_name.toLowerCase().includes(lowerSearchQuery) ||
          (record.surname && record.surname.toLowerCase().includes(lowerSearchQuery)) || // Assuming there's a `surname` field
          (record.other_names && record.other_names.toLowerCase().includes(lowerSearchQuery)) // Assuming there's a `other_names` field
        );
      });
      setRecords(filteredRecords);
    } else {
      fetchRecords(); // Reset search to show all records if search query is empty
    }
  };

  // Create new record
  const handleCreate = async () => {
    try {
      await axios.post(/psychology/, formData);
      fetchRecords(); // Refresh records list
      handleCloseDialog(); // Close the dialog
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  // Update existing record
  const handleUpdate = async () => {
    try {
      await axios.put(`/psychology/${selectedRecord.visit_id}`, formData);
      fetchRecords(); // Refresh records list
      handleCloseDialog(); // Close the dialog
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  // Delete a record
  const handleDelete = async (visitId) => {
    try {
      await axios.delete(`/psychology/${visitId}`);
      fetchRecords(); // Refresh records list
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  // Open the dialog to create or update a record
  const handleOpenDialog = (record = null) => {
    setSelectedRecord(record);
    if (record) {
      setIsCreateMode(false);
      setFormData(record);
    } else {
      setIsCreateMode(true);
      setFormData({
        hospital_reg_number: '',
        patient_category: 'Outpatient',
        organization_name: '',
        visit_id: '',
        age: 0,
        gender: '',
        marital_status: '',
        phone_number: '',
        folder_number: '',
        card_number: '',
        clinic: '',
        specialty_unit: '',
        psychology_fee: 0.0,
      });
    }
    setOpenDialog(true);
  };

  // Close the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle input change in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Effect to fetch records initially
  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        OutPatient Records
      </Typography>

      {/* Search Bar */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Search by Visit ID, Surname, Other Names, Hospital Reg Number"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          sx={{ ml: 2 }}
        >
          Search
        </Button>
      </Box>

      {/* Records Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Visit ID</TableCell>
              <TableCell>Patient Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.visit_id}>
                <TableCell>{record.visit_id}</TableCell>
                <TableCell>{record.organization_name}</TableCell>
                <TableCell>{record.age}</TableCell>
                <TableCell>{record.gender}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleOpenDialog(record)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(record.visit_id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/Update Record */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isCreateMode ? 'Create New Record' : 'Edit Record'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Visit ID"
            variant="outlined"
            fullWidth
            value={formData.visit_id}
            name="visit_id"
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            disabled={!isCreateMode} // Disable visit_id for editing
          />
          <TextField
            label="Hospital Registration Number"
            variant="outlined"
            fullWidth
            value={formData.hospital_reg_number}
            name="hospital_reg_number"
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Surname"
            variant="outlined"
            fullWidth
            value={formData.surname}
            name="surname"
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Other Names"
            variant="outlined"
            fullWidth
            value={formData.other_names}
            name="other_names"
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          {/* Add other fields as necessary */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={isCreateMode ? handleCreate : handleUpdate}
            color="primary"
          >
            {isCreateMode ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PsychologyCrud;
