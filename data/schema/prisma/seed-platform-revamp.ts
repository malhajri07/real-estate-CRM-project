import { PrismaClient, UserRole, BuyerRequestStatus } from "@prisma/client";
import { fakerAR } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Start seeding Platform Revamp data (Pool & Forum)...");

    // 1. Ensure we have some Agent Users
    const agents = await prisma.users.findMany({
        where: {
            roles: {
                contains: "AGENT",
            },
        },
        take: 5,
    });

    if (agents.length === 0) {
        console.log("⚠️ No agents found. Please seed users first.");
        return;
    }

    const agentIds = agents.map((u) => u.id);

    // 2. Seed Pool (Buyer Requests) - Open Requests for Agents to Claim
    console.log("💧 Seeding Pool (Buyer Requests)...");
    const cities = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca"];
    const types = ["Apartment", "Villa", "Land", "Office"];

    for (let i = 0; i < 20; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const type = types[Math.floor(Math.random() * types.length)];

        // Create OPEN requests (unclaimed)
        await prisma.buyer_requests.create({
            data: {
                createdByUserId: agentIds[0], // Created by system or admin ideally
                city: city,
                type: type,
                minBedrooms: Math.floor(Math.random() * 3) + 2,
                maxBedrooms: Math.floor(Math.random() * 2) + 4,
                minPrice: Math.floor(Math.random() * 500000) + 500000,
                maxPrice: Math.floor(Math.random() * 1000000) + 1500000,
                contactPreferences: "PHONE",
                status: BuyerRequestStatus.OPEN, // Available in Pool
                maskedContact: "+966 5X XXX XXXX",
                fullContactJson: JSON.stringify({ name: fakerAR.person.fullName(), phone: fakerAR.phone.number() }),
                multiAgentAllowed: true,
                notes: "looking for a modern property in a quiet neighborhood.",
            },
        });
    }

    // 3. Seed Forum (Community Posts) - Social Feed
    console.log("💬 Seeding Forum (Community Posts)...");

    const topics = [
        { type: "DISCUSSION", content: "ما هي أفضل الأحياء للاستثمار في شمال الرياض حالياً؟", tags: ["الرياض", "استثمار"] },
        { type: "DEAL", content: "فرصة عقارية: عمارة تجارية في حي الملقا، دخل 8% سنوي. للتواصل الخاص.", tags: ["فرصة", "تجاري", "الملقا"] },
        { type: "ALERT", content: "تنبيه: تحديثات جديدة في تنظيمات البناء للكود السعودي.", tags: ["تنبيه", "انظمة"] },
        { type: "DISCUSSION", content: "نصائح للمسوقين العقاريين المبتدئين.. كيف تبدأ؟", tags: ["نصائح", "تسويق"] },
        { type: "DEAL", content: "مطلوب بشكل عاجل: فيلا مودرن في حي النرجس بحدود 3 مليون.", tags: ["مطلوب", "فيلا", "النرجس"] },
    ];

    for (const topic of topics) {
        const authorId = agentIds[Math.floor(Math.random() * agentIds.length)];
        const post = await prisma.community_posts.create({
            data: {
                authorId: authorId,
                content: topic.content,
                type: topic.type,
                tags: topic.tags,
                likes: Math.floor(Math.random() * 50),
                isPinned: Math.random() < 0.2,
            },
        });

        // Add comments
        const numComments = Math.floor(Math.random() * 5);
        for (let j = 0; j < numComments; j++) {
            const commenterId = agentIds[Math.floor(Math.random() * agentIds.length)];
            await prisma.community_comments.create({
                data: {
                    postId: post.id,
                    authorId: commenterId,
                    content: "شكراً لك على هذه المشاركة القيمة!",
                },
            });
        }
    }

    console.log("✅ Platform Revamp Seeding Completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
