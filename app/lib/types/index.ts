// User types
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Poll types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  endDate?: Date;
  settings: PollSettings;
}

export interface PollSettings {
  allowMultipleVotes: boolean;
  requireAuthentication: boolean;
}

// Vote types
export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId?: string; // Optional if anonymous voting is allowed
  createdAt: Date;
}

// Form types
import { z } from 'zod'; // Import zod

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.');

export const loginFormSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password cannot be empty.'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty.'),
  email: z.string().email('Invalid email address.'),
  password: passwordSchema, // Use the password schema for registration
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export interface CreatePollFormData {
  title: string;
  description?: string;
  options: string[];
  settings: PollSettings;
  endDate?: string;
}