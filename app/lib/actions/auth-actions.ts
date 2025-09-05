/**
 * @file This file contains Server Actions for handling user authentication flows (registration, login, logout, session management)
 * using Supabase Auth. These actions are crucial for securing the application and providing a personalized experience for users.
 *
 * Why it's needed:
 * - User-specific content: Allows users to create, manage, and view their own polls, ensuring data isolation.
 * - Access control: Protects certain routes and functionalities (e.g., creating/editing polls) to authenticated users only.
 * - Persistent sessions: Enables users to remain logged in across sessions, improving usability.
 * - Data integrity: Ensures that only authenticated and authorized users can interact with their data.
 *
 * Assumptions:
 * - Supabase is correctly configured with environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`).
 * - The `createClient` function from `@/lib/supabase/server` is available and correctly initializes the Supabase client.
 * - Client-side forms (`LoginFormData`, `RegisterFormData`) provide valid email, password, and name (for registration).
 * - Password complexity requirements are defined by the `passwordSchema` using Zod.
 *
 * Edge Cases & Error Handling:
 * - Invalid credentials: Supabase handles authentication failures for `login`. Errors are returned to the client.
 * - Password complexity: `register` explicitly validates password complexity using Zod before calling Supabase.
 * - Network errors/Supabase issues: Errors from Supabase operations are caught and returned, allowing UI components to display appropriate messages.
 * - Session expiration: Supabase automatically handles session refreshes and invalidation. `getCurrentUser` and `getSession` will reflect the current auth state.
 *
 * Connections to other components:
 * - UI Components: `login/page.tsx`, `register/page.tsx`, and `components/layout/header.tsx` (for logout) directly call these Server Actions
 *   to handle user input and trigger authentication state changes.
 * - Server Components: `getCurrentUser` and `getSession` are used in Server Components (e.g., `app/(dashboard)/layout.tsx`, `app/(dashboard)/polls/page.tsx`)
 *   to fetch the current user's session and data, enabling conditional rendering and data fetching based on authentication status.
 * - Middleware: Supabase's middleware handles session refreshing and redirection for protected routes.
 */
'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { z } from 'zod'; // Import zod

// Define a Zod schema for password complexity
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.');

export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // No explicit password validation here, as Supabase will handle it during signInWithPassword.
  // Rate limiting for login attempts is handled by Supabase itself.

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Validate password complexity using Zod
  const passwordValidation = passwordSchema.safeParse(data.password);
  if (!passwordValidation.success) {
    return { error: passwordValidation.error.errors[0].message };
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
