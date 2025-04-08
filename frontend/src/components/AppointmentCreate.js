import React, { useState, useEffect } from 'react';
import axios from 'axios';

// The main component that handles search, create, and CRUD operations.
const Dashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatmentPlan, setTreatmentPlan] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState(null);

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
            setAppointments(response.data);
            setError('');
        } catch (err) {
            setError('Error fetching appointments');
            setAppointments([]);
        }
    };

    // Create a new appointment
    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        const appointmentData = {
            patient_id: selectedPatient.patient_id, // Include the patient_id
            appointment_date: appointmentDate,
            reason_for_visit: reasonForVisit,
            diagnosis: diagnosis,
            treatment_plan: treatmentPlan,
            notes: notes,
        };

        try {
            await axios.post(`/v1/appointments/v1/patients/${selectedPatient.patient_id}/appointments`, appointmentData);
            setSuccessMessage('Appointment created successfully!');
            setError('');
            // Clear form fields after successful creation
            setAppointmentDate('');
            setReasonForVisit('');
            setDiagnosis('');
            setTreatmentPlan('');
            setNotes('');
        } catch (err) {
            setError('Error creating appointment');
            setSuccessMessage('');
        }
    };

    // Delete an appointment
    const handleDeleteAppointment = async (appointmentId) => {
        try {
            await axios.delete(`/v1/appointments/${appointmentId}`);
            setAppointments(appointments.filter((appointment) => appointment.appointment_id !== appointmentId));
            setSuccessMessage('Appointment deleted successfully!');
        } catch (err) {
            setError('Error deleting appointment');
        }
    };

    // Start editing an appointment
    const handleUpdateAppointment = (appointment) => {
        setIsEditing(true);
        setAppointmentToEdit(appointment);
        setAppointmentDate(appointment.appointment_date);
        setReasonForVisit(appointment.reason_for_visit);
        setDiagnosis(appointment.diagnosis);
        setTreatmentPlan(appointment.treatment_plan);
        setNotes(appointment.notes);
    };

    // Submit the updated appointment
    const handleSubmitUpdatedAppointment = async (e) => {
        e.preventDefault();
        const updatedAppointmentData = {
            appointment_date: appointmentDate,
            reason_for_visit: reasonForVisit,
            diagnosis: diagnosis,
            treatment_plan: treatmentPlan,
            notes: notes,
        };

        try {
            await axios.put(`/v1/appointments/${selectedPatient.patient_id}/appointments/${appointmentToEdit.appointment_id}`, updatedAppointmentData);
            setSuccessMessage('Appointment updated successfully!');
            setError('');
            setIsEditing(false);
            // Refresh the appointments list
            const response = await axios.get(`/v1/appointments/v1/patients/${selectedPatient.patient_id}/appointments`);
            setAppointments(response.data);
        } catch (err) {
            setError('Error updating appointment');
            setSuccessMessage('');
        }
    };

    return (
        <div>
            <h1>Patient Dashboard</h1>

            {/* Patient Search */}
            {!selectedPatient && (
                <div>
                    <h2>Search Patients</h2>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by surname or patient ID"
                    />
                    <button onClick={handleSearch}>Search</button>
                    {error && <div style={{ color: 'red' }}>{error}</div>}

                    {patients.length > 0 && (
                        <ul>
                            {patients.map((patient) => (
                                <li key={patient.patient_id} onClick={() => handleSelectPatient(patient)}>
                                    {patient.surname}, {patient.other_names} - ID: {patient.patient_id}
                                </li>
                            ))}
                        </ul>
                    )}
                    {patients.length === 0 && <div>No patients found.</div>}
                </div>
            )}

            {/* Patient Selected, Show Appointment Creation and CRUD */}
            {selectedPatient && (
                <div>
                    <h2>Manage Appointments for {selectedPatient.surname}</h2>

                    {/* Appointment Creation Form */}
                    {!isEditing && (
                        <form onSubmit={handleCreateAppointment}>
                            <div>
                                <label>Appointment Date</label>
                                <input
                                    type="datetime-local"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label>Reason for Visit</label>
                                <input
                                    type="text"
                                    value={reasonForVisit}
                                    onChange={(e) => setReasonForVisit(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Diagnosis</label>
                                <input
                                    type="text"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Treatment Plan</label>
                                <input
                                    type="text"
                                    value={treatmentPlan}
                                    onChange={(e) => setTreatmentPlan(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <button type="submit">Create Appointment</button>
                        </form>
                    )}

                    {/* Edit Appointment Form */}
                    {isEditing && (
                        <form onSubmit={handleSubmitUpdatedAppointment}>
                            <div>
                                <label>Appointment Date</label>
                                <input
                                    type="datetime-local"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label>Reason for Visit</label>
                                <input
                                    type="text"
                                    value={reasonForVisit}
                                    onChange={(e) => setReasonForVisit(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Diagnosis</label>
                                <input
                                    type="text"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Treatment Plan</label>
                                <input
                                    type="text"
                                    value={treatmentPlan}
                                    onChange={(e) => setTreatmentPlan(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <button type="submit">Update Appointment</button>
                        </form>
                    )}

                    {error && <div style={{ color: 'red' }}>{error}</div>}
                    {successMessage && <div style={{ color: 'green' }}>{successMessage}</div>}

                    {/* Appointments List and CRUD */}
                    <div>
                        <h3>Existing Appointments</h3>
                        {appointments.length > 0 ? (
                            <ul>
                                {appointments.map((appointment) => (
                                    <li key={appointment.appointment_id}>
                                        <div>
                                            <strong>Date:</strong> {appointment.appointment_date}
                                            <br />
                                            <strong>Reason:</strong> {appointment.reason_for_visit}
                                            <br />
                                            <button onClick={() => handleUpdateAppointment(appointment)}>
                                                Update
                                            </button>
                                            <button onClick={() => handleDeleteAppointment(appointment.appointment_id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>No appointments found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
