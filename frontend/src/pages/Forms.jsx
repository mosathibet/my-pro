import React, { useState } from 'react';

function Forms() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="dashboard-content">
      <div className="breadcrumb">
        <span>📝 Forms</span>
      </div>

      <div className="form-container">
        <h2>Contact Form</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label>Message</label>
            <textarea 
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Enter your message"
              rows="5"
            ></textarea>
          </div>
          
          <button type="submit" className="btn-primary">Submit Form</button>
        </form>
      </div>
    </div>
  );
}

export default Forms;