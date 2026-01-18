/**
 * LandingStudioDebug.tsx - Landing Studio Debug Component
 * 
 * Location: apps/web/src/ → Components/ → CMS Components → LandingStudioDebug.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Debug component for CMS landing studio. Provides:
 * - Landing page data debugging
 * - Data inspection tools
 * - Development utilities
 * 
 * Related Files:
 * - apps/web/src/components/cms/LandingStudio.tsx - Landing studio component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function LandingStudioDebug() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching CMS data...');
        const response = await fetch('/api/cms/landing/sections?status=draft');
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 CMS data received:', result);
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching CMS data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-lg">Loading CMS data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            <h3 className="text-lg font-semibold mb-2">Error Loading CMS Data</h3>
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>CMS Debug - Data Loaded Successfully</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Status:</strong> ✅ Connected</p>
            <p><strong>Sections Found:</strong> {data?.data?.length || 0}</p>
            <p><strong>API Endpoint:</strong> /api/cms/landing/sections?status=draft</p>
          </div>
        </CardContent>
      </Card>

      {data?.data && data.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.data.map((section: any, index: number) => (
                <div key={section.id} className="p-3 border rounded">
                  <h4 className="font-medium">{section.slug}</h4>
                  <p className="text-sm text-gray-600">{section.title}</p>
                  <p className="text-xs text-gray-500">
                    Status: {section.status} | Cards: {section.cards?.length || 0}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
