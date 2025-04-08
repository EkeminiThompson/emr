import React, { useState } from "react";

// A simple React component to handle patient search and file download
const PatientSearchDownload = () => {
  const [query, setQuery] = useState(""); // State to handle the search query
  const [loading, setLoading] = useState(false); // State to manage loading status
  const [error, setError] = useState(""); // State for handling errors
  const [patientData, setPatientData] = useState(null); // Store the found patient data

  // Function to handle search and download process
  const searchAndDownload = async (patientQuery) => {
    setLoading(true); // Set loading to true while searching

    try {
      // Step 1: Search for a patient using the query
      const searchResponse = await fetch(`/search/patient?query=${patientQuery}`);
      
      if (!searchResponse.ok) {
        throw new Error('Patient not found or error in search');
      }

      const patient = await searchResponse.json();

      if (!patient || !patient.id) {
        throw new Error('No patient found');
      }

      // Step 2: Trigger the download of the Excel file for the found patient
      const downloadResponse = await fetch(`/export/excel/${patient.id}`);
      if (!downloadResponse.ok) {
        throw new Error('Failed to generate Excel file');
      }

      // Create a Blob from the Excel file stream
      const blob = await downloadResponse.blob();

      // Step 3: Create an invisible link to trigger the download
      const downloadLink = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = `${patient.id}_data.xlsx`;

      // Programmatically click the link to trigger the download
      downloadLink.click();

      // Clean up after download
      window.URL.revokeObjectURL(url);

      setPatientData(patient); // Store the patient data for UI
      setError(""); // Clear any previous errors
    } catch (err) {
      setError(err.message); // Set the error message if an error occurs
    } finally {
      setLoading(false); // Set loading to false when done
    }
  };

  // Handle the form submission and call the search and download function
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchAndDownload(query.trim());
    } else {
      setError("Please enter a search query");
    }
  };

  return (
    <div className="container">
      <h1>Search and Download Patient Data</h1>

      {/* Search form */}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="query">Search for Patient (Name, ID, Phone, etc.):</label>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter patient name, registration number, etc."
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search and Download"}
        </button>
      </form>

      {/* Error message */}
      {error && <div className="error">{error}</div>}

      {/* Display patient data (optional) */}
      {patientData && (
        <div className="patient-info">
          <h3>Patient Found:</h3>
          <p><strong>Name:</strong> {patientData.surname} {patientData.other_names}</p>
          <p><strong>Registration Number:</strong> {patientData.registration_number}</p>
          <p><strong>Phone Number:</strong> {patientData.phone_number}</p>
          {/* Add more details as needed */}
        </div>
      )}
    </div>
  );
};

export default PatientSearchDownload;
