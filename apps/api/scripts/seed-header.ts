
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for 'header' section...");

    const existing = await prisma.landingSection.findUnique({
        where: { slug: "header" },
    });

    if (existing) {
        console.log("'header' section already exists.");
        return;
    }

    console.log("Creating 'header' section...");

    await prisma.landingSection.create({
        data: {
            slug: "header",
            title: "Header Settings",
            subtitle: "Global header configuration",
            layoutVariant: "custom",
            orderIndex: 0,
            visible: true,
            status: "published",
            draftJson: {
                siteName: "عقاركم",
                logo: { url: "", alt: "عقاركم" }
            },
            publishedJson: {
                siteName: "عقاركم",
                logo: { url: "", alt: "عقاركم" }
            },
            version: 1,
            updatedBy: "system",
            publishedBy: "system",
            publishedAt: new Date(),
        },
    });

    console.log("'header' section created successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
