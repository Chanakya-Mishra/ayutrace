import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AyuTrace Healthcare Network with realistic medicine inventory...");

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { code: "AYU-HEALTH" },
    update: {},
    create: {
      name: "AyuTrace Health Network",
      code: "AYU-HEALTH",
    },
  });

  // 2. Create Facilities
  const hospital = await prisma.facility.create({
    data: {
      orgId: org.id,
      name: "Apex Central Hospital",
      type: "hospital",
      city: "New Delhi",
      locations: {
        create: [
          { name: "Central Pharmacy Dispensary", description: "Main outpatient dispensing hub" },
          { name: "Emergency Ward Crash Cart", description: "Critical rapid-access medicines" },
          { name: "Cold Chain Refrigerator 1", description: "Biologicals, insulins & vaccines (2°C - 8°C)" },
        ],
      },
    },
    include: { locations: true },
  });

  const clinic = await prisma.facility.create({
    data: {
      orgId: org.id,
      name: "AyuTrace Community Clinic",
      type: "clinic",
      city: "Bengaluru",
      locations: {
        create: [
          { name: "Primary Care Dispensary", description: "OPD prescription dispensing" },
          { name: "Stockroom Shelf B", description: "Bulk replenishment storage" },
        ],
      },
    },
    include: { locations: true },
  });

  // 3. Create Default App Settings
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      defaultFacilityId: hospital.id,
    },
    create: {
      id: "default",
      orgName: "AyuTrace Health Network",
      defaultFacilityId: hospital.id,
      nearExpiryThresholdDays: 90,
      criticalExpiryThresholdDays: 30,
      urgentExpiryThresholdDays: 7,
      dateFormat: "DD/MM/YYYY",
    },
  });

  const now = new Date();
  const past6Days = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const in22Days = new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000);
  const in75Days = new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000);
  const in240Days = new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000);
  const in480Days = new Date(now.getTime() + 480 * 24 * 60 * 60 * 1000);

  const centralPharmacyLoc = hospital.locations.find((l) => l.name === "Central Pharmacy Dispensary")!;
  const emergencyCartLoc = hospital.locations.find((l) => l.name === "Emergency Ward Crash Cart")!;
  const coldChainLoc = hospital.locations.find((l) => l.name === "Cold Chain Refrigerator 1")!;
  const clinicDispensaryLoc = clinic.locations.find((l) => l.name === "Primary Care Dispensary")!;

  const medicinesData = [
    {
      name: "Paracip 500",
      genericName: "Paracetamol Tablets IP",
      brand: "Paracip",
      manufacturer: "Cipla Ltd",
      strength: "500 mg",
      dosageForm: "Tablet",
      category: "Analgesic & Antipyretic",
      packSize: "Strip of 10 Tablets",
      storageInstructions: "Store below 25°C. Protect from direct moisture and light.",
      scheduleType: "OTC",
      warnings: "Overdose may cause liver damage. Keep out of reach of children.",
      batch: {
        batchNumber: "B240901",
        mfgDate: "03/2024",
        expDate: "02/2027",
        normalizedExpiry: in480Days,
        precision: "month_year",
        status: "active",
        locationId: centralPharmacyLoc.id,
        quantity: 120,
        notes: "General OPD replenishment.",
      },
    },
    {
      name: "Augmentin 625 Duo",
      genericName: "Amoxicillin and Potassium Clavulanate Tablets IP",
      brand: "Augmentin",
      manufacturer: "GlaxoSmithKline Pharmaceuticals",
      strength: "625 mg (500mg + 125mg)",
      dosageForm: "Tablet",
      category: "Antibacterial",
      packSize: "Strip of 10 Tablets",
      storageInstructions: "Store in a dry place below 25°C. Protect from moisture.",
      scheduleType: "Schedule H1",
      warnings: "To be sold by retail on the prescription of a Registered Medical Practitioner only.",
      batch: {
        batchNumber: "AUG-8820",
        mfgDate: "11/2023",
        expDate: in22Days.toLocaleDateString("en-GB"),
        normalizedExpiry: in22Days,
        precision: "day_month_year",
        status: "critical",
        locationId: centralPharmacyLoc.id,
        quantity: 35,
        notes: "Critical window: prioritize dispensing for active antibiotic prescriptions.",
      },
    },
    {
      name: "Huminsulin R 40 IU/ml",
      genericName: "Regular Soluble Human Insulin Injection IP",
      brand: "Huminsulin",
      manufacturer: "Eli Lilly / Lupin",
      strength: "40 IU/ml",
      dosageForm: "Injection",
      category: "Endocrine & Diabetes",
      packSize: "Vial of 10 ml",
      storageInstructions: "Store in a refrigerator between 2°C and 8°C. Do not freeze.",
      scheduleType: "Schedule H",
      warnings: "For subcutaneous or intravenous use under medical supervision. Protect from freezing.",
      batch: {
        batchNumber: "INS-9102",
        mfgDate: "06/2024",
        expDate: in5Days.toLocaleDateString("en-GB"),
        normalizedExpiry: in5Days,
        precision: "day_month_year",
        status: "critical",
        locationId: coldChainLoc.id,
        quantity: 18,
        notes: "Urgent: 5 days remaining. Do not issue for extended monthly chronic regimens.",
      },
    },
    {
      name: "Pan 40",
      genericName: "Pantoprazole Gastro-resistant Tablets IP",
      brand: "Pan",
      manufacturer: "Alkem Laboratories Ltd",
      strength: "40 mg",
      dosageForm: "Tablet",
      category: "Gastrointestinal",
      packSize: "Strip of 15 Tablets",
      storageInstructions: "Store below 25°C in a dry place. Swallow whole, do not crush.",
      scheduleType: "Schedule H",
      warnings: "Schedule H Prescription Drug — Warning: To be sold by retail on prescription only.",
      batch: {
        batchNumber: "PAN-3329",
        mfgDate: "01/2024",
        expDate: "10/2026",
        normalizedExpiry: in240Days,
        precision: "month_year",
        status: "active",
        locationId: centralPharmacyLoc.id,
        quantity: 90,
        notes: "Standard shelf standing.",
      },
    },
    {
      name: "Ciplox Eye/Ear Drops 0.3%",
      genericName: "Ciprofloxacin Ophthalmic Solution IP",
      brand: "Ciplox",
      manufacturer: "Cipla Ltd",
      strength: "0.3% w/v",
      dosageForm: "Drops",
      category: "Ophthalmic & ENT",
      packSize: "Vial of 10 ml",
      storageInstructions: "Store below 25°C. Discard within 1 month after opening.",
      scheduleType: "Schedule H",
      warnings: "For external ophthalmic/otic use only. Not for injection.",
      batch: {
        batchNumber: "CIP-1099",
        mfgDate: "08/2023",
        expDate: past6Days.toLocaleDateString("en-GB"),
        normalizedExpiry: past6Days,
        precision: "day_month_year",
        status: "expired",
        locationId: emergencyCartLoc.id,
        quantity: 8,
        notes: "Expired 6 days ago. Quarantined; remove from emergency cart immediately.",
      },
    },
    {
      name: "Azithral 200 Suspension",
      genericName: "Azithromycin Oral Suspension IP",
      brand: "Azithral",
      manufacturer: "Alembic Pharmaceuticals Ltd",
      strength: "200 mg / 5 ml",
      dosageForm: "Syrup",
      category: "Pediatric Antibacterial",
      packSize: "Bottle of 15 ml",
      storageInstructions: "Store in a cool dry place. Keep bottle tightly closed.",
      scheduleType: "Schedule H1",
      warnings: "Schedule H1: Warning dangerous to take except under medical supervision.",
      batch: {
        batchNumber: "AZI-5022",
        mfgDate: "04/2024",
        expDate: in75Days.toLocaleDateString("en-GB"),
        normalizedExpiry: in75Days,
        precision: "day_month_year",
        status: "near_expiry",
        locationId: clinicDispensaryLoc.id,
        quantity: 24,
        notes: "Near expiry (75d). Front-load in pediatric OPD.",
      },
    },
  ];

  for (const item of medicinesData) {
    const medicine = await prisma.medicine.create({
      data: {
        name: item.name,
        genericName: item.genericName,
        brand: item.brand,
        manufacturer: item.manufacturer,
        strength: item.strength,
        dosageForm: item.dosageForm,
        category: item.category,
        packSize: item.packSize,
        storageInstructions: item.storageInstructions,
        scheduleType: item.scheduleType,
        warnings: item.warnings,
      },
    });

    const batch = await prisma.medicineBatch.create({
      data: {
        medicineId: medicine.id,
        batchNumber: item.batch.batchNumber,
        manufacturingDateText: item.batch.mfgDate,
        expiryDateText: item.batch.expDate,
        normalizedExpiryDate: item.batch.normalizedExpiry,
        datePrecision: item.batch.precision,
        status: item.batch.status,
        verifiedByStaff: true,
        verifiedAt: new Date(),
        verifiedBy: "Senior Pharmacist Sharma",
        scanConfidence: "high",
        notes: item.batch.notes,
      },
    });

    await prisma.stockBalance.create({
      data: {
        batchId: batch.id,
        locationId: item.batch.locationId,
        quantity: item.batch.quantity,
      },
    });

    await prisma.stockMovement.create({
      data: {
        batchId: batch.id,
        destinationLocationId: item.batch.locationId,
        quantity: item.batch.quantity,
        movementType: "intake",
        reason: "Initial clinical stock intake verification",
        performedBy: "Senior Pharmacist Sharma",
        notes: `Intake confirmed for ${item.name} (${item.batch.batchNumber})`,
      },
    });
  }

  // Create an initial inter-department stock transfer movement for demonstration
  const firstBatch = await prisma.medicineBatch.findFirst({
    where: { batchNumber: "B240901" },
  });
  if (firstBatch) {
    await prisma.stockMovement.create({
      data: {
        batchId: firstBatch.id,
        sourceLocationId: centralPharmacyLoc.id,
        destinationLocationId: emergencyCartLoc.id,
        quantity: 10,
        movementType: "transfer",
        reason: "ER Ward emergency stock replenishment",
        performedBy: "Staff Pharmacist Ananya",
        notes: "Routine emergency crash cart restock.",
      },
    });

    // reflect balance
    await prisma.stockBalance.create({
      data: {
        batchId: firstBatch.id,
        locationId: emergencyCartLoc.id,
        quantity: 10,
      },
    });
  }

  console.log("AyuTrace seed complete: 2 facilities, 5 locations, 6 medicines and batches populated.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
