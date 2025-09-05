# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here’s a suggested approach:

1.  **Familiarize Yourself with the Code**:
    -   Start with `app/lib/actions/` to understand how the application interacts with the database.
    -   Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
    -   Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2.  **Use Your AI Assistant**:
    -   This is an open-book test. You are encouraged to use AI tools to help you.
    -   Ask your AI assistant to review snippets of code for security issues.
    -   Describe a feature's behavior to your AI and ask it to identify potential attack vectors.
    -   When you find a vulnerability, ask your AI for the best way to patch it.

---

## 🔒 Security Audit & Fixes Implemented

During a thorough security audit, several vulnerabilities and semantic bugs were identified and subsequently addressed to enhance the application's robustness and security posture.

### 1. Insufficient Authorization Checks (Admin Page)

*   **Location**: `app/(dashboard)/admin/page.tsx`
*   **Description**: The admin page lacked proper role-based access control, allowing any authenticated user to access administrative functionalities.
*   **Impact**: Regular users could gain unauthorized administrative access and perform actions beyond their intended permissions.
*   **Fix Applied**: Implemented robust role-based access control. The `app/(dashboard)/admin/page.tsx` was refactored into a Server Component to perform server-side authorization checks. Only users with an explicit 'admin' role (stored in `user.user_metadata`) can now access the admin dashboard; others are redirected.

### 2. Inadequate Input Validation (Various Form Submission Handlers)

*   **Location**: `app/lib/actions/poll-actions.ts`, `app/lib/actions/auth-actions.ts`, `app/(auth)/register/page.tsx`
*   **Description**: Input validation was not consistently applied across all user-facing forms and Server Actions, creating potential avenues for malicious input.
*   **Impact**: Increased risk of Cross-Site Scripting (XSS) and injection attacks through unvalidated or improperly sanitized user input.
*   **Fix Applied**: Enhanced input validation significantly using `zod` schemas. This was applied to:
    *   **Poll Creation/Update**: `createPoll` and `updatePoll` Server Actions now validate the `question` and `options` for content and structure.
    *   **User Registration**: The `register` Server Action and the client-side `RegisterPage` now enforce strong password complexity requirements (minimum length, mixed character types) using a `zod` schema.
    *   **Vote Submission**: `submitVote` now validates the `optionIndex` against the poll's actual options and prevents multiple votes from a single authenticated user on the same poll.

### 3. Authorization Bypasses in Poll Management

*   **Location**: `app/lib/actions/poll-actions.ts`
*   **Description**: Several poll-related actions lacked proper authorization checks, leading to data exposure and unauthorized modifications.
*   **Impact**:
    *   **Data Exposure**: Any user could view any poll by ID, regardless of ownership or public status.
    *   **Unauthorized Deletion**: Any authenticated user could delete any poll by ID.
    *   **Inconsistent Voting**: Users could submit votes for non-existent options or vote multiple times in the same poll.
*   **Fix Applied**: Implemented granular authorization and semantic validation for poll operations:
    *   **`getPollById`**: Modified to only allow access to public polls for unauthenticated users, and to both public and owned polls for authenticated users.
    *   **`submitVote`**: Enhanced to fetch the target poll, validate the `optionIndex` against available options, and prevent authenticated users from casting multiple votes on the same poll.
    *   **`deletePoll`**: Implemented an authorization check to ensure that only the owner of a poll can successfully delete it.

### 4. Weak Password Requirements

*   **Location**: `app/lib/actions/auth-actions.ts`, `app/(auth)/register/page.tsx`, `app/lib/types/index.ts`
*   **Description**: The application previously had no strict password complexity rules, making user accounts vulnerable to brute-force and dictionary attacks.
*   **Impact**: Increased risk of account compromise due to easily guessable passwords.
*   **Fix Applied**: Introduced a `zod` schema (`passwordSchema`) to enforce strong password policies during user registration, requiring a minimum length and a mix of uppercase, lowercase, numeric, and special characters. Client-side validation was also added to provide immediate feedback. Brute-force protection for login attempts is inherently handled by Supabase's authentication service.

These fixes collectively enhance the security and integrity of the ALX Polly application, ensuring a safer and more reliable experience for users.

---

## Getting Started

To begin your security audit, you'll need to get the application running on your local machine.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A [Supabase](https://supabase.io/) account (the project is pre-configured, but you may need your own for a clean slate).

### 2. Supabase Configuration

1.  **Create a New Project**: Go to your Supabase Dashboard and create a new project.
2.  **Database Schema**: Set up your database tables. The application expects at least `profiles`, `polls`, and `votes` tables. You can find example schemas in the Supabase documentation or define them as follows:
    *   `profiles`: Stores user information (linked to Supabase Auth `users` table via `id`).
    *   `polls`: Stores poll questions and options, linked to `profiles` via `user_id`.
    *   `votes`: Stores individual votes, linked to `polls` via `poll_id` and `profiles` via `user_id` (nullable for anonymous votes).
3.  **API Keys**: Navigate to your project settings in Supabase, then "API". You will need your `Project URL` and `anon public` key.

### 3. Environment Variables

Create a file named `.env.local` in the root of your project and add the following:

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with the values obtained from your Supabase project settings.

### 4. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 5. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 6. Running Tests (if applicable)

If there are any tests defined, you can run them using:

```bash
npm test
```
*(Note: As of now, specific test commands are not provided, this is a placeholder.)*

---

## Usage Examples

Once the application is running and you have configured Supabase:

1.  **Register a new user**: Navigate to `/register` and create an account.
2.  **Log in**: Use your new credentials to log in.
3.  **Create a Poll**: Go to `/create` to create a new poll by entering a question and at least two options.
4.  **View Your Polls**: Visit `/polls` to see a list of polls you have created.
5.  **Vote on a Poll**: Click on a poll to view its details and cast your vote. You can also share the poll link for others to vote.
6.  **Edit/Delete a Poll**: From your dashboard, you can edit or delete polls you own.

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!