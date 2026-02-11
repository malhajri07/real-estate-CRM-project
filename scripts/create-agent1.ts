import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createAgent1() {
  try {
    console.log('🔍 Checking for agent1 user...');
    
    // Check if agent1 user exists
    const existingUser = await prisma.users.findUnique({
      where: { username: 'agent1' },
      include: { agent_profiles: true }
    });

    if (existingUser) {
      console.log('⚠️  agent1 user already exists:', {
        id: existingUser.id,
        username: existingUser.username,
        roles: existingUser.roles,
        isActive: existingUser.isActive,
        hasAgentProfile: !!existingUser.agent_profiles
      });
      
      // Update password if needed
      const passwordMatch = await bcrypt.compare('123456', existingUser.passwordHash);
      if (!passwordMatch) {
        console.log('🔄 Updating password...');
        const hashedPassword = await bcrypt.hash('123456', 10);
        await prisma.users.update({
          where: { username: 'agent1' },
          data: { passwordHash: hashedPassword }
        });
        console.log('✅ Password updated successfully');
      }

      // Check if agent profile exists
      if (!existingUser.agent_profiles) {
        console.log('⚠️  User exists but no agent profile found. Creating agent profile...');
        const agentProfile = await prisma.agent_profiles.create({
          data: {
            id: randomUUID(),
            userId: existingUser.id,
            licenseNo: `LIC-${existingUser.id.substring(0, 8).toUpperCase()}`,
            licenseValidTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            territories: 'الرياض',
            isIndividualAgent: true,
            status: 'ACTIVE',
            specialties: 'عقارات سكنية'
          }
        });
        console.log('✅ Agent profile created:', {
          id: agentProfile.id,
          licenseNo: agentProfile.licenseNo,
          isIndividualAgent: agentProfile.isIndividualAgent
        });
      }

      // Update roles if needed
      const currentRoles = JSON.parse(existingUser.roles);
      if (!currentRoles.includes('INDIV_AGENT')) {
        console.log('🔄 Updating roles to include INDIV_AGENT...');
        const updatedRoles = [...new Set([...currentRoles, 'INDIV_AGENT'])];
        await prisma.users.update({
          where: { username: 'agent1' },
          data: { roles: JSON.stringify(updatedRoles) }
        });
        console.log('✅ Roles updated:', updatedRoles);
      }

      console.log('\n✅ agent1 user is ready!');
      return;
    }

    console.log('📝 Creating new agent1 user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Create user
    const newUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        username: 'agent1',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['INDIV_AGENT']),
        isActive: true,
        email: 'agent1@example.com',
        firstName: 'Agent',
        lastName: 'One',
        approvalStatus: 'APPROVED',
        updatedAt: new Date()
      }
    });
    
    console.log('✅ User created successfully:', {
      id: newUser.id,
      username: newUser.username,
      roles: newUser.roles
    });

    // Create agent profile
    const agentProfile = await prisma.agent_profiles.create({
      data: {
        id: randomUUID(),
        userId: newUser.id,
        licenseNo: `LIC-${newUser.id.substring(0, 8).toUpperCase()}`,
        licenseValidTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        territories: 'الرياض',
        isIndividualAgent: true,
        status: 'ACTIVE',
        specialties: 'عقارات سكنية'
      }
    });

    console.log('✅ Agent profile created:', {
      id: agentProfile.id,
      licenseNo: agentProfile.licenseNo,
      isIndividualAgent: agentProfile.isIndividualAgent,
      status: agentProfile.status
    });

    console.log('\n✅ agent1 user created successfully!');
    console.log('\n📋 User Details:');
    console.log(`  Username: agent1`);
    console.log(`  Password: 123456`);
    console.log(`  Role: INDIV_AGENT`);
    console.log(`  Email: ${newUser.email}`);
    console.log(`  Name: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`  License No: ${agentProfile.licenseNo}`);
    console.log(`  Status: ${agentProfile.status}`);

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAgent1()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
