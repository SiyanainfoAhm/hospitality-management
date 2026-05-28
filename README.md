# Smart Hospitality Management System

Cloud-based solution for 82-room institutional guest house operations (IIM Nagpur).

![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## Features

- **Dashboard** — Real-time KPIs, room status grid (82 rooms), occupancy & revenue charts
- **Room Management** — Grid/list view, filters by floor/type/status, status updates
- **Reservations** — Create/search/manage bookings with full guest details
- **Check-in / Check-out** — Today's arrivals/departures, one-click actions, invoice generation
- **Housekeeping** — Kanban board (Dirty → Assigned → Cleaning → Clean → Inspected)
- **F&B POS** — Menu grid, cart, room service/restaurant orders, bill posting
- **Billing & Invoicing** — GST-style invoices, payment tracking, print/download
- **Reports** — Daily/monthly reports, occupancy %, ADR, RevPAR, staff performance
- **Settings** — User management, roles, room types, rate plans, menu management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui pattern, Radix UI primitives |
| Icons | Lucide React |
| Charts | Recharts |
| Backend & Auth | Supabase (Postgres + Auth + Realtime) |
| Deployment | Vercel (recommended) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Setup Steps

#### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings > API

#### 2. Run the Database Schema

1. Open the SQL Editor in your Supabase dashboard
2. Copy the contents of `/supabase/schema.sql` and execute it
3. This creates all tables, indexes, RLS policies, and triggers

#### 3. Run RBAC (roles & permissions)

1. In the SQL Editor, copy and execute `/supabase/rbac.sql`
2. This adds the permissions table, helper functions (`get_my_role`, `has_permission`), RLS policies, and demo users

#### 4. Run the Seed Data

1. In the SQL Editor, copy and execute `/supabase/seed.sql`
2. This populates the database with realistic demo data (82 rooms, guests, reservations, etc.)

#### 5. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-long-random-secret
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

`SUPABASE_SERVICE_ROLE_KEY` is **server-only** (API routes, user creation). Never expose it to the browser.

#### 6. Install Dependencies

```bash
npm install
```

#### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials (RBAC testing)

After running `rbac.sql`, use these accounts (password for all: **password123**):

| Role | Email | What you should see |
|------|-------|---------------------|
| Admin | admin@iimdemo.com | Full sidebar, all actions |
| Front Desk | frontdesk@iimdemo.com | Dashboard, Rooms, Reservations, Check-in/Out only |
| Housekeeping | housekeeping@iimdemo.com | Dashboard, Rooms, Housekeeping only |
| F&B Manager | fnb@iimdemo.com | Dashboard, F&B POS, Billing (read-only) |
| Accounts | accounts@iimdemo.com | Dashboard, Billing, Reports; Reservations read-only |

Legacy seed users (`admin@iimn.ac.in` / `admin123`, etc.) still work if present from `schema.sql`.

### Role-based access control

- **Database**: `hotel_management_permissions` + `has_permission()` / `get_my_role()` in `rbac.sql`
- **API**: Every route checks permissions via `requirePermission()` (returns 403 if denied)
- **UI**: `ProtectedRoute`, filtered sidebar, `PermissionGate` on buttons
- **User creation**: `POST /api/admin/create-user` (admin only, service role server-side)

To verify RBAC, log in as each demo user and confirm menu items and buttons match the table above. Direct URL access to forbidden modules (e.g. `/settings` as Front Desk) shows **Access Restricted**.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard
│   ├── rooms/              # Room management
│   ├── reservations/       # Booking management
│   ├── checkin/            # Check-in/out operations
│   ├── housekeeping/       # Housekeeping kanban
│   ├── fnb/                # F&B point of sale
│   ├── billing/            # Invoicing & payments
│   ├── reports/            # Analytics & reports
│   ├── settings/           # Admin settings
│   └── login/              # Authentication
├── components/
│   ├── ui/                 # Reusable UI components
│   └── layout/             # App layout (sidebar, header)
├── lib/                    # Utilities & Supabase clients
└── types/                  # TypeScript type definitions

supabase/
├── schema.sql              # Database schema
├── rbac.sql                # Roles, permissions, RLS, demo users
└── seed.sql                # Demo seed data
```

## Database Schema

The system uses 20 tables covering all hospitality operations:

- `profiles`, `rooms`, `room_types`, `rate_plans`, `seasons`
- `guests`, `reservations`, `reservation_addons`, `checkins`
- `housekeeping_tasks`, `maintenance_requests`
- `fnb_categories`, `fnb_items`, `fnb_orders`, `fnb_order_items`
- `invoices`, `invoice_items`, `payments`
- `audit_logs`

All tables have proper foreign keys, check constraints, indexes, and Row Level Security (RLS) policies.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

Built for IIM Nagpur Guest House tender evaluation demo.
