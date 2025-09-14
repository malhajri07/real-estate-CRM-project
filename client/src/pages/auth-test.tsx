import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthTestPage() {
  const { user, login, logout, isLoading } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testLogin = async () => {
    try {
      setTestResult('Testing login...');
      await login('admin@aqaraty.com', 'admin123');
      setTestResult('Login successful!');
    } catch (error) {
      setTestResult(`Login failed: ${error.message}`);
    }
  };

  const testLogout = () => {
    logout();
    setTestResult('Logged out');
  };

  useEffect(() => {
    if (user) {
      setTestResult(`User logged in: ${user.name} (${user.roles.join(', ')})`);
    } else {
      setTestResult('No user logged in');
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>Status:</strong> {isLoading ? 'Loading...' : 'Ready'}</p>
            <p><strong>User:</strong> {user ? `${user.name} (${user.email})` : 'Not logged in'}</p>
            <p><strong>Roles:</strong> {user ? user.roles.join(', ') : 'None'}</p>
          </div>
          
          <div className="space-y-2">
            <Button onClick={testLogin} className="w-full">
              Test Admin Login
            </Button>
            <Button onClick={testLogout} variant="outline" className="w-full">
              Logout
            </Button>
          </div>
          
          <div className="p-3 bg-gray-100 rounded">
            <p className="text-sm"><strong>Result:</strong> {testResult}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
