import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  Paper,
  Divider,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Constants
const API_BASE_URL = '/v1/patients';
const AUDIT_API_URL = '/v1/audit/audit-logs/';

// Dropdown options
const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' }
];

const LEGAL_STATUS_OPTIONS = [
  { value: 'Adult', label: 'Adult' },
  { value: 'Minor', label: 'Minor' }
];

const RELIGION_OPTIONS = [
  { value: 'Christianity', label: 'Christianity' },
  { value: 'Islam', label: 'Islam' },
  { value: 'Hinduism', label: 'Hinduism' },
  { value: 'Buddhism', label: 'Buddhism' },
  { value: 'Other', label: 'Other' }
];

const PATIENT_FIELDS = [
  { name: 'source_of_info', label: 'Source of Info', type: 'text' }, // Changed from select to text
  { name: 'relationship_to_patient', label: 'Relationship to Patient', type: 'text' }, // Changed from select to text
  { name: 'surname', label: 'Surname', type: 'text' },
  { name: 'other_names', label: 'Other Names', type: 'text' },
  { name: 'residential_address', label: 'Residential Address', type: 'text' },
  { name: 'residential_phone', label: 'Residential Phone', type: 'tel' },
  { name: 'business_address', label: 'Business Address', type: 'text' },
  { name: 'business_phone', label: 'Business Phone', type: 'tel' },
  { name: 'next_of_kin', label: 'Next of Kin', type: 'text' },
  { name: 'next_of_kin_address', label: 'E_mail', type: 'text' },
  { name: 'next_of_kin_residential_phone', label: 'Next of Kin Residential Phone', type: 'tel' },
  { name: 'next_of_kin_business_phone', label: 'Next of Kin Business Phone', type: 'tel' },
  { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { name: 'sex', label: 'Gender', type: 'select', options: GENDER_OPTIONS },
  { name: 'age', label: 'Age', type: 'number', readOnly: true },
  { name: 'marital_status', label: 'Marital Status', type: 'select', options: MARITAL_STATUS_OPTIONS },
  { name: 'legal_status', label: 'Legal Status', type: 'select', options: LEGAL_STATUS_OPTIONS },
  { name: 'religion', label: 'Religion', type: 'select', options: RELIGION_OPTIONS },
  { name: 'denomination', label: 'Denomination', type: 'text' },
  { name: 'contact_person_address', label: 'Contact Person Address', type: 'text' },
  { name: 'contact_person_phone', label: 'Contact Person Phone', type: 'tel' },
  { name: 'family_doctor_address', label: 'Family Doctor Address', type: 'text' },
  { name: 'family_doctor_phone', label: 'Family Doctor Phone', type: 'tel' },
  { name: 'consultation_fee', label: 'Consultation Fee', type: 'number' }
];

// ... rest of your code remains exactly the same ...

const calculateAge = (birthDate) => {
  if (!birthDate) return '';
  
  const today = new Date();
  let birthDateObj;
  
  if (typeof birthDate === 'string') {
    birthDateObj = parseISO(birthDate);
  } else if (birthDate instanceof Date) {
    birthDateObj = birthDate;
  } else {
    return '';
  }
  
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  
  return age.toString();
};

const PatientForm = ({ patientId, onSave, setIsLoggedIn }) => {
  const [patient, setPatient] = useState(
    Object.fromEntries(PATIENT_FIELDS.map(field => [field.name, '']))
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [generatedPatientDetails, setGeneratedPatientDetails] = useState(null);
  const navigate = useNavigate();

  // Get token from localStorage
  const token = localStorage.getItem('access_token');
  const [roles, setRoles] = useState([]);

  // Initialize axios instance with interceptors
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || '',
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

        setRoles(decoded.roles || JSON.parse(localStorage.getItem('roles') || '[]'));

        if (patientId) {
          await fetchPatient();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        handleLogout();
      }
    };

    verifyTokenAndFetchData();
  }, [patientId]);

  // Centralized logout function
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('roles');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE_URL}/${patientId}`);
      
      // Ensure date fields are properly formatted
      const patientData = response.data;
      if (patientData.date_of_birth) {
        patientData.date_of_birth = parseISO(patientData.date_of_birth);
      }
      
      setPatient(patientData);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error fetching patient data");
    } finally {
      setLoading(false);
    }
  };

  const logAuditAction = async (action, entityId, description) => {
    try {
      await api.post(AUDIT_API_URL, {
        action,
        entity_type: 'Patient',
        entity_id: entityId,
        description
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, name) => {
    let dateString = '';
    if (date) {
      // If date is already a Date object, use it directly
      if (date instanceof Date) {
        dateString = date.toISOString().split('T')[0];
      } 
      // If it's a string, parse it first
      else if (typeof date === 'string') {
        dateString = parseISO(date).toISOString().split('T')[0];
      }
    }
    
    const newPatient = { ...patient, [name]: dateString };
    
    if (name === 'date_of_birth') {
      newPatient.age = calculateAge(dateString);
    }
    
    setPatient(newPatient);
  };

  const validateForm = () => {
    const newErrors = {};
    
    PATIENT_FIELDS.forEach(field => {
      if (!patient[field.name] && field.type !== 'date') {
        newErrors[field.name] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');
    setGeneratedPatientDetails(null);

    try {
      let response;
      if (patientId) {
        response = await api.put(`${API_BASE_URL}/${patientId}`, patient);
        setMessage('Patient updated successfully!');
        await logAuditAction(
          'patient_update', 
          patientId,
          `Updated patient record for ${patient.surname}, ${patient.other_names}`
        );
      } else {
        response = await api.post(`${API_BASE_URL}/`, patient);
        setMessage('Patient created successfully!');
        await logAuditAction(
          'patient_create',
          response.data.patient_id,
          `Created new patient record for ${response.data.surname}, ${response.data.other_names}`
        );
        
        setGeneratedPatientDetails({
          name: `${response.data.surname}, ${response.data.other_names}`,
          patientId: response.data.patient_id,
          hospitalRegNumber: response.data.hospital_reg_number
        });
        setPatient(Object.fromEntries(PATIENT_FIELDS.map(field => [field.name, ''])));
      }

      if (onSave) onSave(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error saving patient");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <TextField
            select
            fullWidth
            label={field.label}
            name={field.name}
            value={patient[field.name]}
            onChange={handleChange}
            error={!!errors[field.name]}
            helperText={errors[field.name] || ''}
            disabled={loading}
          >
            {field.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );
      
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={field.label}
              value={patient[field.name] ? parseISO(patient[field.name]) : null}
              onChange={(date) => handleDateChange(date, field.name)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!errors[field.name]}
                  helperText={errors[field.name] || ''}
                />
              )}
              maxDate={new Date()}
              disabled={loading}
            />
          </LocalizationProvider>
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.label}
            name={field.name}
            value={patient[field.name]}
            onChange={handleChange}
            error={!!errors[field.name]}
            helperText={errors[field.name] || ''}
            disabled={loading || field.readOnly}
            InputProps={{
              readOnly: field.readOnly,
              endAdornment: field.name === 'consultation_fee' ? (
                <InputAdornment position="end">NGN</InputAdornment>
              ) : null
            }}
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            type={field.type || 'text'}
            label={field.label}
            name={field.name}
            value={patient[field.name]}
            onChange={handleChange}
            error={!!errors[field.name]}
            helperText={errors[field.name] || ''}
            disabled={loading}
          />
        );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {patientId ? 'Edit Patient' : 'New Patient'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {PATIENT_FIELDS.map(field => (
                <Grid item xs={12} sm={6} key={field.name}>
                  {renderField(field)}
                </Grid>
              ))}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : patientId ? 'Update Patient' : 'Save Patient'}
                </Button>
              </Grid>
            </Grid>
          </form>

          {generatedPatientDetails && (
            <Paper sx={{ p: 3, mt: 3, borderLeft: '4px solid #4caf50', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom color="success.main">
                Patient Created Successfully
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography><strong>Name:</strong> {generatedPatientDetails.name}</Typography>
                <Typography><strong>Patient ID:</strong> {generatedPatientDetails.patientId}</Typography>
                <Typography><strong>Hospital Registration Number:</strong> {generatedPatientDetails.hospitalRegNumber}</Typography>
              </Box>
            </Paper>
          )}
        </Paper>

        <Snackbar
          open={!!message}
          autoHideDuration={6000}
          onClose={() => setMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={message?.includes('Error') ? 'error' : 'success'} 
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default PatientForm;