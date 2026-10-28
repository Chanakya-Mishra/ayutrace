import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { performance } from "perf_hooks";

async function main() {
  console.log("==========================================================");
  console.log("   AyuTrace: Supabase Tokyo -> Mumbai Migration Tool      ");
  console.log("==========================================================\n");

  const tokyoUrl = process.env.DATABASE_URL;
  if (!tokyoUrl) {
    console.error("❌ ERROR: DATABASE_URL is not set in environment or .env");
    process.exit(1);
  }

  const tokyoPrisma = new PrismaClient({
    datasources: { db: { url: tokyoUrl } },
  });

  console.log("📡 Step 1: Exporting live dataset from current database (Tokyo)...");
  const t0 = performance.now();

  const [
    organizations,
    facilities,
    storageLocations,
    users,
    medicines,
    medicineBatches,
    stockBalances,
    stockMovements,
    appSettings,
  ] = await Promise.all([
    tokyoPrisma.organization.findMany(),
    tokyoPrisma.facility.findMany(),
    tokyoPrisma.storageLocation.findMany(),
    tokyoPrisma.user.findMany(),
    tokyoPrisma.medicine.findMany(),
    tokyoPrisma.medicineBatch.findMany(),
    tokyoPrisma.stockBalance.findMany(),
    tokyoPrisma.stockMovement.findMany(),
    tokyoPrisma.appSettings.findMany(),
  ]);

  const exportDuration = Math.round(performance.now() - t0);
  console.log(`   Fetched all tables in ${exportDuration}ms:`);
  console.log(`   - Organizations:     ${organizations.length}`);
  console.log(`   - Facilities:        ${facilities.length}`);
  console.log(`   - Storage Locations: ${storageLocations.length}`);
  console.log(`   - Medicines:         ${medicines.length}`);
  console.log(`   - Batches:           ${medicineBatches.length}`);
  console.log(`   - Stock Balances:    ${stockBalances.length}`);
  console.log(`   - Movements:         ${stockMovements.length}`);
  console.log(`   - Users:             ${users.length}`);
  console.log(`   - App Settings:      ${appSettings.length}`);

  const backupData = {
    exportedAt: new Date().toISOString(),
    source: "Tokyo (aws-0-ap-northeast-1)",
    data: {
      organizations,
      facilities,
      storageLocations,
      users,
      medicines,
      medicineBatches,
      stockBalances,
      stockMovements,
      appSettings,
    },
  };

  const backupPath = path.join(process.cwd(), "prisma", "backup_mumbai_migration.json");
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`\n💾 Snapshot safely written to: ${backupPath}\n`);

  const mumbaiUrl = process.env.MUMBAI_DATABASE_URL;
  if (!mumbaiUrl) {
    console.log("ℹ️  MUMBAI_DATABASE_URL is not provided yet.");
    console.log("   Once you create your new Supabase project in South Asia (Mumbai), run:");
    console.log(`
   MUMBAI_DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" npx tsx scripts/migrate_to_mumbai.ts
    `);
    await tokyoPrisma.$disconnect();
    return;
  }

  console.log("🚀 Step 2: Applying schema to new Mumbai database...");
  execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
    env: { ...process.env, DATABASE_URL: mumbaiUrl, DIRECT_URL: mumbaiUrl },
    stdio: "inherit",
  });

  console.log("\n📦 Step 3: Restoring relational data into Mumbai database...");
  const mumbaiPrisma = new PrismaClient({
    datasources: { db: { url: mumbaiUrl } },
  });

  // Clean target tables in reverse dependency order
  await mumbaiPrisma.stockMovement.deleteMany();
  await mumbaiPrisma.stockBalance.deleteMany();
  await mumbaiPrisma.medicineBatch.deleteMany();
  await mumbaiPrisma.medicine.deleteMany();
  await mumbaiPrisma.storageLocation.deleteMany();
  await mumbaiPrisma.facility.deleteMany();
  await mumbaiPrisma.user.deleteMany();
  await mumbaiPrisma.organization.deleteMany();
  await mumbaiPrisma.appSettings.deleteMany();

  // Restore in topological dependency order
  if (organizations.length > 0) {
    await mumbaiPrisma.organization.createMany({ data: organizations });
  }
  if (facilities.length > 0) {
    await mumbaiPrisma.facility.createMany({ data: facilities });
  }
  if (storageLocations.length > 0) {
    await mumbaiPrisma.storageLocation.createMany({ data: storageLocations });
  }
  if (users.length > 0) {
    await mumbaiPrisma.user.createMany({ data: users });
  }
  if (medicines.length > 0) {
    await mumbaiPrisma.medicine.createMany({ data: medicines });
  }
  if (medicineBatches.length > 0) {
    await mumbaiPrisma.medicineBatch.createMany({ data: medicineBatches });
  }
  if (stockBalances.length > 0) {
    await mumbaiPrisma.stockBalance.createMany({ data: stockBalances });
  }
  if (stockMovements.length > 0) {
    await mumbaiPrisma.stockMovement.createMany({ data: stockMovements });
  }
  if (appSettings.length > 0) {
    await mumbaiPrisma.appSettings.createMany({ data: appSettings });
  }

  console.log("✅ All data successfully migrated into Mumbai!");

  // Step 4: Latency comparison test
  console.log("\n⚡ Step 4: Comparing Latency (Tokyo vs Mumbai)...");
  const tokyoT0 = performance.now();
  await tokyoPrisma.$queryRaw`SELECT 1 as ping`;
  const tokyoPing = Math.round(performance.now() - tokyoT0);

  const mumbaiT0 = performance.now();
  await mumbaiPrisma.$queryRaw`SELECT 1 as ping`;
  const mumbaiPing = Math.round(performance.now() - mumbaiT0);

  console.log(`   Tokyo Database Ping:  ${tokyoPing} ms`);
  console.log(`   Mumbai Database Ping: ${mumbaiPing} ms`);
  if (mumbaiPing < tokyoPing) {
    const factor = (tokyoPing / mumbaiPing).toFixed(1);
    console.log(`   🎉 Mumbai is ~${factor}x faster!`);
  }

  await tokyoPrisma.$disconnect();
  await mumbaiPrisma.$disconnect();

  console.log("\n==========================================================");
  console.log("   Migration Completed Successfully!                      ");
  console.log("==========================================================");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
