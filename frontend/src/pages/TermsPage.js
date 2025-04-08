import React from 'react';

const TermsPage = () => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  return (
    <div>
      <h1>Terms and Conditions</h1>
      <p>Effective Date: {today}</p>

      <h2>1. Introduction</h2>
      <p>By using this form, you agree to abide by the terms outlined here. If you do not agree, please do not proceed.</p>

      <h2>2. Purpose of the Form</h2>
      <p>This form is for use by licensed professionals to assess and treat mental health challenges.</p>

      <h2>3. User Responsibilities</h2>
      <p>You must provide accurate and truthful information in this form.</p>

      <h2>4. Privacy Policy</h2>

      <h3>4.1 Information We Collect</h3>
      <p>We collect personal information, including name, contact details, and medical history, which is necessary for medical and mental health assessment and care.</p>

      <h3>4.2 How We Use Your Information</h3>
      <p>Your information is used solely for the purpose of medical and mental health assessment and treatment.</p>

      <h3>4.3 Data Sharing</h3>
      <p>Your information is not shared with third parties unless with your permission or as required by law.</p>

      <h2>5. Confidentiality</h2>
      <p>Your information will be kept confidential in accordance with applicable laws.</p>

      <h2>6. Limitation of Liability</h2>
      <p>We are not liable for any damages that may arise from the use of the form.</p>

      <h2>7. Governing Law</h2>
      <p>This agreement is governed by the laws of Nigeria.</p>
    </div>
  );
};

export default TermsPage;
