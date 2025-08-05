import React from 'react';

function Documents() {
  return (
    <div className="dashboard-content">
      <div className="breadcrumb">
        <span>📄 Documents</span>
      </div>

      <div className="page-header">
        <h2>Document Management</h2>
        <button className="btn-primary">+ Add Document</button>
      </div>

      <div className="documents-grid">
        <div className="document-card">
          <div className="doc-icon">📄</div>
          <h4>Project Report.pdf</h4>
          <p>Modified: 2 hours ago</p>
          <div className="doc-actions">
            <button>View</button>
            <button>Download</button>
            <button>Delete</button>
          </div>
        </div>
        
        <div className="document-card">
          <div className="doc-icon">📊</div>
          <h4>Sales Analysis.xlsx</h4>
          <p>Modified: 1 day ago</p>
          <div className="doc-actions">
            <button>View</button>
            <button>Download</button>
            <button>Delete</button>
          </div>
        </div>

        <div className="document-card">
          <div className="doc-icon">📝</div>
          <h4>Meeting Notes.docx</h4>
          <p>Modified: 3 days ago</p>
          <div className="doc-actions">
            <button>View</button>
            <button>Download</button>
            <button>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Documents;