import React from "react";
import { Link } from "react-router-dom";
import { FaUserMd, FaUserInjured, FaProcedures } from 'react-icons/fa'; // Icons

const Home = () => {
  // Inline styles
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
    },
    headerText: {
      fontSize: "2.5rem",
      color: "#333",
      fontWeight: "bold",
    },
    subHeader: {
      fontSize: "1.2rem",
      color: "#555",
      marginBottom: "30px",
    },
    sections: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
      flexWrap: "wrap", // Allow sections to wrap on smaller screens
    },
    section: {
      width: "25%",
      padding: "20px",
      margin: "10px 0",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      cursor: "pointer",
      height: "250px", // Reduce height to make it fit in one line
    },
    sectionHover: {
      transform: "translateY(-10px)",
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
    },
    sectionTitle: {
      fontSize: "1.5rem",
      color: "#333",
      marginBottom: "10px",
    },
    sectionText: {
      fontSize: "1rem",
      color: "#666",
      marginBottom: "15px",
    },
    link: {
      display: "inline-block",
      padding: "10px 20px",
      backgroundColor: "#007BFF",
      color: "white",
      textDecoration: "none",
      borderRadius: "4px",
      fontWeight: "bold",
      transition: "background-color 0.3s ease",
    },
    linkHover: {
      backgroundColor: "#0056b3",
    },
    icon: {
      fontSize: "2.5rem",
      color: "#007BFF",
      marginBottom: "15px",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerText}>Welcome to the Renewal Ridge EMR
</h1>
        <p style={styles.subHeader}>Your one-stop solution for managing healthcare services with ease and efficiency.</p>
      </header>

      <section style={styles.sections}>
        <div
          style={{ ...styles.section, ...styles.sectionHover }}
          className="home-section"
        >
          <FaUserInjured style={styles.icon} />
          <h2 style={styles.sectionTitle}>Patients</h2>
          <p style={styles.sectionText}>Manage your appointments, track your health records, and more!</p>
          <Link to="/dashboard" style={styles.link} aria-label="Go to Patient Dashboard">
            Go to Patient Dashboard
          </Link>
        </div>

        <div
          style={{ ...styles.section, ...styles.sectionHover }}
          className="home-section"
        >
          <FaUserMd style={styles.icon} />
          <h2 style={styles.sectionTitle}>Admin</h2>
          <p style={styles.sectionText}>Monitor patient data, manage appointments, and more from the admin dashboard.</p>
          <Link to="/admin" style={styles.link} aria-label="Go to Admin Dashboard">
            Go to Admin Dashboard
          </Link>
        </div>

        <div
          style={{ ...styles.section, ...styles.sectionHover }}
          className="home-section"
        >
          <FaProcedures style={styles.icon} />
          <h2 style={styles.sectionTitle}>Departments</h2>
          <p style={styles.sectionText}>Explore specialized departments like Pharmacy, Laboratory, and more.</p>
          <Link to="/departments" style={styles.link} aria-label="Explore Departments">
            Explore Departments
          </Link>
        </div>
      </section>

      {/* No footer section needed as requested */}
    </div>
  );
};

export default Home;
