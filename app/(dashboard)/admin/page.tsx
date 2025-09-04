import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient"; // Import the new client component

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