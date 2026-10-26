import { hashPassword, verifyPassword } from "../lib/auth/password";
import { RegisterSchema, LoginSchema } from "../lib/validations/auth";
import { prisma } from "../lib/db/prisma";
import { sanitizeUser } from "../lib/auth/session";

async function runAuthTests() {
  console.log("=========================================");
  console.log(" Running AyuTrace Authentication Tests");
  console.log("=========================================\n");

  // 1. Password Hashing and Timing-Safe Verification
  console.log("Test 1: Password Hashing & Verification");
  const rawPassword = "SecureHospitalPassword2026!";
  const hash = hashPassword(rawPassword);
  console.log("  - Generated Hash with unique salt:", hash.slice(0, 30) + "...");
  const isValid = verifyPassword(rawPassword, hash);
  const isWrongValid = verifyPassword("WrongPassword123!", hash);
  if (!isValid || isWrongValid) {
    throw new Error("Password verification failed!");
  }
  console.log("  ✓ Correct password matches hash");
  console.log("  ✓ Incorrect password safely rejected\n");

  // 2. Validation Schemas
  console.log("Test 2: Zod Validation Schemas");
  const validRegister = RegisterSchema.safeParse({
    name: "Dr. Sunita Rao",
    email: "sunita.rao@hospital.org",
    password: "Password123!",
    confirmPassword: "Password123!",
    role: "lead_pharmacist",
    licenseNumber: "PCI-MH-2024-5501",
    department: "Emergency Inpatient Ward",
  });
  if (!validRegister.success) {
    throw new Error("Valid registration was rejected by schema!");
  }
  console.log("  ✓ Valid registration schema accepted");

  const mismatchRegister = RegisterSchema.safeParse({
    name: "Dr. Sunita Rao",
    email: "sunita.rao@hospital.org",
    password: "Password123!",
    confirmPassword: "DifferentPassword123!",
    role: "pharmacist",
  });
  if (mismatchRegister.success) {
    throw new Error("Mismatched passwords were not rejected!");
  }
  console.log("  ✓ Mismatched confirmPassword rejected");

  const invalidEmail = LoginSchema.safeParse({
    email: "not-an-email",
    password: "Password123!",
  });
  if (invalidEmail.success) {
    throw new Error("Invalid email passed login schema!");
  }
  console.log("  ✓ Malformed email rejected\n");

  // 3. User Database Registration and Retrieval
  console.log("Test 3: Database User Creation & Session");
  const testEmail = `test.clinician.${Date.now()}@ayutrace.org`;
  const user = await prisma.user.create({
    data: {
      name: "Dr. Test Clinician",
      email: testEmail,
      passwordHash: hashPassword("TestPass123!"),
      role: "doctor",
      department: "Pediatric ICU",
      licenseNumber: "MC-DL-2026-900",
    },
    include: { facility: true },
  });

  console.log("  ✓ User created in SQLite DB with ID:", user.id);

  // 4. Safe User Sanitization (ensure no passwordHash leaked)
  const safe = sanitizeUser(user);
  if ("passwordHash" in (safe as any)) {
    throw new Error("Security leak: passwordHash was included in SafeUser!");
  }
  console.log("  ✓ SafeUser sanitization strictly excludes passwordHash");

  // 5. Verify Authentication with seeded users
  console.log("\nTest 4: Seeded User Verification");
  const seededPharmacist = await prisma.user.findUnique({
    where: { email: "pharmacist@ayutrace.org" },
  });
  if (!seededPharmacist) {
    throw new Error("Seeded pharmacist user not found in DB!");
  }
  const isSeededPasswordValid = verifyPassword("Password123!", seededPharmacist.passwordHash);
  if (!isSeededPasswordValid) {
    throw new Error("Seeded user password verification failed!");
  }
  console.log("  ✓ Seeded user 'pharmacist@ayutrace.org' verified with 'Password123!'");

  // Cleanup test user
  await prisma.user.delete({ where: { id: user.id } });
  console.log("  ✓ Cleaned up test user");

  console.log("\n=========================================");
  console.log(" ALL AUTHENTICATION TESTS PASSED (100%)");
  console.log("=========================================");
}

runAuthTests()
  .catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
