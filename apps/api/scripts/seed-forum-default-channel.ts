/**
 * Seed default "عام" (General) forum channel
 * Run: npx tsx apps/api/scripts/seed-forum-default-channel.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.forum_channels.findFirst({
    where: { nameAr: "عام" },
  });
  if (existing) {
    console.log("Default forum channel already exists.");
    return;
  }

  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { roles: { contains: "AGENT" } },
        { roles: { contains: "ADMIN" } },
      ],
    },
  });
  if (!user) {
    console.log("No agent/admin user found. Run db:agent1 first.");
    return;
  }

  await prisma.forum_channels.create({
    data: {
      nameAr: "عام",
      nameEn: "General",
      description: "المناقشات العامة",
      createdById: user.id,
      isPublic: true,
    },
  });
  console.log("Default forum channel created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
