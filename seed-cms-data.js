// Simple script to test CMS integration
// This would normally be done through the Strapi admin panel

const testCMSIntegration = async () => {
  try {
    // Test the CMS service from the client
    const { cmsService } = await import('./client/src/lib/cms.js');
    
    console.log('Testing CMS integration...');
    
    // Try to get landing page content
    const landingContent = await cmsService.getLandingPageContent();
    console.log('Landing page content:', landingContent);
    
    // Try to get pricing plans
    const pricingPlans = await cmsService.getPricingPlans();
    console.log('Pricing plans:', pricingPlans);
    
  } catch (error) {
    console.error('CMS integration test failed:', error);
    console.log('This is expected if CMS is not properly configured yet.');
    console.log('The landing page will use fallback content.');
  }
};

testCMSIntegration();