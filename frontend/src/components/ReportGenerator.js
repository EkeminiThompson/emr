import React, { useState } from 'react';
import axios from 'axios';
import { 
    Box, Button, TextField, Typography, Paper, Grid, 
    CircularProgress, Alert, Snackbar, MenuItem, Select, 
    FormControl, InputLabel, Stack, Divider
} from '@mui/material';
import { Download, Search, PictureAsPdf, GridOn, TableChart, InsertDriveFile } from '@mui/icons-material';

const PatientExport = () => {
    const [patientId, setPatientId] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [exportType, setExportType] = useState('excel');
    const [filters, setFilters] = useState({
        sex: '',
        minAge: '',
        maxAge: '',
        skip: 0,
        limit: 100
    });

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const showMessage = (msg, sev = 'info') => {
        setMessage(msg);
        setSeverity(sev);
        setOpenSnackbar(true);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = async () => {
        if (!patientId.trim()) {
            showMessage('Please enter a Patient ID', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(`/v1/export/exports/patients/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setPatientData(response.data);
            showMessage(`Patient Found: ${response.data.patient.surname} ${response.data.patient.other_names}`, 'success');
        } catch (error) {
            setPatientData(null);
            showMessage(error.response?.data?.detail || 'Patient not found', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        if (!patientId.trim()) {
            showMessage('Please enter a Patient ID', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            let endpoint = '';
            let filename = '';
            let contentType = '';
            
            switch(exportType) {
                case 'excel':
                    endpoint = `/v1/export/exports/patients/${patientId}/excel`;
                    filename = `${patientId}_medical_record.xlsx`;
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                case 'pdf':
                    endpoint = `/v1/export/exports/patients/${patientId}/pdf`;
                    filename = `${patientId}_medical_record.pdf`;
                    contentType = 'application/pdf';
                    break;
                case 'csv':
                    endpoint = `/v1/export/exports/patients/${patientId}/csv`;
                    filename = `${patientId}_medical_record.csv`;
                    contentType = 'text/csv';
                    break;
                default:
                    throw new Error('Invalid export type');
            }

            const response = await axios.get(endpoint, { 
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            showMessage(`Patient record exported as ${exportType.toUpperCase()}`, 'success');
        } catch (error) {
            showMessage(error.response?.data?.detail || `Export failed (${exportType.toUpperCase()})`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportAll = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.sex) params.append('sex', filters.sex);
            if (filters.minAge) params.append('min_age', filters.minAge);
            if (filters.maxAge) params.append('max_age', filters.maxAge);
            params.append('skip', filters.skip);
            params.append('limit', filters.limit);

            const response = await axios.get(`/v1/export/exports/all/excel?${params.toString()}`, { 
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `all_patients_export_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            showMessage('All patients exported successfully', 'success');
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Export failed';
            showMessage(errorMsg.includes('No patients found') ? 
                'No patients match the selected filters' : errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: 'auto', p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                    Patient Data Exports
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Export individual patient records or all patient data in various formats
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Single Patient Export Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Single Patient Export
                    </Typography>
                    
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Patient ID"
                                variant="outlined"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                placeholder="Enter Patient ID"
                                disabled={isLoading}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                startIcon={<Search />}
                                onClick={handleSearch}
                                disabled={isLoading || !patientId.trim()}
                                size="large"
                            >
                                Search
                            </Button>
                        </Grid>
                    </Grid>

                    {patientData && (
                        <Box sx={{ 
                            mt: 2, 
                            p: 2, 
                            bgcolor: 'background.paper', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Stack direction="row" justifyContent="space-between">
                                <div>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                        {patientData.patient.surname}, {patientData.patient.other_names}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ID: {patientData.patient.patient_id} | Age: {patientData.patient.age} | Gender: {patientData.patient.sex}
                                    </Typography>
                                </div>
                                <Typography variant="body2" color="text.secondary">
                                    {patientData.export_metadata.record_count} records
                                </Typography>
                            </Stack>
                        </Box>
                    )}

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={5}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Export Format</InputLabel>
                                <Select
                                    value={exportType}
                                    onChange={(e) => setExportType(e.target.value)}
                                    label="Export Format"
                                    disabled={isLoading}
                                >
                                    <MenuItem value="excel">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <GridOn fontSize="small" />
                                            <span>Excel</span>
                                        </Stack>
                                    </MenuItem>
                                    <MenuItem value="pdf">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <PictureAsPdf fontSize="small" />
                                            <span>PDF</span>
                                        </Stack>
                                    </MenuItem>
                                    <MenuItem value="csv">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <InsertDriveFile fontSize="small" />
                                            <span>CSV</span>
                                        </Stack>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={7}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                startIcon={<Download />}
                                onClick={handleExport}
                                disabled={isLoading || !patientId.trim()}
                                size="large"
                            >
                                Export Patient Data
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* All Patients Export Section */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Bulk Export
                    </Typography>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Gender Filter</InputLabel>
                                <Select
                                    name="sex"
                                    value={filters.sex}
                                    onChange={handleFilterChange}
                                    label="Gender Filter"
                                    disabled={isLoading}
                                >
                                    <MenuItem value="">All Genders</MenuItem>
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Minimum Age"
                                name="minAge"
                                type="number"
                                value={filters.minAge}
                                onChange={handleFilterChange}
                                disabled={isLoading}
                                size="small"
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Maximum Age"
                                name="maxAge"
                                type="number"
                                value={filters.maxAge}
                                onChange={handleFilterChange}
                                disabled={isLoading}
                                size="small"
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="secondary"
                                startIcon={<TableChart />}
                                onClick={handleExportAll}
                                disabled={isLoading}
                                size="large"
                                sx={{ mt: 1 }}
                            >
                                Export All Patients (Excel)
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <CircularProgress />
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={severity} 
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    <Typography variant="body2">{message}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PatientExport;