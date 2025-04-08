import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const PatientsDashboard = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get('/v1/patients/');
                setPatients(response.data);
            } catch (error) {
                setError('Failed to load patients data');
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>;
    }

    if (patients.length === 0) {
        return <div>No patients found.</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <Typography variant="h4" gutterBottom>
                Patients Dashboard
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Patient ID</TableCell>
                            <TableCell>Date of Birth</TableCell>
                            <TableCell>Age</TableCell>
                            <TableCell>Sex</TableCell>
                            <TableCell>Marital Status</TableCell>
                            <TableCell>Address</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {patients.map((patient) => (
                            <TableRow key={patient.patient_id}>
                                <TableCell>{patient.surname}, {patient.other_names}</TableCell>
                                <TableCell>{patient.patient_id}</TableCell>
                                <TableCell>{patient.date_of_birth}</TableCell>
                                <TableCell>{patient.age} years</TableCell>
                                <TableCell>{patient.sex}</TableCell>
                                <TableCell>{patient.marital_status}</TableCell>
                                <TableCell>{patient.residential_address}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default PatientsDashboard;