import React from 'react';

const TermsPage = () => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  // Inline styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '20px auto',
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1.6,
    },
    title: {
      textAlign: 'center',
      fontSize: '2rem',
      marginBottom: '20px',
    },
    effectiveDate: {
      textAlign: 'center',
      color: '#888',
      fontSize: '1rem',
    },
    section: {
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      color: '#333',
    },
    sectionSubtitle: {
      fontSize: '1.2rem',
      color: '#555',
    },
    footer: {
      textAlign: 'center',
      marginTop: '30px',
      fontSize: '0.9rem',
      color: '#777',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Terms and Conditions</h1>
      <p style={styles.effectiveDate}>Effective Date: {today}</p>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>1. Introduction</h2>
        <p>
          By using this form, you agree to abide by the terms outlined here.
          If you do not agree, please do not proceed with using this service.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>2. Purpose of the Form</h2>
        <p>
          This form is intended for use by licensed professionals to assess and
          treat mental health challenges, ensuring comprehensive care.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>3. User Responsibilities</h2>
        <p>
          You must provide accurate and truthful information in this form to
          ensure proper treatment and assessment.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>4. Privacy Policy</h2>
        <h3 style={styles.sectionSubtitle}>4.1 Information We Collect</h3>
        <p>
          We collect personal information, including your name, contact details,
          and medical history, to facilitate medical and mental health assessment
          and treatment.
        </p>

        <h3 style={styles.sectionSubtitle}>4.2 How We Use Your Information</h3>
        <p>
          Your information is used exclusively for medical and mental health
          assessments, treatment planning, and related services.
        </p>

        <h3 style={styles.sectionSubtitle}>4.3 Data Sharing</h3>
        <p>
          We will not share your personal information with third parties unless
          required by law or with your explicit consent.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>5. Confidentiality</h2>
        <p>
          All information shared within this form will be kept confidential in
          accordance with applicable laws, including health information privacy
          regulations.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>6. Limitation of Liability</h2>
        <p>
          We are not liable for any damages or issues arising from the use of
          this form or the provided information.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>7. Governing Law</h2>
        <p>
          This agreement is governed by and will be construed in accordance with
          the laws of Nigeria.
        </p>
      </section>

      <footer style={styles.footer}>
        <p>
          By using this form, you acknowledge that you have read and agree to the
          terms outlined above.
        </p>
      </footer>
    </div>
  );
};

export default TermsPage;
