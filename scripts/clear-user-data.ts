#!/usr/bin/env tsx

/**
 * clear-user-data.ts - Clear All User Access Details from Database
 * 
 * This script removes all user access details from the database including:
 * - All users and their authentication data
 * - User-related data (leads, properties, etc.)
 * - Audit logs and contact logs
 * - File assets owned by users
 * - Organizations and agent profiles
 * 
 * WARNING: This will permanently delete all user data!
 * Use with caution and ensure you have backups if needed.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllUserData() {
  console.log('🚨 WARNING: This will permanently delete ALL user data!');
  console.log('📋 The following data will be removed:');
  console.log('   - All users and authentication details');
  console.log('   - All organizations and agent profiles');
  console.log('   - All leads, properties, and listings');
  console.log('   - All buyer requests and seller submissions');
  console.log('   - All claims and contact logs');
  console.log('   - All audit logs');
  console.log('   - All file assets');
  console.log('   - All CMS content (landing page, pricing plans)');
  console.log('');

  try {
    console.log('🗑️  Starting database cleanup...');

    // Delete in order to respect foreign key constraints
    
    // 1. Delete file assets first (they reference users)
    console.log('📁 Deleting file assets...');
    const deletedFiles = await prisma.fileAsset.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFiles.count} file assets`);

    // 2. Delete audit logs
    console.log('📝 Deleting audit logs...');
    const deletedAuditLogs = await prisma.auditLog.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAuditLogs.count} audit logs`);

    // 3. Delete contact logs
    console.log('📞 Deleting contact logs...');
    const deletedContactLogs = await prisma.contactLog.deleteMany({});
    console.log(`   ✅ Deleted ${deletedContactLogs.count} contact logs`);

    // 4. Delete claims
    console.log('🎯 Deleting claims...');
    const deletedClaims = await prisma.claim.deleteMany({});
    console.log(`   ✅ Deleted ${deletedClaims.count} claims`);

    // 5. Delete leads
    console.log('🎣 Deleting leads...');
    const deletedLeads = await prisma.lead.deleteMany({});
    console.log(`   ✅ Deleted ${deletedLeads.count} leads`);

    // 6. Delete buyer requests
    console.log('🛒 Deleting buyer requests...');
    const deletedBuyerRequests = await prisma.buyerRequest.deleteMany({});
    console.log(`   ✅ Deleted ${deletedBuyerRequests.count} buyer requests`);

    // 7. Delete seller submissions
    console.log('🏠 Deleting seller submissions...');
    const deletedSellerSubmissions = await prisma.sellerSubmission.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSellerSubmissions.count} seller submissions`);

    // 8. Delete listings
    console.log('📋 Deleting listings...');
    const deletedListings = await prisma.listing.deleteMany({});
    console.log(`   ✅ Deleted ${deletedListings.count} listings`);

    // 9. Delete properties
    console.log('🏘️  Deleting properties...');
    const deletedProperties = await prisma.property.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProperties.count} properties`);

    // 10. Delete agent profiles
    console.log('👨‍💼 Deleting agent profiles...');
    const deletedAgentProfiles = await prisma.agentProfile.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAgentProfiles.count} agent profiles`);

    // 11. Delete organizations
    console.log('🏢 Deleting organizations...');
    const deletedOrganizations = await prisma.organization.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrganizations.count} organizations`);

    // 12. Delete users (this will also delete any remaining user-related data)
    console.log('👤 Deleting users...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUsers.count} users`);

    // 13. Delete CMS content
    console.log('📄 Deleting CMS content...');
    
    // Delete pricing plan features first
    const deletedPricingFeatures = await prisma.pricingPlanFeature.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPricingFeatures.count} pricing plan features`);
    
    // Delete pricing plans
    const deletedPricingPlans = await prisma.pricingPlan.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPricingPlans.count} pricing plans`);

    // Delete landing page content and related data
    const deletedNavigation = await prisma.landingPageNavigation.deleteMany({});
    console.log(`   ✅ Deleted ${deletedNavigation.count} navigation items`);
    
    const deletedFooterLinks = await prisma.landingPageFooterLink.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFooterLinks.count} footer links`);
    
    const deletedContactInfo = await prisma.landingPageContactInfo.deleteMany({});
    console.log(`   ✅ Deleted ${deletedContactInfo.count} contact info items`);
    
    const deletedHeroMetrics = await prisma.landingPageHeroMetric.deleteMany({});
    console.log(`   ✅ Deleted ${deletedHeroMetrics.count} hero metrics`);
    
    const deletedSolutionFeatures = await prisma.landingPageSolutionFeature.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSolutionFeatures.count} solution features`);
    
    const deletedSolutions = await prisma.landingPageSolution.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSolutions.count} solutions`);
    
    const deletedStats = await prisma.landingPageStat.deleteMany({});
    console.log(`   ✅ Deleted ${deletedStats.count} stats`);
    
    const deletedFeatures = await prisma.landingPageFeature.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFeatures.count} features`);
    
    const deletedLandingContent = await prisma.landingPageContent.deleteMany({});
    console.log(`   ✅ Deleted ${deletedLandingContent.count} landing page content`);

    console.log('');
    console.log('✅ Database cleanup completed successfully!');
    console.log('');
    console.log('📊 Summary of deleted data:');
    console.log(`   👤 Users: ${deletedUsers.count}`);
    console.log(`   🏢 Organizations: ${deletedOrganizations.count}`);
    console.log(`   👨‍💼 Agent Profiles: ${deletedAgentProfiles.count}`);
    console.log(`   🏘️  Properties: ${deletedProperties.count}`);
    console.log(`   📋 Listings: ${deletedListings.count}`);
    console.log(`   🎣 Leads: ${deletedLeads.count}`);
    console.log(`   🛒 Buyer Requests: ${deletedBuyerRequests.count}`);
    console.log(`   🏠 Seller Submissions: ${deletedSellerSubmissions.count}`);
    console.log(`   🎯 Claims: ${deletedClaims.count}`);
    console.log(`   📞 Contact Logs: ${deletedContactLogs.count}`);
    console.log(`   📝 Audit Logs: ${deletedAuditLogs.count}`);
    console.log(`   📁 File Assets: ${deletedFiles.count}`);
    console.log(`   📄 CMS Content: ${deletedLandingContent.count + deletedPricingPlans.count}`);
    console.log('');
    console.log('🎉 All user access details have been removed from the database!');
    console.log('💡 You can now start fresh with new user data.');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearAllUserData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

export default clearAllUserData;
