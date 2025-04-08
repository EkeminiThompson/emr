import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch dashboard data from backend API
    axios.get('/api/v1/dashboard') // Your backend API endpoint
      .then((response) => {
        setDashboardData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message || 'Something went wrong!');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Patients</h3>
          <p>Total: {dashboardData.patient_count.count}</p>
        </div>
        <div className="stat-card">
          <h3>Appointments</h3>
          <p>Total: {dashboardData.appointment_count.count}</p>
        </div>
        <div className="stat-card">
          <h3>Billing</h3>
          <p>Total Amount: ${dashboardData.billing_stats.total_amount}</p>
        </div>
        <div className="stat-card">
          <h3>Medications Dispensed</h3>
          <p>Total: {dashboardData.medication_stats.medication_count}</p>
        </div>
        <div className="stat-card">
          <h3>Laboratory Tests</h3>
          <p>Total: {dashboardData.laboratory_stats.test_count}</p>
        </div>
        <div className="stat-card">
          <h3>Occupational Therapy Sessions</h3>
          <p>Total: {dashboardData.occupational_therapy_stats.therapy_count}</p>
        </div>
        <div className="stat-card">
          <h3>Psychology Therapy Sessions</h3>
          <p>Total: {dashboardData.psychology_therapy_stats.therapy_count}</p>
        </div>
        <div className="stat-card">
          <h3>Social Work Interventions</h3>
          <p>Total: {dashboardData.social_work_stats.social_work_interventions_count}</p>
        </div>
      </div>

      <div className="dashboard-links">
        <h2>Quick Links</h2>
        <ul>
          <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>
          <li><Link to="/patient-dashboard">Patient Dashboard</Link></li>
          <li><Link to="/appointments">Appointments</Link></li>
          <li><Link to="/billing">Billing</Link></li>
          <li><Link to="/reports">Reports</Link></li>
          <li><Link to="/patient-form">Patient Form</Link></li>
          <li><Link to="/patient-search-download">Patient Search & Download</Link></li>
          <li><Link to="/mental-health-form">Mental Health Form</Link></li>
          <li><Link to="/report-generator">Report Generator</Link></li>
          <li><Link to="/appointment-reminder">Appointment Reminder</Link></li>
        </ul>
      </div>

      <style>{`
        .dashboard-container {
          padding: 20px;
          background-color: #f4f7fc;
        }

        h1 {
          font-size: 2.5em;
          color: #333;
          margin-bottom: 20px;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-card h3 {
          font-size: 1.6em;
          margin-bottom: 10px;
          color: #007bff;
        }

        .stat-card p {
          font-size: 1.2em;
          color: #333;
        }

        .dashboard-links {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .dashboard-links h2 {
          font-size: 2em;
          color: #333;
          margin-bottom: 20px;
        }

        .dashboard-links ul {
          list-style-type: none;
          padding: 0;
        }

        .dashboard-links li {
          margin: 10px 0;
          font-size: 1.1em;
        }

        .dashboard-links a {
          text-decoration: none;
          color: #007bff;
          font-weight: bold;
          transition: color 0.3s ease;
        }

        .dashboard-links a:hover {
          color: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
