import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

export const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  username: z.string().min(3, "Минимум 3 символа").max(32, "Максимум 32 символа"),
  displayName: z.string().min(1, "Обязательное поле").max(64),
  password: z.string().min(8, "Минимум 8 символов"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().optional(),
  isGuest: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserSchema = z.infer<typeof userSchema>;
