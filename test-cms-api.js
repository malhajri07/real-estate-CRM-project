// Test script for CMS API endpoints
const baseUrl = 'http://localhost:3000';

async function testCMSAPI() {
  console.log('🧪 Testing CMS API endpoints...\n');

  try {
    // Test 1: Get sections (draft)
    console.log('1. Testing GET /api/cms/landing/sections?status=draft');
    const sectionsResponse = await fetch(`${baseUrl}/api/cms/landing/sections?status=draft`);
    const sectionsData = await sectionsResponse.json();
    console.log(`✅ Found ${sectionsData.data?.length || 0} sections`);
    console.log(`   Sections: ${sectionsData.data?.map(s => s.slug).join(', ') || 'None'}\n`);

    // Test 2: Get sections (published)
    console.log('2. Testing GET /api/cms/landing/sections?status=published');
    const publishedResponse = await fetch(`${baseUrl}/api/cms/landing/sections?status=published`);
    const publishedData = await publishedResponse.json();
    console.log(`✅ Found ${publishedData.data?.length || 0} published sections\n`);

    // Test 3: Get public landing data
    console.log('3. Testing GET /api/landing');
    const publicResponse = await fetch(`${baseUrl}/api/landing`);
    const publicData = await publicResponse.json();
    console.log(`✅ Public landing data loaded successfully`);
    console.log(`   Sections: ${publicData.data?.map(s => s.slug).join(', ') || 'None'}\n`);

    // Test 4: Test preview endpoint (without auth for now)
    console.log('4. Testing GET /preview/landing');
    const previewResponse = await fetch(`${baseUrl}/preview/landing`);
    if (previewResponse.ok) {
      const previewData = await previewResponse.json();
      console.log(`✅ Preview endpoint accessible`);
      console.log(`   Preview sections: ${previewData.data?.map(s => s.slug).join(', ') || 'None'}\n`);
    } else {
      console.log(`⚠️  Preview endpoint requires authentication (${previewResponse.status})\n`);
    }

    console.log('🎉 All CMS API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Draft sections: ${sectionsData.data?.length || 0}`);
    console.log(`   - Published sections: ${publishedData.data?.length || 0}`);
    console.log(`   - Public sections: ${publicData.data?.length || 0}`);
    console.log(`   - Total cards: ${sectionsData.data?.reduce((sum, s) => sum + (s.cards?.length || 0), 0) || 0}`);

  } catch (error) {
    console.error('❌ Error testing CMS API:', error.message);
    console.log('\n💡 Make sure the server is running on http://localhost:3000');
  }
}

// Run the tests
testCMSAPI();
