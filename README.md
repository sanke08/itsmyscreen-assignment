# ItsMyScreen Polls

A production-ready, real-time polling web application built with Next.js, Prisma, and Supabase.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Real-time**: Supabase Realtime Subscriptions
- **UI Components**: Shadcn UI + Tailwind CSS 4
- **Auth**: Manual JWT-based Session Management (HTTP-only cookies)
- **Validation**: Zod

---

## 🛠️ Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/sanke08/itsmyscreen-assignment.git
cd itsmyscreen-assignment
pnpm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
# Database URLs (Supabase)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Realtime
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"

# Auth
JWT_SECRET="your-super-secret-key"
```

### 3. Database Migration
```bash
pnpm prisma migrate dev --name init
npx prisma generate
```

### 4. Supabase Setup (CRITICAL)
For real-time updates to work, you MUST enable replication for the `Vote` table in your Supabase Dashboard:
1. Go to **Database** > **Replication**.
2. Click on **supabase_realtime** publication.
3. Toggle the **Vote** table to enabled.

Alternatively, run this in the SQL Editor:
```sql
alter publication supabase_realtime add table "Vote";
```

### 5. Run Locally
```bash
pnpm dev
```

---

## 🛡️ Anti-Abuse Mechanisms (3 Layers)

To ensure fairness without requiring mandatory logins for voters, we implemented three layers of protection:

1.  **Layer 1: HTTP-Only Cookies (Soft Check)**
    - Sets a `voted_[pollId]` cookie valid for 1 year upon voting.
    - Provides instant blocking before hitting the database.
2.  **Layer 2: IP Hashing (Hard Check)**
    - Extracts voter IP (via `x-forwarded-for`) and stores a SHA-256 hash.
    - Prevents multiple votes from the same network/location.
3.  **Layer 3: Browser Fingerprinting (Hard Check)**
    - Combines `userAgent`, `timezone`, and `screenSize` into a unique device hash.
    - Prevents users from switching browsers or using VPNs on the same device to re-vote.

---

## 🧩 Edge Cases Handled

- **Real-time Optimistic Updates**: UI updates instantly via Supabase subscriptions, but the client also performs lightweight local increments to reduce percibed latency.
- **Race Conditions**: Database-level unique constraints (`@@unique([pollId, ipHash])`) prevent duplicate entries if two requests arrive simultaneously.
- **Form Validation**: Strict server-side Zod validation for poll creation (min 2 options, unique options, min 5 char question).
- **Unauthorized Access**: Middleware protects `/dashboard` and `/create`, redirecting unauthenticated users to `/login`.
- **Invalid Polls**: Graceful 404 handling for non-existent poll IDs.

---

## ⚠️ Known Limitations & Future Improvements

### Current Limitations
- **VPNs/Proxies**: While fingerprinting helps, a determined user with multiple devices and rotating IPs could still bypass checks.
- **Supabase Realtime Quotas**: The current implementation relies on public replication which has broadcast limits on free tiers.

### Next Steps / Improvements
- **CAPTCHA**: Implement hCaptcha or reCAPTCHA to prevent automated bot voting.
- **Social Login**: Add OAuth (Google/GitHub) for poll creators for better UX.
- **Canvas Fingerprinting**: Use more advanced browser entropy (Canvas/WebGL) for even more robust device identification.
- **Analytics**: Add a dashboard for creators to see voting trends over time.
- **Poll Expiry**: Add the ability to set a "Close Date" for polls.

---

## 📄 License
MIT
