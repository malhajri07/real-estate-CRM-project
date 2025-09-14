import React, { useState, useEffect } from 'react';

export default function SimpleAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        console.log('Login successful:', data.user);
      } else {
        setError('Login failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
          Simple Admin Access
        </h1>
        
        {!user ? (
          <div>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Click the button below to log in as admin:
            </p>
            <button
              onClick={login}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
            
            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '10px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>✅ Successfully Logged In!</h3>
              <p style={{ margin: '0' }}>
                <strong>Name:</strong> {user.name}<br/>
                <strong>Username:</strong> {user.username || '(none)'}<br/>
                <strong>Email:</strong> {user.email}<br/>
                <strong>Roles:</strong> {user.roles.join(', ')}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.location.href = '/rbac-dashboard'}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Go to Admin Dashboard
              </button>
              
              <button
                onClick={logout}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
        
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Debug Info:</h4>
          <p style={{ margin: '0' }}>
            <strong>Current User:</strong> {user ? 'Logged in' : 'Not logged in'}<br/>
            <strong>Token:</strong> {localStorage.getItem('auth_token') ? 'Present' : 'Missing'}<br/>
            <strong>User Data:</strong> {localStorage.getItem('user_data') ? 'Present' : 'Missing'}
          </p>
        </div>
      </div>
    </div>
  );
}
