import React, { useState } from 'react';

function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  return (
    <div className="dashboard-content">
      <div className="breadcrumb">
        <span>🔐 Login</span>
      </div>

      <div className="login-container">
        <form className="login-form">
          <h2>Login</h2>
          <div className="form-group">
            <input 
              type="email" 
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>
          <button type="submit" className="btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;