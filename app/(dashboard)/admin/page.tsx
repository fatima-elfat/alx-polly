import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient"; // Import the new client component

/**
 * @file This file defines the Admin Dashboard page, a Server Component responsible for
 * authenticating and authorizing administrative users. It acts as a gatekeeper, ensuring
 * that only users with the 'admin' role can access the administrative interface.
 *
 * Why it's needed:
 * - Access Control: Enforces security by restricting access to sensitive administrative
 *   functionalities to authorized personnel only. This is crucial for maintaining the
 *   integrity and security of the application.
 * - Role-Based Redirection: Automatically redirects non-authenticated or non-admin
 *   users to appropriate pages, providing a seamless and secure user experience.
 * - Server-Side Authorization: Performs authorization checks on the server, preventing
 *   unauthorized access before any client-side components are rendered, enhancing security.
 *
 * Assumptions:
 * - Supabase is correctly configured, and `createClient` from `@/lib/supabase/server` is available.
 * - User authentication is handled by Supabase Auth, and user sessions can be retrieved.
 * - User roles (e.g., 'admin') are stored in the `user_metadata` field of the Supabase user object.
 *   (This assumption might need to be adjusted based on the actual Supabase setup for roles).
 * - There are `/login` and `/polls` routes available for redirection.
 * - `AdminDashboardClient` is a client component that contains the actual interactive
 *   admin dashboard UI and logic.
 *
 * Edge Cases & Error Handling:
 * - No authenticated user: If `supabase.auth.getUser()` returns no user, the user is
 *   redirected to the `/login` page.
 * - Non-admin user: If an authenticated user does not have the 'admin' role in their
 *   `user_metadata`, they are redirected to the `/polls` page.
 * - Supabase errors during user retrieval: While not explicitly handled with `try/catch`
 *   here, `supabase.auth.getUser()` would return an error object, which would implicitly
 *   lead to a redirect if `user` is null.
 *
 * Connections to other components:
 * - Authentication System: Directly relies on `auth-actions.ts` (via `createClient`
 *   and `supabase.auth.getUser()`) for user session and role information.
 * - `AdminDashboardClient.tsx`: This Server Component renders the `AdminDashboardClient`
 *   Client Component, passing control to the client-side for interactive admin features
 *   once authorization is confirmed.
 * - Navigation: Uses `next/navigation`'s `redirect` function to enforce access policies.
 * - Database: Implicitly interacts with the Supabase database via the authentication
 *   client to retrieve user data and metadata.
 */
export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No authenticated user, redirect to login
    redirect("/login");
  }

  // Assuming 'role' is stored in user_metadata for role-based access control
  // You might need to adjust this based on how roles are managed in your Supabase setup.
  if (user.user_metadata.role !== "admin") {
    // User is not an admin, redirect to a non-admin page
    redirect("/polls");
  }

  // If the user is an admin, render the client component
  return <AdminDashboardClient />;
}