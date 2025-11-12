import { prisma } from "../apps/api/prismaClient";

async function createSolutionsSection() {
  console.log("Creating solutions section...");

  try {
    // Check if solutions section already exists
    const existing = await prisma.landingSection.findUnique({
      where: { slug: "solutions" },
    });

    if (existing) {
      console.log("Solutions section already exists!");
      return;
    }

    // Get the highest orderIndex to place solutions after it
    const lastSection = await prisma.landingSection.findFirst({
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = (lastSection?.orderIndex ?? 0) + 1;

    // Create solutions section
    const solutionsSection = await prisma.landingSection.create({
      data: {
        slug: "solutions",
        title: "حلول شاملة لإدارة العقارات",
        subtitle: "أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية",
        layoutVariant: "custom",
        orderIndex,
        visible: true,
        status: "draft",
        draftJson: {
          title: "حلول شاملة لإدارة العقارات",
          subtitle: "أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية",
          layoutVariant: "custom",
          visibility: true,
        },
        updatedBy: "system",
      },
    });

    console.log("Solutions section created:", solutionsSection.id);

    // Create default solution cards
    const defaultSolutions = [
      {
        title: "إدارة العملاء",
        description: "تابع علاقاتك مع العملاء المحتملين وعمليات التواصل في لوحة موحدة.",
        icon: "users",
        features: [
          { text: "قواعد بيانات للعملاء" },
          { text: "إشعارات ذكية للمتابعة" },
          { text: "تقارير تحليلية للأداء" },
        ],
      },
      {
        title: "إدارة العقارات",
        description: "إدارة كاملة للعقارات تشمل الوسائط والتسعير والتقارير التفصيلية.",
        icon: "building",
        features: [
          { text: "إدارة الوسائط والصور" },
          { text: "تفاصيل دقيقة للعقار" },
          { text: "مقارنة العروض والأسعار" },
        ],
      },
      {
        title: "إدارة الصفقات",
        description: "تابع مراحل الصفقات والمهام المتعلقة بها حتى إتمامها بنجاح.",
        icon: "git-branch",
        features: [
          { text: "لوحات متابعة للصفقات" },
          { text: "تنبيهات المهام القادمة" },
          { text: "تقارير الربحية والنمو" },
        ],
      },
    ];

    for (let i = 0; i < defaultSolutions.length; i++) {
      const solution = defaultSolutions[i];
      await prisma.landingCard.create({
        data: {
          sectionId: solutionsSection.id,
          orderIndex: i,
          title: solution.title,
          body: solution.description,
          icon: solution.icon,
          visible: true,
          status: "draft",
          draftJson: {
            title: solution.title,
            body: solution.description,
            icon: solution.icon,
            features: solution.features,
            visibility: true,
          },
          updatedBy: "system",
        },
      });
    }

    console.log("Default solution cards created!");
    console.log("✅ Solutions section setup complete!");
  } catch (error) {
    console.error("Error creating solutions section:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSolutionsSection()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });

