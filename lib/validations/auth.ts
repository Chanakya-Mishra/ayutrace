import { z } from "zod";

export const UserRoleEnum = z.enum([
  "pharmacist",
  "lead_pharmacist",
  "inventory_manager",
  "doctor",
  "auditor",
  "admin",
]);

export const RoleLabels: Record<string, string> = {
  pharmacist: "Staff Pharmacist",
  lead_pharmacist: "Lead / Chief Pharmacist",
  inventory_manager: "Inventory & Supply Chain Manager",
  doctor: "Medical Officer / Clinician",
  auditor: "Clinical Quality Auditor",
  admin: "Facility Administrator",
};

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),
    email: z.string().email("Please enter a valid work or hospital email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: UserRoleEnum.default("pharmacist"),
    licenseNumber: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    facilityId: z.string().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export type LoginInput = z.infer<typeof LoginSchema>;
