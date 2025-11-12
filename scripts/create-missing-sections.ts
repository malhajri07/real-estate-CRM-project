import { prisma } from "../apps/api/prismaClient";

async function createMissingSections() {
  console.log("Creating missing CMS sections...");

  try {
    // Check existing sections
    const existing = await prisma.landingSection.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((s) => s.slug));
    console.log("Existing sections:", Array.from(existingSlugs));

    // Get the highest orderIndex
    const lastSection = await prisma.landingSection.findFirst({
      orderBy: { orderIndex: "desc" },
    });
    let orderIndex = (lastSection?.orderIndex ?? 0) + 1;

    // Create contact section if missing
    if (!existingSlugs.has("contact")) {
      const contactSection = await prisma.landingSection.create({
        data: {
          slug: "contact",
          title: "تواصل معنا",
          subtitle: "فريق عمل منصة عقاراتي جاهز دوماً للإجابة على استفساراتكم",
          layoutVariant: "custom",
          orderIndex: orderIndex++,
          visible: true,
          status: "draft",
          draftJson: {
            title: "تواصل معنا",
            subtitle: "فريق عمل منصة عقاراتي جاهز دوماً للإجابة على استفساراتكم",
            layoutVariant: "custom",
            visibility: true,
          },
          updatedBy: "system",
        },
      });

      // Create default contact cards
      const contactCards = [
        {
          title: "الهاتف",
          body: "+966 50 123 4567",
          icon: "phone",
        },
        {
          title: "البريد الإلكتروني",
          body: "info@aqarkom.com",
          icon: "mail",
        },
        {
          title: "العنوان",
          body: "الرياض، المملكة العربية السعودية",
          icon: "map-pin",
        },
      ];

      for (let i = 0; i < contactCards.length; i++) {
        const card = contactCards[i];
        await prisma.landingCard.create({
          data: {
            sectionId: contactSection.id,
            orderIndex: i,
            title: card.title,
            body: card.body,
            icon: card.icon,
            visible: true,
            status: "draft",
            draftJson: {
              title: card.title,
              body: card.body,
              icon: card.icon,
              type: card.icon,
              label: card.title,
              value: card.body,
              visibility: true,
            },
            updatedBy: "system",
          },
        });
      }

      console.log("✅ Contact section created!");
    } else {
      console.log("ℹ️ Contact section already exists");
    }

    // Create stats section if missing
    if (!existingSlugs.has("stats")) {
      const statsSection = await prisma.landingSection.create({
        data: {
          slug: "stats",
          title: "أرقامنا تتحدث",
          layoutVariant: "custom",
          orderIndex: orderIndex++,
          visible: true,
          status: "draft",
          draftJson: {
            title: "أرقامنا تتحدث",
            layoutVariant: "custom",
            visibility: true,
          },
          updatedBy: "system",
        },
      });

      // Create default stats cards
      const statsCards = [
        { value: "10,000+", label: "عميل راضٍ", suffix: "" },
        { value: "50,000+", label: "عقار تم بيعه", suffix: "" },
        { value: "99.8%", label: "وقت تشغيل النظام", suffix: "" },
        { value: "24/7", label: "دعم فني", suffix: "" },
      ];

      for (let i = 0; i < statsCards.length; i++) {
        const stat = statsCards[i];
        await prisma.landingCard.create({
          data: {
            sectionId: statsSection.id,
            orderIndex: i,
            title: stat.label,
            body: stat.value,
            visible: true,
            status: "draft",
            draftJson: {
              value: stat.value,
              label: stat.label,
              suffix: stat.suffix,
              visibility: true,
            },
            updatedBy: "system",
          },
        });
      }

      console.log("✅ Stats section created!");
    } else {
      console.log("ℹ️ Stats section already exists");
    }

    // Create footer section if missing
    if (!existingSlugs.has("footer")) {
      const footerSection = await prisma.landingSection.create({
        data: {
          slug: "footer",
          title: "تذييل الصفحة",
          layoutVariant: "custom",
          orderIndex: orderIndex++,
          visible: true,
          status: "draft",
          draftJson: {
            title: "تذييل الصفحة",
            body: "منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية",
            copyright: "© 2024 منصة عقاراتي. جميع الحقوق محفوظة.",
            layoutVariant: "custom",
            visibility: true,
          },
          updatedBy: "system",
        },
      });

      console.log("✅ Footer section created!");
    } else {
      console.log("ℹ️ Footer section already exists");
    }

    console.log("✅ All missing sections created!");
  } catch (error) {
    console.error("Error creating sections:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createMissingSections()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });

