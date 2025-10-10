import React from 'react';
import { LandingStudio } from '@/components/cms/LandingStudio';
import { LandingStudioDebug } from '@/components/cms/LandingStudioDebug';

export default function CMSTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CMS Test Page</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Landing Studio Debug Component</h2>
          <LandingStudioDebug />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Original Landing Studio Component</h2>
          <LandingStudio />
        </div>
      </div>
    </div>
  );
}
