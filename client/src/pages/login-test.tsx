import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginTestPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing login with:', { username, password });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Login test response:', { status: response.status, data });
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data
      });
    } catch (error) {
      console.error('Login test error:', error);
      setResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username:</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>
          
          <Button 
            onClick={testLogin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Test Accounts (username / password):</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>admin / admin123</li>
              <li>owner1 / owner123</li>
              <li>agent1 / agent123</li>
              <li>indiv1 / agent123</li>
              <li>seller1 / seller123</li>
              <li>buyer1 / buyer123</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
