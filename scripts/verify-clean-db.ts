#!/usr/bin/env tsx

/**
 * verify-clean-db.ts - Verify Database is Clean
 * 
 * This script verifies that all user data has been removed from the database.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanDatabase() {
  console.log('🔍 Verifying database is clean...');
  console.log('');

  try {
    // Check all tables for remaining data
    const counts = {
      users: await prisma.user.count(),
      organizations: await prisma.organization.count(),
      agentProfiles: await prisma.agentProfile.count(),
      properties: await prisma.property.count(),
      listings: await prisma.listing.count(),
      leads: await prisma.lead.count(),
      buyerRequests: await prisma.buyerRequest.count(),
      sellerSubmissions: await prisma.sellerSubmission.count(),
      claims: await prisma.claim.count(),
      contactLogs: await prisma.contactLog.count(),
      auditLogs: await prisma.auditLog.count(),
      fileAssets: await prisma.fileAsset.count(),
      landingPageContent: await prisma.landingPageContent.count(),
      pricingPlans: await prisma.pricingPlan.count(),
    };

    console.log('📊 Current database counts:');
    console.log(`   👤 Users: ${counts.users}`);
    console.log(`   🏢 Organizations: ${counts.organizations}`);
    console.log(`   👨‍💼 Agent Profiles: ${counts.agentProfiles}`);
    console.log(`   🏘️  Properties: ${counts.properties}`);
    console.log(`   📋 Listings: ${counts.listings}`);
    console.log(`   🎣 Leads: ${counts.leads}`);
    console.log(`   🛒 Buyer Requests: ${counts.buyerRequests}`);
    console.log(`   🏠 Seller Submissions: ${counts.sellerSubmissions}`);
    console.log(`   🎯 Claims: ${counts.claims}`);
    console.log(`   📞 Contact Logs: ${counts.contactLogs}`);
    console.log(`   📝 Audit Logs: ${counts.auditLogs}`);
    console.log(`   📁 File Assets: ${counts.fileAssets}`);
    console.log(`   📄 Landing Page Content: ${counts.landingPageContent}`);
    console.log(`   💰 Pricing Plans: ${counts.pricingPlans}`);
    console.log('');

    // Check if database is clean
    const totalUserData = counts.users + counts.organizations + counts.agentProfiles + 
                         counts.properties + counts.listings + counts.leads + 
                         counts.buyerRequests + counts.sellerSubmissions + counts.claims + 
                         counts.contactLogs + counts.auditLogs + counts.fileAssets;

    if (totalUserData === 0) {
      console.log('✅ Database is completely clean!');
      console.log('🎉 All user access details have been successfully removed.');
    } else {
      console.log('⚠️  Database still contains some user data:');
      console.log(`   Total user-related records: ${totalUserData}`);
    }

    // Check if CMS content remains (this is optional to keep)
    const totalCmsData = counts.landingPageContent + counts.pricingPlans;
    if (totalCmsData > 0) {
      console.log(`ℹ️  CMS content remains: ${totalCmsData} records (this is optional)`);
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyCleanDatabase()
  .then(() => {
    console.log('✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });




