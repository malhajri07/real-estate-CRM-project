// @ts-nocheck
import { OrganizationStatus, AgentStatus, PropertyStatus, ListingType, ListingStatus, BuyerRequestStatus, SellerSubmissionStatus, LeadStatus, ClaimStatus, ContactChannel } from '@prisma/client';

// Define UserRole enum locally since it's not exported from Prisma client
enum UserRole {
  WEBSITE_ADMIN = 'WEBSITE_ADMIN',
  CORP_OWNER = 'CORP_OWNER',
  CORP_AGENT = 'CORP_AGENT',
  INDIV_AGENT = 'INDIV_AGENT',
  SELLER = 'SELLER',
  BUYER = 'BUYER'
}
import { hashPassword } from './auth';
import { prisma } from './prismaClient';

// Saudi cities and districts
const SAUDI_CITIES = [
  { name: 'الرياض', districts: ['الملقا', 'النخيل', 'العليا', 'الملز', 'الروضة'] },
  { name: 'جدة', districts: ['البحر الأحمر', 'الزهراء', 'الروابي', 'السلامة', 'الفيصلية'] },
  { name: 'الدمام', districts: ['الخليج', 'الفيصلية', 'الروضة', 'المنطقة الصناعية', 'الخبر'] },
  { name: 'مكة', districts: ['العزيزية', 'الزاهر', 'المنصور', 'الجموم', 'الطائف'] },
  { name: 'المدينة', districts: ['العوالي', 'المناخة', 'الخالدية', 'السلامة', 'النهضة'] },
  { name: 'الخبر', districts: ['الخليج', 'الفيصلية', 'الروضة', 'المنطقة الصناعية', 'الدمام'] },
  { name: 'الطائف', districts: ['الهدا', 'الشفا', 'الروضة', 'الفيصلية', 'السلامة'] }
];

const PROPERTY_TYPES = ['شقة', 'فيلا', 'دوبلكس', 'تاون هاوس', 'استوديو', 'بنتهاوس', 'شقة مفروشة'];
const PROPERTY_CATEGORIES = ['سكني', 'تجاري', 'استثماري'];

// Arabic names for realistic data
const ARABIC_FIRST_NAMES = [
  'محمد', 'أحمد', 'عبدالله', 'عبدالرحمن', 'خالد', 'سعد', 'فهد', 'عبدالعزيز',
  'فاطمة', 'عائشة', 'خديجة', 'مريم', 'نورا', 'سارة', 'هند', 'ريم'
];

const ARABIC_LAST_NAMES = [
  'العتيبي', 'الغامدي', 'الحربي', 'الزهراني', 'القرني', 'المطيري', 'الرشيد', 'السعيد',
  'الخالدي', 'المالكي', 'النجدي', 'الحجازي', 'النجار', 'الحداد', 'الخياط', 'النجار'
];

async function main() {
  console.log('🌱 Starting RBAC seed...');

  // Clear existing data
  await prisma.audit_logs.deleteMany();
  await prisma.contact_logs.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.sellerSubmission.deleteMany();
  await prisma.buyerRequest.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.properties.deleteMany();
  await prisma.agent_profiles.deleteMany();
  await prisma.users.deleteMany();
  await prisma.organizations.deleteMany();

  console.log('✅ Cleared existing data');

  // Create organizations
  const organizations = await Promise.all([
    prisma.organizations.create({
      data: {
        legalName: 'شركة الرياض العقارية المحدودة',
        tradeName: 'الرياض العقارية',
        licenseNo: 'CR-1010123456',
        status: OrganizationStatus.ACTIVE,
        address: 'شارع الملك فهد، الرياض',
        phone: '0501234567',
        email: 'info@riyadh-realestate.com',
        website: 'https://riyadh-realestate.com'
      }
    }),
    prisma.organizations.create({
      data: {
        legalName: 'مجموعة جدة الاستثمارية',
        tradeName: 'جدة الاستثمارية',
        licenseNo: 'CR-2010123456',
        status: OrganizationStatus.ACTIVE,
        address: 'شارع التحلية، جدة',
        phone: '0502345678',
        email: 'info@jeddah-investment.com',
        website: 'https://jeddah-investment.com'
      }
    })
  ]);

  console.log('✅ Created organizations');

  // Create users with different roles
  const users = await Promise.all([
    // Website Admin
    prisma.users.create({
      data: {
        username: 'admin',
        email: 'admin@aqaraty.com',
        passwordHash: await hashPassword('admin123'),
        firstName: 'أحمد',
        lastName: 'المدير',
        phone: '0501234567',
        roles: JSON.stringify([UserRole.WEBSITE_ADMIN]),
        isActive: true
      }
    }),
    // Corporate Owners
    prisma.users.create({
      data: {
        username: 'owner1',
        email: 'owner1@riyadh-realestate.com',
        passwordHash: await hashPassword('owner123'),
        firstName: 'خالد',
        lastName: 'العتيبي',
        phone: '0502345678',
        roles: JSON.stringify([UserRole.CORP_OWNER]),
        organizationId: organizations[0].id,
        isActive: true
      }
    }),
    prisma.users.create({
      data: {
        username: 'owner2',
        email: 'owner2@jeddah-investment.com',
        passwordHash: await hashPassword('owner123'),
        firstName: 'سعد',
        lastName: 'الغامدي',
        phone: '0503456789',
        roles: JSON.stringify([UserRole.CORP_OWNER]),
        organizationId: organizations[1].id,
        isActive: true
      }
    }),
    // Corporate Agents
    prisma.users.create({
      data: {
        username: 'agent1',
        email: 'agent1@riyadh-realestate.com',
        passwordHash: await hashPassword('agent123'),
        firstName: 'فهد',
        lastName: 'الحربي',
        phone: '0504567890',
        roles: JSON.stringify([UserRole.CORP_AGENT]),
        organizationId: organizations[0].id,
        isActive: true
      }
    }),
    prisma.users.create({
      data: {
        username: 'agent2',
        email: 'agent2@riyadh-realestate.com',
        passwordHash: await hashPassword('agent123'),
        firstName: 'عبدالرحمن',
        lastName: 'الزهراني',
        phone: '0505678901',
        roles: JSON.stringify([UserRole.CORP_AGENT]),
        organizationId: organizations[0].id,
        isActive: true
      }
    }),
    prisma.users.create({
      data: {
        username: 'agent3',
        email: 'agent3@jeddah-investment.com',
        passwordHash: await hashPassword('agent123'),
        firstName: 'عبدالعزيز',
        lastName: 'القرني',
        phone: '0506789012',
        roles: JSON.stringify([UserRole.CORP_AGENT]),
        organizationId: organizations[1].id,
        isActive: true
      }
    }),
    // Individual Agents
    prisma.users.create({
      data: {
        username: 'indiv1',
        email: 'indiv1@example.com',
        passwordHash: await hashPassword('agent123'),
        firstName: 'محمد',
        lastName: 'المطيري',
        phone: '0507890123',
        roles: JSON.stringify([UserRole.INDIV_AGENT]),
        isActive: true
      }
    }),
    prisma.users.create({
      data: {
        username: 'indiv2',
        email: 'indiv2@example.com',
        passwordHash: await hashPassword('agent123'),
        firstName: 'عبدالله',
        lastName: 'الرشيد',
        phone: '0508901234',
        roles: JSON.stringify([UserRole.INDIV_AGENT]),
        isActive: true
      }
    }),
    // Sellers
    prisma.users.create({
      data: {
        username: 'seller1',
        email: 'seller1@example.com',
        passwordHash: await hashPassword('seller123'),
        firstName: 'فاطمة',
        lastName: 'السعيد',
        phone: '0509012345',
        roles: JSON.stringify([UserRole.SELLER]),
        isActive: true
      }
    }),
    prisma.users.create({
      data: {
        username: 'seller2',
        email: 'seller2@example.com',
        passwordHash: await hashPassword('seller123'),
        firstName: 'عائشة',
        lastName: 'الخالدي',
        phone: '0500123456',
        roles: JSON.stringify([UserRole.SELLER]),
        isActive: true
      }
    }),
    // Buyers
    prisma.users.create({
      data: {
        username: 'buyer1',
        email: 'buyer1@example.com',
        passwordHash: await hashPassword('buyer123'),
        firstName: 'خديجة',
        lastName: 'المالكي',
        phone: '0501234568',
        roles: JSON.stringify([UserRole.BUYER]),
        isActive: true
      }
    }),
    prisma.users.create({
      data: {
        username: 'buyer2',
        email: 'buyer2@example.com',
        passwordHash: await hashPassword('buyer123'),
        firstName: 'مريم',
        lastName: 'النجدي',
        phone: '0502345679',
        roles: JSON.stringify([UserRole.BUYER]),
        isActive: true
      }
    })
  ]);

  console.log('✅ Created users');

  // Create agent profiles
  const agentProfiles = await Promise.all([
    // Corporate agents
    prisma.agent_profiles.create({
      data: {
        userId: users[3].id, // agent1@riyadh-realestate.com
        organizationId: organizations[0].id,
        licenseNo: 'RE-001-2024',
        licenseValidTo: new Date('2025-12-31'),
        territories: JSON.stringify(['الرياض', 'الملقا', 'النخيل']),
        isIndividualAgent: false,
        status: AgentStatus.ACTIVE,
        specialties: JSON.stringify(['شقة', 'فيلا']),
        experience: 5,
        bio: 'متخصص في العقارات السكنية في الرياض'
      }
    }),
    prisma.agent_profiles.create({
      data: {
        userId: users[4].id, // agent2@riyadh-realestate.com
        organizationId: organizations[0].id,
        licenseNo: 'RE-002-2024',
        licenseValidTo: new Date('2025-12-31'),
        territories: JSON.stringify(['الرياض', 'العليا', 'الملز']),
        isIndividualAgent: false,
        status: AgentStatus.ACTIVE,
        specialties: JSON.stringify(['دوبلكس', 'تاون هاوس']),
        experience: 3,
        bio: 'متخصص في العقارات السكنية المتوسطة'
      }
    }),
    prisma.agent_profiles.create({
      data: {
        userId: users[5].id, // agent3@jeddah-investment.com
        organizationId: organizations[1].id,
        licenseNo: 'RE-003-2024',
        licenseValidTo: new Date('2025-12-31'),
        territories: JSON.stringify(['جدة', 'البحر الأحمر', 'الزهراء']),
        isIndividualAgent: false,
        status: AgentStatus.ACTIVE,
        specialties: JSON.stringify(['فيلا', 'بنتهاوس']),
        experience: 7,
        bio: 'متخصص في العقارات الفاخرة في جدة'
      }
    }),
    // Individual agents
    prisma.agent_profiles.create({
      data: {
        userId: users[6].id, // indiv1@example.com
        licenseNo: 'RE-004-2024',
        licenseValidTo: new Date('2025-12-31'),
        territories: JSON.stringify(['الدمام', 'الخبر']),
        isIndividualAgent: true,
        status: AgentStatus.ACTIVE,
        specialties: JSON.stringify(['شقة', 'استوديو']),
        experience: 4,
        bio: 'وكيل عقاري مستقل في المنطقة الشرقية'
      }
    }),
    prisma.agent_profiles.create({
      data: {
        userId: users[7].id, // indiv2@example.com
        licenseNo: 'RE-005-2024',
        licenseValidTo: new Date('2025-12-31'),
        territories: JSON.stringify(['مكة', 'الطائف']),
        isIndividualAgent: true,
        status: AgentStatus.ACTIVE,
        specialties: JSON.stringify(['شقة مفروشة', 'استراحة']),
        experience: 6,
        bio: 'متخصص في العقارات السياحية في مكة والطائف'
      }
    })
  ]);

  console.log('✅ Created agent profiles');

  // Create properties
  const properties = [];
  const agents = [users[3], users[4], users[5], users[6], users[7]]; // Agent users

  for (let i = 0; i < 50; i++) {
    const city = SAUDI_CITIES[Math.floor(Math.random() * SAUDI_CITIES.length)];
    const district = city.districts[Math.floor(Math.random() * city.districts.length)];
    const type = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
    const category = PROPERTY_CATEGORIES[Math.floor(Math.random() * PROPERTY_CATEGORIES.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    
    const property = await prisma.properties.create({
      data: {
        agentId: agent.id,
        organizationId: agent.organizationId,
        title: `${type} في ${district}`,
        description: `${type} جميلة في ${district}، ${city.name}، مع جميع المرافق والخدمات`,
        type,
        category,
        city: city.name,
        district,
        address: `شارع ${Math.floor(Math.random() * 100) + 1}، ${district}، ${city.name}`,
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 4) + 1,
        areaSqm: Math.floor(Math.random() * 300) + 50,
        price: Math.floor(Math.random() * 2000000) + 200000,
        status: PropertyStatus.ACTIVE,
        visibility: 'public',
        latitude: 24.7 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6 + (Math.random() - 0.5) * 0.1,
        features: JSON.stringify(['تكييف', 'أثاث', 'موقف سيارات', 'مصعد', 'حارس']),
        photos: JSON.stringify([
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
          'https://example.com/photo3.jpg'
        ])
      }
    });
    
    properties.push(property);
  }

  console.log('✅ Created properties');

  // Create listings
  for (const property of properties) {
    await prisma.listing.create({
      data: {
        propertyId: property.id,
        agentId: property.agentId,
        organizationId: property.organizationId,
        listingType: Math.random() > 0.5 ? ListingType.SALE : ListingType.RENT,
        exclusive: Math.random() > 0.7,
        publishedAt: new Date(),
        status: ListingStatus.ACTIVE,
        price: property.price,
        description: property.description
      }
    });
  }

  console.log('✅ Created listings');

  // Create buyer requests
  const buyers = [users[10], users[11]]; // Buyer users
  
  for (let i = 0; i < 30; i++) {
    const city = SAUDI_CITIES[Math.floor(Math.random() * SAUDI_CITIES.length)];
    const type = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
    const buyer = buyers[Math.floor(Math.random() * buyers.length)];
    
    await prisma.buyerRequest.create({
      data: {
        createdByUserId: buyer.id,
        city: city.name,
        type,
        minBedrooms: Math.floor(Math.random() * 3) + 1,
        maxBedrooms: Math.floor(Math.random() * 5) + 3,
        minPrice: Math.floor(Math.random() * 500000) + 100000,
        maxPrice: Math.floor(Math.random() * 2000000) + 500000,
        contactPreferences: JSON.stringify({
          channels: ['PHONE', 'WHATSAPP'],
          timeWindows: ['9:00-24:00'],
          preferredLanguage: 'ar'
        }),
        status: BuyerRequestStatus.OPEN,
        maskedContact: JSON.stringify({
          phone: `05**-***-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `u***@example.com`
        }),
        fullContactJson: JSON.stringify({
          phone: buyer.phone,
          email: buyer.email,
          firstName: buyer.firstName,
          lastName: buyer.lastName
        }),
        multiAgentAllowed: Math.random() > 0.5,
        notes: `أبحث عن ${type} في ${city.name}`
      }
    });
  }

  console.log('✅ Created buyer requests');

  // Create seller submissions
  const sellers = [users[8], users[9]]; // Seller users
  
  for (let i = 0; i < 15; i++) {
    const city = SAUDI_CITIES[Math.floor(Math.random() * SAUDI_CITIES.length)];
    const type = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
    const seller = sellers[Math.floor(Math.random() * sellers.length)];
    
    await prisma.sellerSubmission.create({
      data: {
        createdByUserId: seller.id,
        city: city.name,
        type,
        bedrooms: Math.floor(Math.random() * 5) + 1,
        priceExpectation: Math.floor(Math.random() * 2000000) + 200000,
        exclusivePreference: Math.random() > 0.6,
        status: SellerSubmissionStatus.OPEN,
        maskedContact: JSON.stringify({
          phone: `05**-***-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `s***@example.com`
        }),
        fullContactJson: JSON.stringify({
          phone: seller.phone,
          email: seller.email,
          firstName: seller.firstName,
          lastName: seller.lastName
        }),
        notes: `أريد بيع ${type} في ${city.name}`
      }
    });
  }

  console.log('✅ Created seller submissions');

  // Create some claims and leads
  const buyerRequests = await prisma.buyerRequest.findMany({
    where: { status: BuyerRequestStatus.OPEN },
    take: 10
  });

  for (let i = 0; i < 5; i++) {
    const buyerRequest = buyerRequests[i];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    
    // Create claim
    const claim = await prisma.claim.create({
      data: {
        agentId: agent.id,
        buyerRequestId: buyerRequest.id,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        status: ClaimStatus.ACTIVE,
        notes: 'متابعة العميل'
      }
    });

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        agentId: agent.id,
        buyerRequestId: buyerRequest.id,
        status: LeadStatus.NEW
      }
    });

    // Create contact log
    await prisma.contactLog.create({
      data: {
        leadId: lead.id,
        agentId: agent.id,
        note: 'تم الاتصال بالعميل وتم تحديد موعد للزيارة',
        channel: ContactChannel.PHONE,
        contactedAt: new Date()
      }
    });

    // Update buyer request status
    await prisma.buyerRequest.update({
      where: { id: buyerRequest.id },
      data: { status: BuyerRequestStatus.CLAIMED }
    });
  }

  console.log('✅ Created claims and leads');

  // Create audit logs
  for (let i = 0; i < 20; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'CLAIM', 'RELEASE'];
    const entities = ['PROPERTY', 'BUYER_REQUEST', 'CLAIM', 'LEAD'];
    
    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: actions[Math.floor(Math.random() * actions.length)],
        entity: entities[Math.floor(Math.random() * entities.length)],
        entityId: `entity-${i}`,
        beforeJson: JSON.stringify({ oldValue: 'previous value' }),
        afterJson: JSON.stringify({ newValue: 'updated value' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }

  console.log('✅ Created audit logs');

  console.log('🎉 RBAC seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- ${organizations.length} organizations`);
  console.log(`- ${users.length} users`);
  console.log(`- ${agentProfiles.length} agent profiles`);
  console.log(`- ${properties.length} properties`);
  console.log(`- ${await prisma.listing.count()} listings`);
  console.log(`- ${await prisma.buyerRequest.count()} buyer requests`);
  console.log(`- ${await prisma.sellerSubmission.count()} seller submissions`);
  console.log(`- ${await prisma.claim.count()} claims`);
  console.log(`- ${await prisma.lead.count()} leads`);
  console.log(`- ${await prisma.contact_logs.count()} contact logs`);
  console.log(`- ${await prisma.audit_logs.count()} audit logs`);

  console.log('\n🔑 Test Accounts:');
  console.log('Website Admin: admin@aqaraty.com / admin123');
  console.log('Corporate Owner: owner1@riyadh-realestate.com / owner123');
  console.log('Corporate Agent: agent1@riyadh-realestate.com / agent123');
  console.log('Individual Agent: indiv1@example.com / agent123');
  console.log('Seller: seller1@example.com / seller123');
  console.log('Buyer: buyer1@example.com / buyer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
