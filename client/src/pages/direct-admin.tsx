import React, { useState, useEffect } from 'react';

export default function DirectAdminPage() {
  const [user, setUser] = useState({
    id: 'cmfgr30n5000a057svfmtcoma',
    email: 'admin@aqaraty.com',
    name: 'أحمد المدير',
    firstName: 'أحمد',
    lastName: 'المدير',
    roles: ['WEBSITE_ADMIN'],
    organizationId: null
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Simulate admin dashboard content
  const renderDashboard = () => (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', color: '#333' }}>Admin Dashboard</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Total Users</h3>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>1,247</p>
        </div>
        
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #c8e6c9'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#388e3c' }}>Active Properties</h3>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>3,891</p>
        </div>
        
        <div style={{
          backgroundColor: '#fff3e0',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ffcc02'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#f57c00' }}>Total Revenue</h3>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>2.4M ﷼</p>
        </div>
        
        <div style={{
          backgroundColor: '#fce4ec',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #f8bbd9'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#c2185b' }}>Active Leads</h3>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold', color: '#c2185b' }}>892</p>
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            New property listing: Villa in Riyadh - 2,500,000 ﷼
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            User registration: Ahmed Al-Rashid (Agent)
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            Property sold: Apartment in Jeddah - 1,800,000 ﷼
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            New lead: Sarah Mohammed (Buyer)
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', color: '#333' }}>User Management</h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>أحمد المدير</td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>admin@aqaraty.com</td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                <span style={{ 
                  backgroundColor: '#ffebee', 
                  color: '#c62828', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  WEBSITE_ADMIN
                </span>
              </td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                <span style={{ 
                  backgroundColor: '#e8f5e8', 
                  color: '#2e7d32', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  Active
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>محمد الأحمد</td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>owner1@riyadh-realestate.com</td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                <span style={{ 
                  backgroundColor: '#e3f2fd', 
                  color: '#1565c0', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  CORP_OWNER
                </span>
              </td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                <span style={{ 
                  backgroundColor: '#e8f5e8', 
                  color: '#2e7d32', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  Active
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>فاطمة علي</td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>agent1@riyadh-realestate.com</td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                <span style={{ 
                  backgroundColor: '#e8f5e8', 
                  color: '#2e7d32', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  CORP_AGENT
                </span>
              </td>
              <td style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                <span style={{ 
                  backgroundColor: '#e8f5e8', 
                  color: '#2e7d32', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  Active
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', color: '#333' }}>Analytics & Reports</h2>
      
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Performance Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Conversion Rate</p>
            <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>24.5%</p>
          </div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Avg. Deal Size</p>
            <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#388e3c' }}>1.2M ﷼</p>
          </div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Response Time</p>
            <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>2.3 hrs</p>
          </div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Customer Satisfaction</p>
            <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#c2185b' }}>4.8/5</p>
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Monthly Trends</h3>
        <div style={{ height: '200px', backgroundColor: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          📊 Chart Placeholder - Revenue and Leads over time
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: '0', color: '#333' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666' }}>Welcome, {user.name}</span>
          <button
            onClick={() => window.location.href = '/simple-admin'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        backgroundColor: 'white',
        padding: '0 2rem',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'users', label: 'User Management' },
            { id: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: activeTab === tab.id ? '#1976d2' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #1976d2' : '3px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
}
