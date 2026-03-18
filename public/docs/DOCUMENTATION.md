# Soomro Law Associates - Legal Practice Management System

## Complete Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Technical Stack](#architecture--technical-stack)
3. [User Roles & Access Control](#user-roles--access-control)
4. [Authentication & Security](#authentication--security)
5. [Pages & Features](#pages--features)
6. [ITR Portal](#itr-portal)
7. [Offline-First Architecture](#offline-first-architecture)
8. [Native Mobile App (Capacitor)](#native-mobile-app-capacitor)
9. [Notification System](#notification-system)
10. [Broadcast System](#broadcast-system)
11. [AI Features](#ai-features)
12. [PWA & Installability](#pwa--installability)
13. [Database Schema & RLS Policies](#database-schema--rls-policies)
14. [Settings & Configuration](#settings--configuration)
15. [FAQs](#faqs)
16. [Version History](#version-history)

---

## Overview

Soomro Law Associates Legal Practice Management System (SLSCMS) is a comprehensive, offline-capable web application designed to streamline law firm operations. It provides tools for managing clients, cases, documents, appointments, invoicing, expense tracking, and team collaboration — all within a role-based access system.

### Key Highlights
- **Two user roles**: Admin (full control) and Team Member (scoped to assigned data)
- **Offline-first architecture**: Queue mutations offline, auto-sync on reconnect
- **Data freshness indicators**: Visual badges showing live/cached/offline status per page
- **Native mobile apps**: Packaged as iOS and Android apps via Capacitor
- **PWA support**: Installable as a Progressive Web App with service worker caching
- **Real-time notifications**: In-app bell notifications, push notifications (optional)
- **Broadcast system**: Admin-managed system-wide banners and announcements
- **AI analytics**: AI-powered dashboard insights (Admin only)
- **Voice assistant**: Voice-activated FAB for quick actions
- **Dark/Light theme**: System-aware with manual toggle
- **Comprehensive reporting**: Revenue, case, client, and expense analytics

---

## Architecture & Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library (Radix UI based) |
| React Router v6 | Client-side routing |
| TanStack React Query v5 | Server state management & caching |
| Recharts | Data visualization / charts |
| Framer Motion (via Tailwind animate) | Animations |
| next-themes | Dark/Light theme support |

### Backend (Lovable Cloud)
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Database with Row-Level Security (RLS) |
| Edge Functions (Deno) | Serverless API endpoints |
| Auth | Email/password authentication |
| Storage | File uploads (documents, receipts) |
| Realtime | Live data subscriptions |

### Mobile
| Technology | Purpose |
|------------|---------|
| Capacitor 8 | Native iOS/Android wrapper |
| Service Worker (Workbox) | Offline caching via vite-plugin-pwa |

### Key Libraries
| Library | Purpose |
|---------|---------|
| date-fns | Date formatting and manipulation |
| zod | Schema validation |
| react-hook-form | Form state management |
| lucide-react | Icon library |
| sonner | Toast notifications |
| cmdk | Command palette (search) |
| react-markdown | Markdown rendering |
| embla-carousel-react | Carousel/slider component |

---

## User Roles & Access Control

The system has **two active user roles**: Admin and Team Member. A `client` role exists in the database enum but the client portal has been removed — clients do not have portal access.

### 1. Admin
**Full system access with all privileges.**

| Capability | Details |
|------------|---------|
| View All Data | Access all clients, cases, documents, invoices, payments, expenses across the entire organization |
| Full CRUD | Create, read, update, and delete any record in any module |
| User Management | Create team members, assign roles, activate/block users |
| Role Assignment | Assign `admin` or `team_member` roles |
| Permissions Management | Configure module-level CRUD permissions per role |
| Financial Overview | Full access to invoices, payments, expenses, budgets, and reports |
| Credential Management | View and manage stored client credentials |
| Assignments | Bulk-assign clients and cases to team members |
| Reports & Analytics | Full reporting with export capabilities (PDF, Excel, CSV) |
| AI Analytics | AI-powered dashboard insights |
| Broadcast Management | Create/manage system-wide banner and modal announcements |
| ITR Portal Control | Enable/disable the seasonal ITR portal |
| System Settings | Configure dropdowns, signup settings, portal toggles |
| Bulk Operations | Import/export data in bulk (CSV) |

**Admin-Only Pages:**
- `/invoices` — Invoice management
- `/credentials` — Stored credentials
- `/users` — User management
- `/permissions` — Permission matrix
- `/assignments` — Bulk assignments
- `/reports` — Analytics & reports

### 2. Team Member
**Scoped access based on assignments.**

| Capability | Details |
|------------|---------|
| View Assigned Data | Only see clients/cases/documents assigned to them or created by them |
| Create Records | Can create new clients, cases, documents, appointments, payments, expenses |
| Edit Own Records | Can update records they created or are assigned to |
| Appointments | Manage their own appointments |
| Messages | Communicate within assigned client contexts |
| Expenses | Submit and track their own expenses |
| Settings | Access general settings and notification preferences |

**Team Member Pages:**
- `/dashboard` — Personal KPI overview
- `/clients` — Assigned clients only
- `/cases` — Assigned cases only
- `/documents` — Documents for assigned clients
- `/payments` — Payments for assigned clients
- `/expenses` — Own expenses only
- `/appointments` — Own appointments
- `/messages` — Messages for assigned clients
- `/settings` — Personal settings
- `/notifications` — Personal notifications
- `/itr` — ITR portal (when enabled)

### Permission Matrix (Database-Level RLS)

| Module | Admin | Team Member |
|--------|-------|-------------|
| Dashboard | Full stats | Own stats |
| Clients | All | Assigned/created only |
| Cases | All | Assigned/created only |
| Documents | All | Assigned client docs |
| Appointments | All | Own only |
| Invoices | All (create/edit/delete) | View assigned client invoices |
| Payments | All | View assigned client payments |
| Expenses | All (incl. approval) | Own only |
| Messages | All | Assigned client messages |
| Credentials | All | View assigned client credentials |
| Users | Full management | N/A |
| Permissions | Full management | View only |
| Reports | Full | N/A |
| Assignments | Full | N/A |
| Broadcasts | Full management | View targeted broadcasts |
| Settings | Full | Limited (personal) |
| ITR Portal | Full | Assigned returns only |

---

## Authentication & Security

### Authentication Flow
1. User navigates to `/login`
2. Enters email and password
3. Backend validates credentials
4. On success: session created, redirected to `/dashboard`
5. On failure: error message displayed

### Signup Flow
1. User navigates to `/signup`
2. Enters name, email, password, phone (optional), CNIC (optional)
3. Email verification sent (unless auto-confirm is enabled by admin)
4. After verification: profile created with `pending` status
5. Admin activates user and assigns role

### Password Recovery
1. User clicks "Forgot Password" on `/login`
2. Enters email on `/forgot-password`
3. Reset link sent via email
4. User sets new password

### Security Features
| Feature | Description |
|---------|-------------|
| Row-Level Security (RLS) | Every database table has RLS policies enforcing access control at the database level |
| Session Management | Persistent sessions with auto-refresh tokens |
| Security PIN | Optional admin PIN for sensitive operations (via `SecurityPinSettings` component) |
| TOTP Setup | Two-factor authentication setup component available |
| PIN Gate | PIN-protected access to sensitive modules |
| Protected Routes | Frontend route guards checking role before rendering |
| HTTPS | All traffic encrypted in transit |

### User Statuses
| Status | Description |
|--------|-------------|
| `pending` | Newly registered, awaiting admin activation |
| `active` | Full access granted |
| `blocked` | Access revoked by admin |

---

## Pages & Features

### Landing Page (`/`)
**Access: Public (unauthenticated)**

The public-facing landing page for the law firm. Features:
- Hero section with firm branding
- Feature highlights (Case Management, Document Storage, etc.)
- Call-to-action buttons for Login and Signup
- Responsive design for all screen sizes

---

### Login (`/login`)
**Access: Public**

- Email/password authentication
- "Remember me" session persistence
- Link to Forgot Password
- Link to Signup
- Redirects to `/dashboard` on success

---

### Signup (`/signup`)
**Access: Public (when enabled by admin)**

- Name, email, password fields
- Optional: phone, CNIC
- Email verification flow
- Signup can be toggled on/off by admin in Settings

---

### Forgot Password (`/forgot-password`)
**Access: Public**

- Email input for password reset link
- Sends reset email via backend auth

---

### Dashboard (`/dashboard`)
**Access: Admin, Team Member**

The main operational hub after login.

#### Admin Dashboard Features:
| Component | Description |
|-----------|-------------|
| Financial Summary Cards | Total Revenue, Monthly Revenue, Profit Margins, Outstanding Payments |
| Unassigned Counters | Count of clients and cases not yet assigned to any team member |
| Expense Breakdown Chart | Pie/bar chart of expenses by category |
| Activity Feed | Recent system-wide activity log |
| AI Analytics | AI-powered insights panel (Gemini/GPT-based analysis) |
| Data Freshness Indicator | Shows if dashboard data is live, cached, or offline |

#### Team Member Dashboard:
- Personal KPI cards (assigned clients, cases, upcoming appointments)
- Activity feed for their assigned records
- Data freshness indicator

---

### Clients (`/clients`)
**Access: Admin (all), Team Member (assigned/created)**

Full client lifecycle management.

| Feature | Description |
|---------|-------------|
| Client Table | Searchable, sortable, filterable data table |
| Add Client | Form with: Name, Type (Individual/Corporate/Government), Phone, Email, CNIC, Region, Status |
| Edit Client | Update any client field |
| Delete Client | Remove client record (Admin only) |
| Client Details | `/clients/:clientId` — Full client profile with cases, documents, payments |
| Bulk Import | CSV upload with template download |
| Export | PDF, Excel, CSV export |
| Assign to Team | Assign client to a team member |
| Data Freshness | Live/Cached/Offline indicator |

**Client Types:** Individual, Corporate, Government
**Client Statuses:** Active, Inactive

---

### Client Details (`/clients/:clientId`)
**Access: Admin, Team Member (if assigned)**

Detailed view of a single client with tabs/sections for:
- Client information and edit form
- Linked cases
- Linked documents
- Payment history
- Invoice history
- Appointment history
- Credential storage
- Case timeline

---

### Cases (`/cases`)
**Access: Admin (all), Team Member (assigned/created)**

Legal case tracking and management.

| Feature | Description |
|---------|-------------|
| Case List | Table view with status indicators |
| Kanban View | Drag-and-drop board organized by status |
| Add Case | Create case linked to a client |
| Edit Case | Update title, description, status, assignment |
| Case Timeline | Visual timeline of case activities |
| Case Activities | Add notes, updates, hearings, filings |
| Status Workflow | Active → In Progress → Pending → Closed → Archived |
| Bulk Import | CSV import |
| Export | PDF, Excel, CSV |
| Data Freshness | Live/Cached/Offline indicator |

**Case Statuses:** `open`, `in_progress`, `pending`, `closed`, `archived`

---

### Documents (`/documents`)
**Access: Admin (all), Team Member (assigned client docs)**

Secure document management with cloud storage.

| Feature | Description |
|---------|-------------|
| Document List | Filterable table of all documents |
| Upload | File upload with metadata (title, type, client, case) |
| Download | Secure file download |
| Categories | Organize by document type |
| Client/Case Link | Associate documents with specific clients and cases |
| Bulk Import | Metadata CSV import |
| Data Freshness | Live/Cached/Offline indicator |

---

### Payments (`/payments`)
**Access: Admin (all), Team Member (assigned client payments)**

Payment recording and tracking.

| Feature | Description |
|---------|-------------|
| Payment List | All recorded payments |
| Record Payment | Log payment with amount, date, client, case |
| Status Tracking | Pending, Completed, Failed, Refunded |
| Link to Invoice | Associate payment with an invoice |
| Payment ID | Auto-generated unique payment identifier |
| Export | PDF, Excel, CSV |
| Data Freshness | Live/Cached/Offline indicator |

---

### Invoices (`/invoices`)
**Access: Admin only**

Professional invoicing with line items and PDF export.

| Feature | Description |
|---------|-------------|
| Invoice List | All invoices with status badges |
| Create Invoice | Generate invoice linked to client and optional case |
| Line Items Editor | Add multiple items with description, quantity, unit price |
| Invoice Template | Professional branded invoice layout |
| PDF Export | Generate and download invoice as PDF |
| Status Tracking | Unpaid, Partially Paid, Paid, Overdue |
| Link to Payment | Connect invoice to recorded payment |
| Auto Invoice ID | System-generated invoice number |
| Data Freshness | Live/Cached/Offline indicator |

---

### Expenses (`/expenses`)
**Access: Admin (all + approval), Team Member (own only)**

Expense tracking with budget management and approval workflow.

| Feature | Description |
|---------|-------------|
| Expense List | View expenses with status filters |
| Submit Expense | Create expense with title, amount, date, category |
| Receipt Upload | Attach receipt image/document |
| Categories | Office, Travel, Legal, Utilities, etc. (configurable) |
| Approval Workflow | Team members submit → Admin approves/rejects |
| Budget Management | Set monthly spending limits per category (Admin) |
| Budget Alerts | Notification when spending exceeds threshold |
| Expense Reports | Analytics charts (Admin) |
| Expense Types | General, Reimbursable, etc. |
| Data Freshness | Live/Cached/Offline indicator |

**Expense Statuses:** `pending`, `approved`, `rejected`

---

### Appointments (`/appointments`)
**Access: Admin (all), Team Member (own only)**

Scheduling with calendar view and reminders.

| Feature | Description |
|---------|-------------|
| Calendar View | Visual month/week/day calendar |
| Create Appointment | Schedule with client, topic, date, time, duration, type |
| Types | In-Office, Outdoor, Virtual (Zoom, Google Meet, etc.) |
| Reminder System | Automated reminders via notifications |
| Reminder Dialog | Set custom reminder time before appointment |
| Status Tracking | Scheduled, Completed, Cancelled, Rescheduled |
| Platform Field | For virtual meetings — store meeting link/platform |
| Data Freshness | Live/Cached/Offline indicator |

---

### Messages (`/messages`)
**Access: Admin (all), Team Member (assigned clients)**

Threaded messaging system.

| Feature | Description |
|---------|-------------|
| Conversations | Organized by client with subject lines |
| Send Message | Compose and send within a conversation |
| Reply | Thread replies within conversations |
| Read/Unread | Track message read status |
| Unread Badge | Sidebar badge shows unread count |
| Real-time Updates | Messages update via polling/realtime |

---

### Credentials (`/credentials`)
**Access: Admin only**

Secure storage for client platform credentials.

| Feature | Description |
|---------|-------------|
| Credential List | All stored credentials organized by client |
| Add Credential | Store platform name, URL, username, password, PIN |
| Encrypted Storage | Passwords stored with encryption |
| Client Link | Each credential tied to a specific client |

---

### Users (`/users`)
**Access: Admin only**

User and team management.

| Feature | Description |
|---------|-------------|
| User List | All registered users with role and status |
| Create User | Add new team member accounts |
| Edit User | Update profile information |
| Role Assignment | Set user as Admin or Team Member |
| Status Control | Activate, block, or set pending status |
| Profile View | View user details including email, phone, CNIC |

---

### Permissions (`/permissions`)
**Access: Admin only**

Granular module-level permission control.

| Feature | Description |
|---------|-------------|
| Permission Matrix | Grid of roles × modules × actions |
| Module List | All system modules listed |
| Action Types | Can Create, Can Read, Can Read Own, Can Update, Can Delete, Can Export |
| Per-Role Config | Set different permissions for `admin` and `team_member` |
| PIN Protection | Optional PIN-protected permission changes |

---

### Assignments (`/assignments`)
**Access: Admin only**

Bulk assignment management for clients and cases.

| Feature | Description |
|---------|-------------|
| View Assignments | See all current client/case assignments |
| Bulk Assign | Assign multiple clients/cases to a team member at once |
| Reassign | Transfer assignments between team members |
| Unassigned Filter | Quickly find records without assignments |

---

### Reports (`/reports`)
**Access: Admin only**

Comprehensive analytics and reporting.

| Feature | Description |
|---------|-------------|
| Revenue Reports | Financial analytics with charts |
| Case Reports | Case status distribution and trends |
| Client Reports | Client activity and growth metrics |
| Expense Reports | Spending analysis by category |
| Date Filters | Filter reports by custom date ranges |
| Export | Download reports as PDF or Excel |

---

### Notifications (`/notifications`)
**Access: Admin, Team Member**

In-app notification center.

| Feature | Description |
|---------|-------------|
| Notification List | All notifications with type icons |
| Read/Unread | Toggle read status |
| Types | Info (blue), Success (green), Warning (amber), Error (red) |
| Bell Icon | Header bell with unread count badge |
| Notification Preferences | Configure which notifications to receive |
| Push Notifications | Optional browser push notifications |

---

### Settings (`/settings`)
**Access: Admin (full), Team Member (limited)**

System and personal configuration.

| Tab | Access | Description |
|-----|--------|-------------|
| General | All | Basic profile and app settings |
| Dropdown Options | Admin | Configure dropdown values for forms (regions, categories, etc.) |
| Portals | Admin | Enable/disable ITR Portal |
| Signup Settings | Admin | Toggle public user registration |
| Notification Preferences | All | Configure notification channels and types |
| Security PIN | Admin | Set up security PIN for sensitive operations |
| Navigation Customizer | All | Customize sidebar navigation order |

---

## ITR Portal

**Seasonal Income Tax Return Management Portal**

The ITR Portal is a specialized sub-system for managing annual income tax return filings. It is enabled/disabled by Admin via Settings → Portals.

### Enabling ITR Portal
1. Go to Settings → Portals tab
2. Toggle "ITR Portal" to ON
3. "ITR Portal" appears in sidebar navigation
4. Portal appears at `/itr` routes

### ITR Layout (`/itr`)
Nested layout with its own sub-navigation:
- Dashboard (`/itr` or `/itr/dashboard`)
- Clients (`/itr/clients`)
- Extensions (`/itr/extensions`)

### ITR Dashboard (`/itr`)
**Access: Admin, Team Member**

Overview statistics for the tax season:

| Metric | Description |
|--------|-------------|
| Total Clients | Count of ITR clients for selected year |
| Pending Returns | Returns not yet filed |
| Filed Returns | Completed returns |
| Total Revenue | Sum of all ITR payment amounts |
| Collection Rate | Percentage of paid vs total |
| Extension Count | Number of clients with extensions |

**Charts:**
- Progress Distribution (pie chart by stage)
- Payment Status (bar chart)

**Filters:** By Fiscal Year, All Time view

### ITR Clients (`/itr/clients`)
**Access: Admin (all), Team Member (assigned)**

Main client management for ITR filings:

| Column | Description |
|--------|-------------|
| SR. No | Serial number |
| Title | Client name or custom title |
| Year | Fiscal year (FY25, FY26, etc.) |
| Type | Individual / Business |
| Bank Statement | Button to manage bank statements per client |
| Progress | Visual progress bar (0–100%) |
| Payment | Amount for ITR service |
| Payment Status | FOC (Free of Cost), Unpaid, Partially Paid, Paid |
| Assigned To | Team member assigned to this return |
| Actions | Edit, Apply Extension, Export Invoice, Delete |

**Progress Stages:**

| Stage | Percentage | Color |
|-------|------------|-------|
| Pending | 0% | Gray |
| Bank Statement Compiled | 50% | Amber |
| Drafted | 80% | Blue |
| Discussion | 95% | Purple |
| Filed | 100% | Green |

**Bank Statement Management:**
- Click "View" on Bank Statement column
- Add bank names for the client (persisted across years)
- Track status per bank: Pending, Working, Compiled
- Banks are stored per-client in `itr_client_banks` table

**Features:**
- Add single client return
- Bulk add clients (select from active clients list)
- Edit return details inline
- Apply for FBR date extension
- Export invoice PDF for the return
- Delete return

### ITR Extensions (`/itr/extensions`)
**Access: Admin, Team Member**

Track clients requiring FBR filing date extensions:

| Column | Description |
|--------|-------------|
| SR. No | Serial number |
| Client Name | Client name |
| Extension Status | Pending, Approved, Rejected |
| Fiscal Year | Year label |
| Actions | Update status |

### Fiscal Year Management
Admin can create and manage fiscal years from the ITR Dashboard:
1. Click "New Year" button
2. Enter Year Label (e.g., "FY26")
3. Set Start Date (typically July 1)
4. Set End Date (typically June 30)
5. Toggle Active status

---

## Offline-First Architecture

The system is built with an offline-first approach, allowing continued use during network outages.

### Pre-Caching on Login (Phase 1)
After authentication, the system automatically pre-fetches and caches data for critical pages:

| Query Key | Data |
|-----------|------|
| `['clients']` | All accessible clients |
| `['cases']` | All accessible cases |
| `['appointments']` | All accessible appointments |
| `['payments']` | All accessible payments |
| `['expenses']` | All accessible expenses |
| `['documents']` | All accessible documents |

This runs silently in the background via `usePrefetchCriticalData` hook without blocking the UI.

### Data Freshness Indicators (Phase 2)
Every data page shows a pill-shaped badge indicating data status:

| Status | Indicator | Condition |
|--------|-----------|-----------|
| Live | 🟢 Green dot + "Live" | Data fetched within last 5 minutes |
| Cached | 🟡 Amber dot + "Cached - X min ago" | Data older than 5 minutes |
| Offline | 🔴 Red dot + "Offline" | No network connection |
| Fetching | ⏳ Spinner | Currently refreshing data |

Visible on: Dashboard, Clients, Cases, Payments, Invoices, Expenses, Appointments, Documents

### Offline Queue System (Phase 3)
When offline, CRUD operations are queued locally and synced when connectivity returns.

**Queue Architecture:**
```
User Action → Offline Queue (localStorage) → Sync Engine (on reconnect) → Database
```

**Queue Item Structure:**
```json
{
  "queueId": "unique-id",
  "table": "clients",
  "operation": "create | update | delete",
  "data": { "...record fields..." },
  "recordId": "uuid",
  "timestamp": 1707300000000,
  "status": "pending | syncing | failed",
  "retryCount": 0
}
```

**Conflict Resolution:**
| Operation | Strategy |
|-----------|----------|
| Create | Always applies (server assigns final ID) |
| Update | Compare local `timestamp` vs server `updated_at`; server wins if newer, user notified |
| Delete | Attempt delete; if already deleted, silently succeed |

**UI Components:**
- **PendingChangesIndicator**: Shows count of unsynced changes in the header (cloud icon with badge)
- **SyncStatusBar**: Shows sync progress during reconnection ("Syncing 3 changes...")

---

## Native Mobile App (Capacitor)

The application is packaged as a native iOS and Android app using Capacitor 8.

### Configuration
```
App ID: app.lovable.e1ab17bcbb7147e792cb026304b74a81
App Name: slscms
```

### Safe Area Handling
- CSS `env(safe-area-inset-*)` variables handle device notches and home indicators
- Bottom navigation includes safe-area padding
- Main content area has safe-area-aware spacing

### Building Native Apps
1. Export project to GitHub
2. Clone and run `npm install`
3. Run `npx cap add ios` / `npx cap add android`
4. Run `npm run build && npx cap sync`
5. Open in Xcode (`npx cap open ios`) or Android Studio (`npx cap open android`)
6. Build and deploy to device/store

---

## Notification System

### In-App Notifications
- Bell icon in header shows unread count
- Notifications page lists all notifications
- Types: Info, Success, Warning, Error
- Mark as read/unread
- Entity linking (click notification to navigate to related record)

### Push Notifications (Optional)
- Browser push notification support via `usePushNotifications` hook
- Subscription stored in `push_subscriptions` table
- Service worker handles push events

### Notification Preferences
Users can configure per `notification_preferences` table:
- Email notifications (on/off)
- Push notifications (on/off)
- SMS notifications (on/off)
- Per-type toggles: Case updates, Document uploads, Appointment reminders, Invoice alerts, Message notifications, System announcements

### Automated Notifications
- Appointment reminders (configurable minutes before)
- Expense budget threshold alerts
- New message notifications

---

## Broadcast System

**Admin-managed system-wide announcements.**

### Broadcast Types
| Type | Description |
|------|-------------|
| Banner | Dismissible bar at top of the app |
| Modal | Overlay dialog requiring attention |

### Broadcast Targeting
| Target Type | Description |
|-------------|-------------|
| All | Every authenticated user |
| Role | Specific role (admin or team_member) |
| User | Specific individual user |

### Broadcast Properties
- Title and content
- Priority: Info, Warning, Critical
- Schedule: Start date/time, optional end date
- Active toggle
- Dismissible by users (tracked in `broadcast_dismissals`)

### Management
Admin creates/manages broadcasts via the Broadcast Manager component accessible from the admin interface.

---

## AI Features

### AI Analytics (Dashboard)
Admin-only AI-powered analytics panel on the dashboard. Uses Lovable AI models (Gemini/GPT) to generate insights from:
- Revenue trends
- Case load analysis
- Client growth patterns
- Expense anomalies

### AI Assistant
Conversational AI assistant accessible via edge function (`ai-assistant`). Can answer questions about:
- Case status
- Client information
- System usage

### Voice Assistant
Floating action button (VoiceFAB) for voice-activated commands when authenticated.

---

## PWA & Installability

### Progressive Web App
- Service worker via `vite-plugin-pwa` with Workbox
- NetworkFirst caching for API calls
- CacheFirst for static assets
- Install prompt component (`PWAInstallPrompt`)

### Installable
- Add to home screen on mobile browsers
- Standalone app experience
- Offline capable with queued sync

---

## Database Schema & RLS Policies

### Core Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `profiles` | User profiles (name, email, phone, CNIC, status, avatar) | Users: own; Team: team profiles; Admin: all |
| `user_roles` | Role assignments (admin, team_member, client) | Users: own role; Admin: all |
| `clients` | Client records | Admin: all; Team: assigned/created |
| `cases` | Legal cases linked to clients | Admin: all; Team: assigned/created |
| `documents` | Uploaded documents | Admin: all; Team: assigned client docs |
| `appointments` | Scheduled appointments | Admin: all; Team: own |
| `payments` | Payment records | Admin: all; Team: assigned client payments |
| `invoices` | Invoice records with line items | Admin: all; Team: view assigned |
| `invoice_line_items` | Individual line items per invoice | Admin: all; Team: view assigned |
| `expenses` | Expense submissions | Admin: all; Team: own |
| `expense_budgets` | Monthly budget limits per category | Admin: manage; Team: view |
| `credentials` | Stored client credentials | Admin: all; Team: view assigned |
| `messages` | Chat messages | Admin: all; Team: assigned client messages |
| `conversations` | Message threads | Admin: all; Team: assigned |
| `notifications` | User notifications | Own only |
| `notification_preferences` | Notification settings | Own only |
| `broadcast_messages` | System announcements | Admin: manage; Users: view targeted |
| `broadcast_dismissals` | Dismissed broadcasts | Own only |
| `activity_logs` | System activity audit trail | Based on entity access |
| `permissions` | Module-level permission matrix | Admin: manage; Auth users: view |
| `user_permissions` | Individual user permission overrides | Admin: manage; Own: view |
| `user_preferences` | User UI preferences | Own only |

### ITR Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `itr_fiscal_years` | Tax year definitions | Admin: manage; Auth: view |
| `itr_returns` | Individual tax return records | Admin: all; Team: assigned |
| `itr_client_banks` | Client bank accounts | Admin: all; Team: assigned client |
| `itr_bank_statements` | Bank statement tracking per return | Admin: all; Team: assigned |

### Other Tables

| Table | Description |
|-------|-------------|
| `dropdown_options` | Configurable dropdown values |
| `signup_settings` | Registration toggle settings |
| `custom_forms` | Dynamic form builder forms |
| `form_assignments` | Form assignments to users |
| `form_submissions` | Submitted form data |
| `push_subscriptions` | Push notification subscriptions |
| `client_access` | Client-to-user linkage (legacy) |

### Database Functions

| Function | Description |
|----------|-------------|
| `is_admin()` | Returns true if current user has admin role |
| `has_role(_user_id, _role)` | Check if user has specific role (SECURITY DEFINER) |
| `get_user_status(_user_id)` | Get user's account status |
| `is_active_user()` | Check if current user is active |

### Database Enums

| Enum | Values |
|------|--------|
| `app_role` | admin, team_member, client |
| `user_status` | pending, active, blocked |

---

## Settings & Configuration

### Dropdown Options
Admin can configure dropdown values used throughout the app:
- Client regions
- Expense categories
- Document types
- Any custom category

Managed via `dropdown_options` table with category, label, value, sort order, and active toggle.

### Signup Settings
Admin can control whether public user registration is enabled via `signup_settings` table.

### Portal Toggles
- ITR Portal: Enable/disable via Settings → Portals

### Navigation Customization
Users can customize their sidebar navigation order via `NavCustomizer` component, stored in `user_preferences`.

---

## FAQs

### General

**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page. Enter your email to receive a reset link.

**Q: Can I access the system on mobile?**
A: Yes. The app is fully responsive, installable as a PWA, and available as native iOS/Android apps via Capacitor.

**Q: How is my data secured?**
A: Data is encrypted in transit (HTTPS) and at rest. Row-Level Security (RLS) policies on every table ensure users can only access authorized data.

**Q: What happens when I lose internet?**
A: The app continues working with cached data. Any changes you make are queued offline and automatically synced when you reconnect. A "Pending Changes" indicator shows how many unsynced operations are waiting.

**Q: How do I know if my data is up-to-date?**
A: Each page shows a Data Freshness indicator — green "Live" means fresh data, amber "Cached" means stale (with timestamp), red "Offline" means no connection.

---

### Clients & Cases

**Q: How do I bulk import clients?**
A: Go to Clients → Click "Bulk Import" → Download CSV template → Fill in data → Upload.

**Q: Can I assign multiple team members to a case?**
A: Currently, each case has one primary assignee. Use case activities/notes for secondary contacts.

**Q: How do I export client data?**
A: Click the export button on the Clients page and select PDF, Excel, or CSV format.

---

### Invoicing

**Q: How do I add multiple line items to an invoice?**
A: When creating/editing an invoice, use the Line Items Editor to add rows with description, quantity, and unit price. Totals calculate automatically.

**Q: Can I generate a PDF invoice?**
A: Yes. Each invoice has a "Download PDF" option that generates a professionally formatted invoice document.

**Q: How do I track partial payments?**
A: Update the invoice status to "Partially Paid" and record the partial payment amount in the Payments module.

---

### ITR Portal

**Q: Why don't I see the ITR Portal?**
A: The ITR Portal must be enabled by an Admin. Go to Settings → Portals → Toggle ITR Portal ON.

**Q: How do I add banks for a client?**
A: In ITR Clients, click "View" on the Bank Statement column. Add bank names in the dialog.

**Q: Do I need to re-add banks each year?**
A: No. Banks are stored per-client in `itr_client_banks` and persist across fiscal years.

**Q: What is an extension?**
A: An FBR filing date extension request. Click "Apply Extension" on the client row in ITR Clients.

**Q: How is progress calculated?**
A: Progress is set manually per return:
- Pending (0%) → Bank Statement Compiled (50%) → Drafted (80%) → Discussion (95%) → Filed (100%)

---

### Technical

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions). PWA install supported on Chrome and Edge.

**Q: Can I install this as a mobile app?**
A: Yes. Use the PWA install prompt in your browser, or build native apps via Capacitor for iOS/Android.

**Q: How do I build the native mobile app?**
A: Export to GitHub, clone locally, run `npm install`, `npm run build`, `npx cap sync`, then open in Xcode or Android Studio.

---

## Edge Functions

| Function | Description |
|----------|-------------|
| `ai-analytics` | AI-powered dashboard analytics (Admin) |
| `ai-assistant` | Conversational AI assistant |
| `expense-notification` | Automated expense budget alerts |
| `send-appointment-reminder` | Appointment reminder notifications |

---

## UI Components Library

The system uses **shadcn/ui** components built on Radix UI primitives:

| Component | Usage |
|-----------|-------|
| DataTable | Sortable, filterable tables with pagination |
| EditableDataTable | Inline-editable table cells |
| SearchableCombobox | Autocomplete dropdown selectors |
| KPICard | Dashboard metric cards |
| StatusBadge | Color-coded status indicators |
| MarkdownRenderer | Rich text display |
| Calendar | Date picker and calendar views |

---

## Support

For technical support or feature requests, contact:
- **Email**: support@soomrolaw.com
- **Phone**: +92-XXX-XXXXXXX

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025 | Initial release |
| 1.1.0 | 2025 | Added ITR Portal |
| 1.2.0 | 2025 | Added bulk import, invoice line items |
| 1.3.0 | 2025 | Added client portal, broadcasts, permissions matrix |
| 2.0.0 | 2026 | Removed client portal, simplified UX, offline-first architecture, Capacitor mobile app, data freshness indicators, offline queue system |

---

*Documentation last updated: March 2026*
