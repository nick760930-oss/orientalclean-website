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
      name: "傳統泰式按摩 60 分鐘",
      durationMin: 60,
      priceTwd: 900,
      depositTwd: 0,
      description: "正統泰式手法，舒緩全身肌肉緊繃。",
    },
    {
      name: "傳統泰式按摩 90 分鐘",
      durationMin: 90,
      priceTwd: 1300,
      depositTwd: 0,
      description: "加強版全身按摩，涵蓋肩頸腰背。",
    },
    {
      name: "傳統泰式按摩 120 分鐘",
      durationMin: 120,
      priceTwd: 1500,
      depositTwd: 0,
      description: "最完整的深度放鬆時光。",
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
    { name: "老師 A", bio: "資深泰式按摩師。" },
    { name: "老師 B", bio: "資深泰式按摩師。" },
    { name: "包廂 1", bio: "雙人按摩包廂（以包廂做為可預約資源）。" },
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

  // All three durations are the same treatment, so every therapist/room can perform any of them.
  for (const therapist of therapists) {
    for (const service of services) {
      await prisma.therapistService.upsert({
        where: { therapistId_serviceId: { therapistId: therapist.id, serviceId: service.id } },
        update: {},
        create: { therapistId: therapist.id, serviceId: service.id },
      });
    }
  }

  // Open daily 10:00–22:00 (matches the shop's posted hours).
  const openDays = [0, 1, 2, 3, 4, 5, 6];
  for (const therapist of therapists) {
    for (const dayOfWeek of openDays) {
      const id = `seed-wh-${therapist.id}-${dayOfWeek}`;
      await prisma.weeklyAvailability.upsert({
        where: { id },
        update: { startMin: 10 * 60, endMin: 22 * 60 },
        create: { id, therapistId: therapist.id, dayOfWeek, startMin: 10 * 60, endMin: 22 * 60 },
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
