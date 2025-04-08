import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PatientDetails = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionData, setSectionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Number of items per page

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all patients
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/v2/patients/patients');
      setPatients(response.data);
    } catch (error) {
      setError('Error fetching patients. Please try again later.');
      console.error('Error fetching patients', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch section-specific data
  const fetchSectionData = async (section) => {
    if (!selectedPatient) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/v2/patients/patients/${selectedPatient.patient_id}/${section}`);
      setSectionData(response.data);
      setSelectedSection(section);
      setCurrentPage(1); // Reset to the first page when new data is fetched
    } catch (error) {
      setError(`Error fetching ${section} data. Please try again later.`);
      console.error(`Error fetching ${section} data`, error);
    } finally {
      setLoading(false);
    }
  };

  // Select a patient
  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setSelectedSection(null); // Reset section when a new patient is selected
    setSectionData([]); // Clear section data
    setSearchQuery(''); // Clear search query
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to the first page when searching
  };

  // Filter section data based on search query
  const filteredData = sectionData.filter((item) => {
    return Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    fetchPatients(); // Fetch patients on component mount
  }, []);

  // Render section data in a user-friendly format
  const renderSectionData = () => {
    if (!selectedSection || !currentItems.length) return <p>No data available for this section.</p>;

    switch (selectedSection) {
      case 'pharmacy':
        return (
          <table>
            <thead>
              <tr>
                <th>Medication Name</th>
                <th>Dosage and Route</th>
                <th>Dispensation Date</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record.pharmacy_id}>
                  <td>{record.medication_name}</td>
                  <td>{record.dosage_and_route}</td>
                  <td>{new Date(record.dispensation_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'laboratory':
        return (
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Urgency</th>
                <th>Test Results</th>
                <th>Pathologist Comments</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record.id}>
                  <td>{record.tests_requested_by_physicians}</td>
                  <td>{record.urgency}</td>
                  <td>{record.test_results}</td>
                  <td>{record.pathologist_comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'occupational-therapy':
        return (
          <table>
            <thead>
              <tr>
                <th>Long Term Goals</th>
                <th>Short Term Goals</th>
                <th>ADLs Performance</th>
                <th>Cognitive Motor Skills</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record.id}>
                  <td>{record.long_term_goals}</td>
                  <td>{record.short_term_goals}</td>
                  <td>{record.adls_performance}</td>
                  <td>{record.cognitive_motor_skills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'nurses-notes':
        return (
          <table>
            <thead>
              <tr>
                <th>Temperature</th>
                <th>Blood Pressure</th>
                <th>Pulse Rate</th>
                <th>Respiratory Rate</th>
                <th>Weight (kg)</th>
                <th>Height (cm)</th>
                <th>Nurse Note</th>
                <th>Source of Referral</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record.id}>
                  <td>{record.temperature || 'N/A'}</td>
                  <td>{record.blood_pressure || 'N/A'}</td>
                  <td>{record.pulse_rate || 'N/A'}</td>
                  <td>{record.respiratory_rate || 'N/A'}</td>
                  <td>{record.weight_kg || 'N/A'}</td>
                  <td>{record.height_cm || 'N/A'}</td>
                  <td>{record.nurse_note || 'N/A'}</td>
                  <td>{record.source_of_referral || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'social-work':
        return (
          <table>
            <thead>
              <tr>
                <th>Housing Status</th>
                <th>Employment Status</th>
                <th>Family Support System</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record.id}>
                  <td>{record.housing_status}</td>
                  <td>{record.employment_status}</td>
                  <td>{record.family_support_system}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'clinical-notes':
        return (
          <table>
            <thead>
              <tr>
                <th>Source of Referral</th>
                <th>Reasons for Referral</th>
                <th>Special Features</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record.id}>
                  <td>{record.source_of_referral}</td>
                  <td>{record.reasons_for_referral}</td>
                  <td>{record.special_features_of_the_case}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'mental-health':
        return (
          <table>
            <thead>
              <tr>
                <th>Present Complaints</th>
                <th>History of Illness</th>
                <th>Drug History</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record.mental_health_id}>
                  <td>{record.present_complaints}</td>
                  <td>{record.history_of_present_illness}</td>
                  <td>{record.drug_history}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return <p>No data available for this section.</p>;
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={currentPage === number ? 'active' : ''}
          >
            {number}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="patient-details-container">
      {/* Header */}
      <div className="header">
        <h1>Patient Details</h1>
      </div>

      {/* Search Bar for Patients */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search patients by name, ID, or phone..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Main Content */}
      <div className="main-contentt">
        {/* Patient List (Sidebar) */}
        <div className="patients-list">
          <h2>Patient List</h2>
          <ul>
            {patients.map((patient) => (
              <li
                key={patient.patient_id}
                onClick={() => handlePatientClick(patient)}
                className={selectedPatient?.patient_id === patient.patient_id ? 'selected' : ''}
              >
                {patient.surname}, {patient.other_names} (ID: {patient.patient_id})
              </li>
            ))}
          </ul>
        </div>

        {/* Patient Details and Section Data */}
        <div className="patient-details">
          {/* Patient Summary */}
          {selectedPatient && (
            <div className="patient-summary">
              <h2>Patient Summary</h2>
              <p><strong>Name:</strong> {selectedPatient.surname}, {selectedPatient.other_names}</p>
              <p><strong>Patient ID:</strong> {selectedPatient.patient_id}</p>
              <p><strong>Gender:</strong> {selectedPatient.sex}</p>
              <p><strong>Age:</strong> {selectedPatient.age} years</p>
              <p><strong>Registration Number:</strong> {selectedPatient.hospital_reg_number}</p>
            </div>
          )}

          {/* Section Selector */}
          {selectedPatient && (
            <div className="section-selector">
              <h3>Select Section</h3>
              <div className="section-buttons">
                <button onClick={() => fetchSectionData('pharmacy')}>Pharmacy</button>
                <button onClick={() => fetchSectionData('laboratory')}>Laboratory</button>
                <button onClick={() => fetchSectionData('occupational-therapy')}>Occupational Therapy</button>
                <button onClick={() => fetchSectionData('nurses-notes')}>Nurses Notes</button>
                <button onClick={() => fetchSectionData('social-work')}>Social Work</button>
                <button onClick={() => fetchSectionData('clinical-notes')}>Clinical Notes</button>
                <button onClick={() => fetchSectionData('mental-health')}>Mental Health</button>
              </div>
            </div>
          )}

          {/* Section Data */}
          {selectedSection && (
            <div className="section-overview">
              <h2>{selectedSection.toUpperCase()} Overview</h2>
              <div className="section-search-bar">
                <input
                  type="text"
                  placeholder={`Search ${selectedSection}...`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              {renderSectionData()}
              {renderPagination()}
            </div>
          )}
        </div>
      </div>

      {/* Inline Styles */}
      <style jsx="true">{`
        .patient-details-container {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }

        .header h1 {
          text-align: center;
          color: #2c3e50;
        }

        .search-bar {
          margin: 20px 0;
        }

        .search-bar input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .main-contentt {
          display: flex;
          gap: 20px;
          margin: 20px 0.1;
        }

        .patients-list {
          flex: 1;
          max-width: 300px;
          padding-left: 0; /* Remove extra padding */
        }

        .patients-list ul {
          list-style-type: none;
          padding-left: 0; /* Remove extra padding */
        }

        .patients-list li {
          padding: 8px;
          background-color: #ecf0f1;
          margin: 5px 0;
          cursor: pointer;
          border-radius: 4px;
        }

        .patients-list li.selected {
          background-color: #3498db;
          color: white;
        }

        .patient-details {
          flex: 3;
        }

        .patient-summary, .section-selector, .section-overview {
          margin-top: 20px;
          padding: 15px;
          background-color: #ecf0f1;
          border-radius: 4px;
        }

        .section-selector .section-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .section-selector button {
          padding: 10px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .section-selector button:hover {
          background-color: #2980b9;
        }

        .section-overview table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          overflow-x: auto; /* Add horizontal scrolling */
          display: block; /* Ensure the table is scrollable */
        }

        .section-overview th, .section-overview td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }

        .section-overview th {
          background-color: #3498db;
          color: white;
        }

        .section-overview tr:nth-child(even) {
          background-color: #f2f2f2;
        }

        .section-overview tr:hover {
          background-color: #ddd;
        }

        .pagination {
          margin-top: 20px;
          text-align: center;
        }

        .pagination button {
          padding: 8px 12px;
          margin: 0 5px;
          border: 1px solid #3498db;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
        }

        .pagination button.active {
          background-color: #3498db;
          color: white;
        }

        .section-search-bar {
          margin-bottom: 20px;
        }

        .section-search-bar input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default PatientDetails;