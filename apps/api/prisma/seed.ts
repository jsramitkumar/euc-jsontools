import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminHash = await argon2.hash("Admin@12345");
  const admin = await prisma.user.upsert({
    where: { email: "admin@jsontools.dev" },
    update: {},
    create: {
      email: "admin@jsontools.dev",
      passwordHash: adminHash,
      name: "Admin",
      role: Role.admin,
      credits: 99999,
    },
  });

  // Create test user
  const userHash = await argon2.hash("Test@12345");
  const testUser = await prisma.user.upsert({
    where: { email: "user@jsontools.dev" },
    update: {},
    create: {
      email: "user@jsontools.dev",
      passwordHash: userHash,
      name: "Test User",
      role: Role.free,
      credits: 10,
    },
  });

  console.log(`✅ Admin: admin@jsontools.dev / Admin@12345`);
  console.log(`✅ User:  user@jsontools.dev  / Test@12345`);
  console.log("🌱 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
