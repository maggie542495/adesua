import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const setupOwnerSchema = z.object({
  setupSecret: z.string().min(16, "Invalid setup secret"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number"),
  fullName: z.string().trim().min(2, "Enter your full name").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SetupOwnerInput = z.infer<typeof setupOwnerSchema>;
