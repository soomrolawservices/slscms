# Soomro Law Associates - Legal Practice Management System

## Complete Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Pages & Features](#pages--features)
4. [ITR Portal](#itr-portal)
5. [Client Portal](#client-portal)
6. [Security & Permissions](#security--permissions)
7. [FAQs](#faqs)

---

## Overview

Soomro Law Associates Legal Practice Management System is a comprehensive web application designed to streamline law firm operations. It provides tools for managing clients, cases, documents, appointments, invoicing, and team collaboration.

### Key Features
- **Multi-role access control** (Admin, Team Member, Client)
- **Client & Case Management** with full CRUD operations
- **Document Management** with secure storage
- **Appointment Scheduling** with reminders
- **Invoicing & Payment Tracking**
- **Expense Management** with budgets and approvals
- **Seasonal ITR (Income Tax Return) Portal**
- **Client Self-Service Portal**
- **Real-time Notifications**
- **Comprehensive Reporting & Analytics**

---

## User Roles

### 1. Admin
**Full system access with all privileges**

| Permission | Description |
|------------|-------------|
| View All Data | Access all clients, cases, documents across the organization |
| Create/Edit/Delete | Full CRUD on all entities |
| User Management | Create, edit, block/activate users |
| Role Assignment | Assign roles to team members |
| System Settings | Configure portals, permissions, dropdowns |
| Financial Access | View all invoices, payments, expenses |
| Bulk Operations | Import/export data in bulk |
| ITR Portal Control | Enable/disable seasonal ITR portal |

### 2. Team Member
**Limited access based on assignments**

| Permission | Description |
|------------|-------------|
| View Assigned Data | Only see clients/cases assigned to them |
| Create Records | Can create new clients, cases, documents |
| Edit Own Records | Can edit records they created or are assigned to |
| Appointments | Manage their own appointments |
| Messages | Communicate with assigned clients |
| Expenses | Submit and track their own expenses |

### 3. Client (Portal User)
**Self-service portal access**

| Permission | Description |
|------------|-------------|
| View Own Data | See their cases, documents, invoices |
| Book Appointments | Request appointments with team |
| Messaging | Communicate with assigned team members |
| Document Access | View and download shared documents |
| Invoice View | View invoices and payment status |

---

## Pages & Features

### Dashboard (`/dashboard`)
**Role: Admin, Team Member**

The main dashboard provides an overview of:
- **KPI Cards**: Total clients, active cases, revenue metrics
- **Charts**: Revenue trends, case status distribution
- **Recent Activity**: Latest updates across the system
- **AI Analytics**: AI-powered insights (Admin only)

---

### Clients (`/clients`)
**Role: Admin, Team Member**

Manage all client records.

| Feature | Description |
|---------|-------------|
| Client List | Searchable, filterable table of all clients |
| Add Client | Create new client with name, email, phone, CNIC, type |
| Edit Client | Update client information |
| Delete Client | Remove client (Admin only) |
| Bulk Import | Import clients from CSV file |
| Export | Export to PDF, Excel, CSV |
| Assign | Assign clients to team members |

**Client Types:**
- Individual
- Business

**Client Status:**
- Active
- Inactive

---

### Cases (`/cases`)
**Role: Admin, Team Member**

Track legal cases and matters.

| Feature | Description |
|---------|-------------|
| Case List | View all cases with status indicators |
| Add Case | Create case linked to client |
| Case Details | View case history and documents |
| Status Updates | Track progress (Active, Pending, Closed) |
| Assignments | Assign cases to team members |
| Bulk Import | Import cases from CSV |

---

### Documents (`/documents`)
**Role: Admin, Team Member**

Secure document management.

| Feature | Description |
|---------|-------------|
| Document List | All uploaded documents |
| Upload | Add new documents with metadata |
| Categories | Organize by document type |
| Client/Case Link | Associate documents with clients/cases |
| Download | Secure file downloads |
| Bulk Import | Import document metadata |

---

### Appointments (`/appointments`)
**Role: Admin, Team Member**

Schedule and manage appointments.

| Feature | Description |
|---------|-------------|
| Calendar View | Visual appointment calendar |
| Create Appointment | Schedule with client/topic/time |
| Types | In-office, Online (Zoom, Google Meet) |
| Reminders | Automated reminder notifications |
| Status | Scheduled, Completed, Cancelled |

---

### Invoices (`/invoices`)
**Role: Admin, Team Member**

Professional invoicing system.

| Feature | Description |
|---------|-------------|
| Invoice List | All invoices with status |
| Create Invoice | Generate with multiple line items |
| Line Items | Add description, quantity, unit price |
| PDF Export | Professional invoice PDF generation |
| Status Tracking | Unpaid, Partially Paid, Paid |
| Link to Payment | Connect invoices to payments |

---

### Payments (`/payments`)
**Role: Admin, Team Member**

Track all payment transactions.

| Feature | Description |
|---------|-------------|
| Payment List | All recorded payments |
| Record Payment | Log new payments |
| Status | Pending, Completed, Failed |
| Link to Invoice | Associate with invoices |
| Receipts | Generate payment receipts |

---

### Expenses (`/expenses`)
**Role: Admin, Team Member**

Expense tracking and budgeting.

| Feature | Description |
|---------|-------------|
| Expense List | View all expenses |
| Submit Expense | Create expense records |
| Categories | Organize by expense type |
| Receipt Upload | Attach receipt images |
| Approval Workflow | Admin approval required |
| Budget Management | Set monthly budgets per category |
| Reports | Expense analytics and reports |

---

### Messages (`/messages`)
**Role: Admin, Team Member**

Internal and client communication.

| Feature | Description |
|---------|-------------|
| Conversations | Threaded message conversations |
| Client Messaging | Communicate with clients |
| Reply | Respond to messages |
| Read Status | Track read/unread messages |

---

### Credentials (`/credentials`)
**Role: Admin, Team Member**

Secure credential storage for clients.

| Feature | Description |
|---------|-------------|
| Credential List | Client platform credentials |
| Add Credential | Store username/password/PIN |
| Encryption | Passwords stored encrypted |
| View | Secure credential viewing |

---

### Users (`/users`)
**Role: Admin only**

User management and roles.

| Feature | Description |
|---------|-------------|
| User List | All system users |
| Create User | Add new team members |
| Role Assignment | Assign Admin/Team Member roles |
| Status | Active, Pending, Blocked |
| Edit Profile | Update user information |

---

### Permissions (`/permissions`)
**Role: Admin only**

Fine-grained access control.

| Feature | Description |
|---------|-------------|
| Role Permissions | Set permissions per role |
| Module Access | Control access to each module |
| CRUD Permissions | Read, Create, Update, Delete per module |
| Export Permission | Control export capabilities |

---

### Settings (`/settings`)
**Role: Admin, Team Member**

System configuration.

| Tabs | Description |
|------|-------------|
| General | Basic settings |
| Dropdown Options | Configure dropdown values |
| Portals | Enable/disable Client Portal, ITR Portal |
| Signup Settings | Control user registration |

---

### Reports (`/reports`)
**Role: Admin, Team Member**

Analytics and reporting.

| Feature | Description |
|---------|-------------|
| Revenue Reports | Financial analytics |
| Case Reports | Case status summaries |
| Client Reports | Client activity metrics |
| Export | Download reports as PDF/Excel |

---

### Assignments (`/assignments`)
**Role: Admin**

Bulk assignment management.

| Feature | Description |
|---------|-------------|
| View Assignments | See all client/case assignments |
| Bulk Assign | Assign multiple records at once |
| Reassign | Transfer assignments between members |

---

### Notifications (`/notifications`)
**Role: All**

System notifications.

| Feature | Description |
|---------|-------------|
| Notification List | All notifications |
| Read/Unread | Track notification status |
| Types | Info, Warning, Success, Error |
| Bell Icon | Quick access from header |

---

## ITR Portal

**Seasonal Income Tax Return Management Portal**

The ITR Portal is a specialized sub-system for managing annual income tax return filings. It operates from July to October and is enabled/disabled by Admin.

### Enabling ITR Portal
1. Go to Settings → Portals
2. Toggle "ITR Portal" to ON
3. Portal appears in navigation

### ITR Dashboard (`/itr/dashboard`)

Overview statistics:
- Total Clients
- Pending Returns
- Filed Returns
- Total Revenue
- Collection Rate
- Extension Count

Charts:
- Progress Distribution (pie chart)
- Payment Status (bar chart)

Filter by:
- Fiscal Year
- All Time view

### ITR Clients (`/itr/clients`)

Main client management for ITR:

| Column | Description |
|--------|-------------|
| SR. No | Serial number |
| Title | Client name/custom title |
| Year | Fiscal year (FY25, FY26, etc.) |
| Type | Individual/Business |
| Bank Statement | Button to manage bank statements |
| Progress | Visual progress bar (0-100%) |
| Payment | Amount for ITR service |
| Status | FOC, Unpaid, Partially Paid, Paid |
| Assigned To | Team member assigned |

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
- Add bank names for client
- Track status per bank: Pending, Working, Compiled
- Banks are stored per-client (reusable across years)

**Features:**
- Add Client Return
- Bulk Add Clients (select from active clients)
- Edit return details
- Apply Extension
- Export Invoice PDF
- Delete return

### ITR Extensions (`/itr/extensions`)

Track clients requiring FBR date extensions:

| Column | Description |
|--------|-------------|
| SR. No | Serial number |
| Client Name | Client name |
| Status | Pending, Approved, Rejected |
| Year | Fiscal year |
| Actions | Update status |

### Fiscal Year Management

Create new fiscal years from ITR Dashboard:
1. Click "New Year" button
2. Enter Year Label (e.g., "FY26")
3. Set Start Date (July 1)
4. Set End Date (June 30)
5. Toggle Active status

---

## Client Portal

**Self-Service Portal for Clients**

Clients access their dedicated portal at `/client-login`.

### Features

1. **Dashboard**
   - Case overview
   - Recent activity
   - Upcoming appointments

2. **Documents**
   - View shared documents
   - Download files

3. **Appointments**
   - View scheduled appointments
   - Request new appointments

4. **Invoices**
   - View all invoices
   - See payment status

5. **Messages**
   - Send messages to team
   - View responses

### Client Portal Access
1. Admin creates client account
2. Links user to client record
3. Client logs in with email/password
4. Accesses portal dashboard

---

## Security & Permissions

### Authentication
- Email/password authentication
- Auto-confirm email for development
- Session-based login
- Protected routes

### Row Level Security (RLS)
All database tables have RLS policies:
- Admins: Full access to all data
- Team Members: Access to assigned records only
- Clients: Access to own linked records only

### Permission Levels

| Module | Admin | Team Member | Client |
|--------|-------|-------------|--------|
| Dashboard | Full | Own stats | N/A |
| Clients | Full | Assigned | Own |
| Cases | Full | Assigned | Own |
| Documents | Full | Assigned | Shared |
| Appointments | Full | Own | Own |
| Invoices | Full | Assigned | Own |
| Payments | Full | Assigned | View |
| Expenses | Full | Own | N/A |
| Users | Full | N/A | N/A |
| Settings | Full | Limited | N/A |

---

## FAQs

### General

**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page and follow the email instructions.

**Q: Can I access the system on mobile?**
A: Yes, the system is fully responsive and works on all devices.

**Q: How is my data secured?**
A: Data is encrypted in transit and at rest. Row-level security ensures users only access authorized data.

---

### Clients & Cases

**Q: How do I bulk import clients?**
A: Go to Clients page → Click "Bulk Import" → Download template → Fill CSV → Upload.

**Q: Can I assign multiple team members to a case?**
A: Currently, each case has one primary assignee. Use notes for secondary contacts.

**Q: How do I export client data?**
A: Click the export button and select PDF, Excel, or CSV format.

---

### Invoicing

**Q: How do I add multiple line items to an invoice?**
A: When creating/editing an invoice, use the Line Items section to add multiple items with quantity and unit price.

**Q: Can I customize invoice templates?**
A: The invoice PDF uses a standard professional template. Contact admin for customization needs.

**Q: How do I track partial payments?**
A: Update the invoice status to "Partially Paid" and record partial payment amounts.

---

### ITR Portal

**Q: Why don't I see the ITR Portal?**
A: The ITR Portal must be enabled by an Admin. Go to Settings → Portals → Enable ITR Portal.

**Q: How do I add banks for a client?**
A: In ITR Clients, click "View" on Bank Statement column, then add bank names.

**Q: Do I need to re-add banks each year?**
A: No, banks are stored per-client and persist across fiscal years.

**Q: What is an extension in ITR?**
A: An extension requests additional time from FBR for filing. Click "Apply Extension" on the client row.

**Q: How is the progress calculated?**
A: Progress is set manually based on these stages:
- Pending (0%)
- Bank Statement Compiled (50%)
- Drafted (80%)
- Discussion (95%)
- Filed (100%)

---

### Client Portal

**Q: How do clients get access?**
A: Admin creates a user account and links it to the client record via Client Account Linker.

**Q: Can clients upload documents?**
A: Currently, clients can view and download documents shared with them.

**Q: How do clients communicate with the team?**
A: Through the Messages section in the client portal.

---

### Technical

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions).

**Q: What happens if I lose internet connection?**
A: Unsaved changes may be lost. The system will prompt to reconnect.

**Q: Can I export all my data?**
A: Admins can export data from each module. For full database exports, contact support.

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
| 1.2.0 | 2025 | Added bulk import, line items |

---

*Documentation last updated: December 2025*
