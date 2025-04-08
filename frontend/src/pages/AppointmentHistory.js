import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [filterType, setFilterType] = useState('all'); // 'all', 'past', 'upcoming'
    const [filteredAppointments, setFilteredAppointments] = useState([]);

    // Fetch all appointments on component mount
    useEffect(() => {
        fetchAppointments();
    }, []);

    // Filter appointments based on filter type
    useEffect(() => {
        filterAppointments();
    }, [appointments, filterType]);

    // Fetch all appointments
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/v1/appointments/');
            setAppointments(response.data);
            setError('');
        } catch (err) {
            setError('Error fetching appointments');
        } finally {
            setLoading(false);
        }
    };

    // Filter appointments based on filter type
    const filterAppointments = () => {
        const now = new Date();
        switch (filterType) {
            case 'past':
                setFilteredAppointments(
                    appointments.filter((appt) => new Date(appt.appointment_date) < now)
                );
                break;
            case 'upcoming':
                setFilteredAppointments(
                    appointments.filter((appt) => new Date(appt.appointment_date) >= now)
                );
                break;
            default:
                setFilteredAppointments(appointments);
                break;
        }
    };

    // Search for patients by surname or patient ID
    const handleSearch = async () => {
        try {
            const response = await axios.get(`/v1/appointments/v1/patients/search?query=${searchQuery}`);
            setPatients(response.data);
            setError('');
        } catch (err) {
            setError('Error searching for patients');
            setPatients([]);
        }
    };

    // Select a patient and fetch their appointments
    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        try {
            const response = await axios.get(`/v1/appointments/v1/patients/${patient.patient_id}/appointments`);
            setFilteredAppointments(response.data);
            setError('');
        } catch (err) {
            setError('Error fetching appointments');
            setFilteredAppointments([]);
        }
    };

    // Reset search and show all appointments
    const resetSearch = () => {
        setSearchQuery('');
        setSelectedPatient(null);
        setFilterType('all');
        filterAppointments();
    };

    return (
        <div style={styles.container}>
            <h1>Appointment Management</h1>

            {/* Search Section */}
            <div style={styles.searchSection}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by surname or patient ID"
                    style={styles.searchInput}
                />
                <button onClick={handleSearch} style={styles.searchButton}>
                    Search Patient
                </button>
                <button onClick={resetSearch} style={styles.resetButton}>
                    Reset Search
                </button>
            </div>

            {/* Patient List */}
            {!selectedPatient && patients.length > 0 && (
                <div style={styles.patientList}>
                    <h2>Search Results</h2>
                    <ul>
                        {patients.map((patient) => (
                            <li
                                key={patient.patient_id}
                                onClick={() => handleSelectPatient(patient)}
                                style={styles.patientListItem}
                            >
                                {patient.surname}, {patient.other_names} - ID: {patient.patient_id}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Selected Patient Details */}
            {selectedPatient && (
                <div style={styles.patientDetails}>
                    <h2>Selected Patient</h2>
                    <p><strong>Name:</strong> {selectedPatient.surname}, {selectedPatient.other_names}</p>
                    <p><strong>Patient ID:</strong> {selectedPatient.patient_id}</p>
                </div>
            )}

            {/* Filter Buttons */}
            <div style={styles.filterButtons}>
                <button
                    onClick={() => setFilterType('all')}
                    style={filterType === 'all' ? { ...styles.filterButton, ...styles.activeButton } : styles.filterButton}
                >
                    All Appointments
                </button>
                <button
                    onClick={() => setFilterType('past')}
                    style={filterType === 'past' ? { ...styles.filterButton, ...styles.activeButton } : styles.filterButton}
                >
                    Past Appointments
                </button>
                <button
                    onClick={() => setFilterType('upcoming')}
                    style={filterType === 'upcoming' ? { ...styles.filterButton, ...styles.activeButton } : styles.filterButton}
                >
                    Upcoming Appointments
                </button>
            </div>

            {/* Loading and Error Messages */}
            {loading && <div style={styles.loading}>Loading...</div>}
            {error && <div style={styles.error}>{error}</div>}

            {/* Appointments List */}
            <div style={styles.appointmentsList}>
                <h2>{filterType === 'all' ? 'All Appointments' : filterType === 'past' ? 'Past Appointments' : 'Upcoming Appointments'}</h2>
                {filteredAppointments.length > 0 ? (
                    <ul style={styles.appointmentList}>
                        {filteredAppointments.map((appt) => (
                            <li key={appt.appointment_id} style={styles.appointmentItem}>
                                <p><strong>Date:</strong> {new Date(appt.appointment_date).toLocaleString()}</p>
                                <p><strong>Reason:</strong> {appt.reason_for_visit}</p>
                                <p><strong>Diagnosis:</strong> {appt.diagnosis}</p>
                                <p><strong>Treatment Plan:</strong> {appt.treatment_plan}</p>
                                <p><strong>Notes:</strong> {appt.notes}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div>No appointments found.</div>
                )}
            </div>
        </div>
    );
};

// Inline CSS styles
const styles = {
    container: {
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    searchSection: {
        marginBottom: '20px',
    },
    searchInput: {
        padding: '10px',
        width: '300px',
        marginRight: '10px',
    },
    searchButton: {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        marginRight: '10px',
    },
    resetButton: {
        padding: '10px 15px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
    },
    patientList: {
        marginBottom: '20px',
    },
    patientListItem: {
        padding: '10px',
        borderBottom: '1px solid #ddd',
        cursor: 'pointer',
    },
    patientDetails: {
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
    },
    filterButtons: {
        marginBottom: '20px',
    },
    filterButton: {
        padding: '10px 15px',
        marginRight: '10px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: '#e0e0e0',
    },
    activeButton: {
        backgroundColor: '#007bff',
        color: 'white',
    },
    appointmentsList: {
        marginTop: '20px',
    },
    appointmentList: {
        listStyleType: 'none',
        padding: '0',
    },
    appointmentItem: {
        backgroundColor: '#f1f1f1',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '10px',
    },
    loading: {
        padding: '10px',
        marginBottom: '20px',
        borderRadius: '5px',
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    error: {
        padding: '10px',
        marginBottom: '20px',
        borderRadius: '5px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
};

export default Appointments;