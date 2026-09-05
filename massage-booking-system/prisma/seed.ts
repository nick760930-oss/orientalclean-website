import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin1234";

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "店長",
    },
  });

  const serviceSeeds = [
    {
      name: "全身按摩 60 分鐘",
      durationMin: 60,
      priceTwd: 1200,
      depositTwd: 300,
      description: "舒緩全身肌肉緊繃，適合日常放鬆保養。",
    },
    {
      name: "全身按摩 90 分鐘",
      durationMin: 90,
      priceTwd: 1680,
      depositTwd: 300,
      description: "深層放鬆加強版，涵蓋肩頸腰背全身部位。",
    },
    {
      name: "腳底按摩 40 分鐘",
      durationMin: 40,
      priceTwd: 800,
      depositTwd: 0,
      description: "針對足部反射區加強按壓，促進循環代謝。",
    },
    {
      name: "肩頸紓壓 30 分鐘",
      durationMin: 30,
      priceTwd: 600,
      depositTwd: 0,
      description: "久坐久站族群專屬，快速緩解肩頸痠痛。",
    },
  ];

  const services = [];
  for (let i = 0; i < serviceSeeds.length; i++) {
    const id = `seed-service-${i}`;
    services.push(
      await prisma.service.upsert({
        where: { id },
        update: {},
        create: { id, sortOrder: i, ...serviceSeeds[i] },
      })
    );
  }

  const therapistSeeds = [
    { name: "小美 老師", bio: "10 年經驗，擅長全身按摩與腳底按摩。" },
    { name: "阿明 老師", bio: "擅長肩頸紓壓與深層按摩。" },
    { name: "包廂 A", bio: "雙人按摩包廂（以包廂做為可預約資源）。" },
  ];

  const therapists = [];
  for (let i = 0; i < therapistSeeds.length; i++) {
    const id = `seed-therapist-${i}`;
    therapists.push(
      await prisma.therapist.upsert({
        where: { id },
        update: {},
        create: { id, sortOrder: i, ...therapistSeeds[i] },
      })
    );
  }

  // 小美 & 阿明 can perform every service; the room can only host the two full-body massages.
  for (const therapist of [therapists[0], therapists[1]]) {
    for (const service of services) {
      await prisma.therapistService.upsert({
        where: { therapistId_serviceId: { therapistId: therapist.id, serviceId: service.id } },
        update: {},
        create: { therapistId: therapist.id, serviceId: service.id },
      });
    }
  }
  for (const service of [services[0], services[1]]) {
    await prisma.therapistService.upsert({
      where: {
        therapistId_serviceId: { therapistId: therapists[2].id, serviceId: service.id },
      },
      update: {},
      create: { therapistId: therapists[2].id, serviceId: service.id },
    });
  }

  // Open Tue–Sun 10:00–19:00, closed Monday.
  const openDays = [0, 2, 3, 4, 5, 6];
  for (const therapist of therapists) {
    for (const dayOfWeek of openDays) {
      const id = `seed-wh-${therapist.id}-${dayOfWeek}`;
      await prisma.weeklyAvailability.upsert({
        where: { id },
        update: { startMin: 10 * 60, endMin: 19 * 60 },
        create: { id, therapistId: therapist.id, dayOfWeek, startMin: 10 * 60, endMin: 19 * 60 },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin login -> email: ${adminEmail}  password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
