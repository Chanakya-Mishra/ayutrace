const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting data migration from backup to Supabase PostgreSQL...");
  const data = JSON.parse(fs.readFileSync("prisma/backup_sqlite_data.json", "utf8"));

  // 1. Organizations
  console.log("Migrating organizations...");
  for (const org of data.organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: {},
      create: {
        ...org,
        createdAt: new Date(org.createdAt),
        updatedAt: new Date(org.updatedAt),
      },
    });
  }

  // 2. Facilities
  console.log("Migrating facilities...");
  for (const f of data.facilities) {
    await prisma.facility.upsert({
      where: { id: f.id },
      update: {},
      create: {
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      },
    });
  }

  // 3. Storage Locations
  console.log("Migrating storage locations...");
  for (const loc of data.locations) {
    await prisma.storageLocation.upsert({
      where: { id: loc.id },
      update: {},
      create: {
        ...loc,
        createdAt: new Date(loc.createdAt),
        updatedAt: new Date(loc.updatedAt),
      },
    });
  }

  // 4. Medicines
  console.log("Migrating medicines...");
  for (const m of data.medicines) {
    await prisma.medicine.upsert({
      where: { id: m.id },
      update: {},
      create: {
        ...m,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      },
    });
  }

  // 5. Medicine Batches
  console.log("Migrating medicine batches...");
  for (const b of data.batches) {
    await prisma.medicineBatch.upsert({
      where: { id: b.id },
      update: {},
      create: {
        ...b,
        normalizedExpiryDate: b.normalizedExpiryDate ? new Date(b.normalizedExpiryDate) : null,
        verifiedAt: b.verifiedAt ? new Date(b.verifiedAt) : null,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      },
    });
  }

  // 6. Stock Balances
  console.log("Migrating stock balances...");
  for (const sb of data.balances) {
    await prisma.stockBalance.upsert({
      where: { id: sb.id },
      update: {},
      create: {
        ...sb,
        updatedAt: new Date(sb.updatedAt),
      },
    });
  }

  // 7. Stock Movements
  console.log("Migrating stock movements...");
  for (const sm of data.movements) {
    await prisma.stockMovement.upsert({
      where: { id: sm.id },
      update: {},
      create: {
        ...sm,
        createdAt: new Date(sm.createdAt),
      },
    });
  }

  // 8. App Settings
  console.log("Migrating app settings...");
  for (const s of data.appSettings) {
    await prisma.appSettings.upsert({
      where: { id: s.id },
      update: {
        geminiApiKey: process.env.GEMINI_API_KEY || s.geminiApiKey,
      },
      create: {
        ...s,
        geminiApiKey: process.env.GEMINI_API_KEY || s.geminiApiKey,
        updatedAt: new Date(s.updatedAt),
      },
    });
  }

  // 9. Users
  console.log("Migrating users...");
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        ...u,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }

  console.log("MIGRATION TO SUPABASE COMPLETED SUCCESSFULLY!");
}

migrate()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
