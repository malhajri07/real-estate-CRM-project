/**
 * add-sample-images.ts - Sample Images Script
 * 
 * Location: apps/api/ → Scripts/ → add-sample-images.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Sample images script. Provides:
 * - Sample image URL seeding
 * - Property image assignment
 * 
 * Related Files:
 * - apps/api/lib/seeds/domain.ts - Domain seed data
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sample image URLs from Unsplash organized by property type
const photoSets: Record<string, string[]> = {
  شقة: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    "https://images.unsplash.com/photo-1615873968403-89e068629265",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
    "https://images.unsplash.com/photo-1571055107559-3e67626fa8be"
  ],
  فيلا: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
    "https://images.unsplash.com/photo-1505843513577-22bb7d21e455",
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83"
  ],
  استوديو: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    "https://images.unsplash.com/photo-1571055107734-8d7a8b29c30c",
    "https://images.unsplash.com/photo-1594736797933-d0f06b755b8f",
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7"
  ],
  منزل: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
    "https://images.unsplash.com/photo-1628744448840-55bdb2497bd0",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    "https://images.unsplash.com/photo-1560440021-33f9b867899d"
  ],
  أرض: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    "https://images.unsplash.com/photo-1549517045-bc93de075e53",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136",
    "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a",
    "https://images.unsplash.com/photo-1589834390005-5d4fb9bf3d32"
  ],
  default: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6"
  ]
};

function getRandomImages(propertyType: string | null | undefined, count: number = 3): string[] {
  const type = propertyType || "default";
  const photos = photoSets[type] || photoSets.default;
  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, photos.length));
}

function hasImages(property: any): boolean {
  if (property.photos) {
    try {
      const parsed = typeof property.photos === 'string' ? JSON.parse(property.photos) : property.photos;
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }
  return false;
}

async function addSampleImages() {
  console.log("🖼️  Starting to add sample images to properties...");

  try {
    // Fetch all properties
    const allProperties = await prisma.properties.findMany({
      select: {
        id: true,
        type: true,
        photos: true,
      },
    });

    console.log(`Found ${allProperties.length} total properties`);

    // Filter properties that need images
    const propertiesNeedingImages = allProperties.filter((property) => {
      if (!property.photos) return true;
      if (property.photos === "") return true;
      try {
        const parsed = typeof property.photos === 'string' ? JSON.parse(property.photos) : property.photos;
        return !Array.isArray(parsed) || parsed.length === 0;
      } catch {
        return true; // If parsing fails, treat as needing images
      }
    });

    console.log(`Found ${propertiesNeedingImages.length} properties without images`);

    // If no properties need images, add images to all properties for testing
    const propertiesToUpdate = propertiesNeedingImages.length > 0 
      ? propertiesNeedingImages 
      : allProperties.slice(0, 20); // Update first 20 for testing

    if (propertiesNeedingImages.length === 0 && allProperties.length > 0) {
      console.log("All properties already have images. Adding/updating images for first 20 properties for testing...");
    }

    let updated = 0;
    for (const property of propertiesToUpdate) {
      const images = getRandomImages(property.type, 3);
      const photosJson = JSON.stringify(images);

      await prisma.properties.update({
        where: { id: property.id },
        data: { photos: photosJson },
      });

      updated++;
      if (updated % 10 === 0) {
        console.log(`✅ Updated ${updated} properties...`);
      }
    }

    console.log(`\n✨ Successfully added/updated images for ${updated} properties!`);
  } catch (error) {
    console.error("❌ Error adding sample images:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleImages()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

