import React from 'react';

function Contact() {
  return (
    <div className="dashboard-content">
      <div className="breadcrumb">
        <span>📞 Contact</span>
      </div>

      <div className="contact-container">
        <h2>Contact Information</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <h3>📍 Address</h3>
            <p>123 Business Street<br />City, State 12345</p>
          </div>
          <div className="contact-card">
            <h3>📞 Phone</h3>
            <p>+1 (555) 123-4567</p>
          </div>
          <div className="contact-card">
            <h3>📧 Email</h3>
            <p>info@company.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;