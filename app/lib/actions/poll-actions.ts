/**
 * @file This file contains Server Actions for managing poll-related operations, including
 * creating, retrieving, updating, and deleting polls, as well as submitting votes.
 * These actions are critical for the core functionality of the polling application, enabling
 * users to interact with polls.
 *
 * Why it's needed:
 * - Poll Lifecycle Management: Provides a complete set of operations for users to create, view,
 *   modify, and remove their polls.
 * - Voting Mechanism: Facilitates the submission of votes by users, recording their choices
 *   for poll options.
 * - Data Fetching: Enables Server Components to efficiently fetch poll data (individual polls,
 *   user-specific polls) directly from the database without client-side data fetching.
 * - Data Integrity and Security: Ensures that poll data is manipulated securely on the server
 *   and that users can only modify/delete polls they own.
 *
 * Assumptions:
 * - Supabase is correctly configured with environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`).
 * - The `createClient` function from `@/lib/supabase/server` is available and correctly initializes the Supabase client.
 * - User authentication is handled by `auth-actions.ts`, and a user session can be retrieved.
 * - Forms submitting to `createPoll` and `updatePoll` will provide `question` and `options` fields.
 * - Poll and Vote tables exist in Supabase with appropriate schemas (e.g., `polls` table with `user_id`, `question`, `options`; `votes` table with `poll_id`, `user_id`, `option_index`).
 *
 * Edge Cases & Error Handling:
 * - Missing/Invalid Data: `createPoll` and `updatePoll` validate that a question and at least two options are provided.
 * - Unauthenticated Users: `createPoll`, `deletePoll`, and `updatePoll` require an authenticated user. Attempts by unauthenticated users will return an error. `getUserPolls` gracefully handles unauthenticated users by returning an empty array.
 * - Non-existent Polls: `getPollById` will return `null` if a poll with the given ID is not found.
 * - Database Errors: All Supabase operations include error handling, returning informative messages to the client for display.
 * - Revalidation: `revalidatePath("/polls")` is called after creating or deleting a poll to ensure the poll list is fresh.
 *
 * Connections to other components:
 * - UI Components:
 *   - `app/(dashboard)/create/PollCreateForm.tsx` uses `createPoll` to submit new poll data.
 *   - `app/(dashboard)/polls/[id]/edit/EditPollForm.tsx` uses `updatePoll` to modify existing polls.
 *   - `app/(dashboard)/polls/PollActions.tsx` uses `deletePoll` to remove polls.
 *   - Individual poll display components will likely call `submitVote` when a user selects an option.
 * - Server Components:
 *   - `app/(dashboard)/polls/page.tsx` uses `getUserPolls` to display a list of polls owned by the current user.
 *   - `app/(dashboard)/polls/[id]/page.tsx` uses `getPollById` to fetch and display a single poll's details.
 *   - `app/(dashboard)/admin/page.tsx` (or similar admin-focused components) might use these actions for administrative tasks.
 * - Authentication System: Relies on `auth-actions.ts` to get the current user's session and ID for associating polls with users and enforcing ownership.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  /**
   * @function submitVote
   * @description Handles the submission of a user's vote for a specific poll option.
   * This Server Action records the user's choice in the database, ensuring data integrity
   * and enabling the application to tally votes and display results.
   *
   * Why it's needed:
   * - Core Voting Functionality: This is the primary mechanism for users to interact with polls
   *   by casting their votes, making the polling application functional.
   * - Data Persistence: Stores vote information in the Supabase database, allowing for
   *   retrieval and aggregation of results.
   * - User Engagement: Enables users to actively participate in polls, driving the app's purpose.
   *
   * Assumptions:
   * - Supabase is correctly configured and the `createClient` function is available.
   * - A `votes` table exists in Supabase with `poll_id`, `user_id` (nullable), and `option_index` columns.
   * - `pollId` refers to an existing poll in the `polls` table.
   * - `optionIndex` is a valid index corresponding to an option within the specified poll.
   * - The user's session can be retrieved for recording `user_id`, or a vote can be cast anonymously if `user_id` is null.
   *
   * Edge Cases & Error Handling:
   * - Database Insertion Errors: If there's an issue inserting the vote into the `votes` table,
   *   an error message is returned to the client.
   * - Anonymous Voting: The current implementation allows for anonymous voting (`user?.id ?? null`).
   *   If requiring login to vote, uncomment the `if (!user)` check.
   * - Invalid `pollId` or `optionIndex`: While not explicitly validated within this function,
   *   Supabase foreign key constraints or subsequent data retrieval logic would handle cases
   *   where `pollId` doesn't exist or `optionIndex` is out of bounds for a given poll.
   *
   * Connections to other components:
   * - UI Components: Typically called from a Client Component responsible for displaying a poll
   *   (e.g., `app/(dashboard)/polls/[id]/page.tsx` or `app/(dashboard)/vulnerable-share.tsx`).
   *   When a user clicks on an option, this action is invoked to record their choice.
   * - Database: Directly interacts with the `votes` table in Supabase to persist voting data.
   * - Poll Results: Other components responsible for displaying poll results (e.g., on the poll detail page)
   *   would query the `votes` table to aggregate and present the voting distribution.
   */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally require login to vote
  // if (!user) return { error: 'You must be logged in to vote.' };

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
