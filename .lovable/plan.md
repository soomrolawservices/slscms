

# Offline-First Architecture + Native Mobile App

This is a large-scope plan covering 4 major features. Here's the implementation broken into phases:

---

## Phase 1: Pre-Cache Critical Pages on Login

**Goal**: After the user logs in, automatically fetch and cache data for Dashboard, Clients, Cases, Appointments, and Payments so these pages work offline even if never visited.

**How it works**:
- Create a new `usePrefetchCriticalData` hook that runs after authentication
- Uses `queryClient.prefetchQuery()` to eagerly load key data queries in the background
- The service worker's existing `NetworkFirst` caching for API calls will store the responses automatically
- Data is fetched silently without blocking the UI

**Files to create/modify**:
- Create `src/hooks/usePrefetchCriticalData.ts` -- pre-fetches `clients`, `cases`, `appointments`, `payments`, `expenses`, `documents` queries
- Modify `src/App.tsx` -- call the prefetch hook inside `AppContent` after authentication is confirmed

---

## Phase 2: Data Freshness Indicator

**Goal**: Show a small visual badge on each page indicating whether displayed data is live (fresh from server) or stale (from cache).

**How it works**:
- Create a `DataFreshnessIndicator` component that accepts a React Query result
- Uses `dataUpdatedAt` and `isFetching` from the query to calculate staleness
- Shows a green dot with "Live" when data was fetched within the last 5 minutes
- Shows an amber dot with "Cached - X min ago" when stale
- Shows a red dot with "Offline" when the device has no connection
- Compact pill-shaped badge placed near each page's header

**Files to create/modify**:
- Create `src/components/ui/data-freshness-indicator.tsx`
- Modify `src/hooks/useOfflineSync.ts` -- export an `isOnline` state globally via context or a shared ref
- Modify pages: `Dashboard.tsx`, `Clients.tsx`, `Cases.tsx`, `Payments.tsx`, `Invoices.tsx`, `Expenses.tsx`, `Appointments.tsx`, `Documents.tsx` -- add the freshness indicator near the page title

---

## Phase 3: Offline Queue System

**Goal**: Allow users to create, update, and delete records while offline. Changes queue locally and automatically sync when connectivity returns, with conflict resolution.

**Architecture**:

```text
+------------------+     +-----------------+     +------------------+
|  User Action     | --> | Offline Queue   | --> | Sync Engine      |
|  (Create/Update/ |     | (localStorage)  |     | (on reconnect)   |
|   Delete)        |     |                 |     |                  |
+------------------+     +-----------------+     +------------------+
                                                        |
                                                        v
                                                 +------------------+
                                                 |  Database        |
                                                 |  (via API)       |
                                                 +------------------+
```

**How it works**:
- Create an `OfflineQueueManager` class that stores pending operations in `localStorage`
- Each queued item contains: `id`, `table`, `operation` (create/update/delete), `data`, `timestamp`, `status`
- Create a `useOfflineMutation` wrapper hook that intercepts mutations when offline
  - When online: works exactly as before (direct API call)
  - When offline: adds to queue, updates React Query cache optimistically, shows toast "Saved offline"
- Create a `SyncEngine` that runs when `online` event fires:
  - Processes queue in order (FIFO)
  - For updates: uses `updated_at` timestamp comparison for conflict resolution (server wins if server record is newer, prompts user otherwise)
  - Shows sync progress toast: "Syncing 3 changes..."
  - Removes successfully synced items from queue
  - Reports failures for manual retry
- Create a `PendingChangesIndicator` component showing count of unsynced changes

**Files to create/modify**:
- Create `src/lib/offline-queue.ts` -- queue manager class with localStorage persistence
- Create `src/hooks/useOfflineMutation.ts` -- wrapper that intercepts mutations when offline
- Create `src/components/pwa/PendingChangesIndicator.tsx` -- shows pending sync count
- Create `src/components/pwa/SyncStatusBar.tsx` -- shows sync progress during reconnection
- Modify `src/hooks/useOfflineSync.ts` -- integrate sync engine trigger on reconnect
- Modify `src/hooks/useClients.ts`, `useCases.ts`, `usePayments.ts`, `useInvoices.ts`, `useExpenses.ts`, `useAppointments.ts` -- wrap mutations with offline support
- Modify `src/components/layout/AppLayout.tsx` -- add PendingChangesIndicator to the header
- Modify `src/components/pwa/PWAInstallPrompt.tsx` -- show pending changes count in offline banner

---

## Phase 4: Native Mobile App (Capacitor)

**Goal**: Package the existing PWA as a native iOS and Android app using Capacitor.

**How it works**:
- Install Capacitor core packages (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`)
- Initialize Capacitor with proper app ID and name
- Configure `capacitor.config.ts` with live-reload pointing to the preview URL for development
- Add safe-area handling via CSS for native device notches and home indicators
- Ensure all touch targets meet 44px minimum for mobile accessibility

**Files to create/modify**:
- Install dependencies: `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, `@capacitor/android`
- Create `capacitor.config.ts` with:
  - `appId`: `app.lovable.e1ab17bcbb7147e792cb026304b74a81`
  - `appName`: `slscms`
  - `server.url`: `https://e1ab17bc-bb71-47e7-92cb-026304b74a81.lovableproject.com?forceHideBadge=true`
  - `server.cleartext`: `true`
- Modify `src/index.css` -- add safe-area inset padding for native devices
- Modify `src/components/layout/MobileNav.tsx` -- add `env(safe-area-inset-bottom)` padding
- Modify `src/components/layout/AppLayout.tsx` -- add safe-area-aware spacing

**Post-implementation steps (for you to do on your local machine)**:
1. Export to GitHub via "Export to GitHub" button, then clone
2. Run `npm install`
3. Run `npx cap init` (if not auto-created)
4. Run `npx cap add ios` and/or `npx cap add android`
5. Run `npx cap update ios` / `npx cap update android`
6. Run `npm run build`
7. Run `npx cap sync`
8. Run `npx cap run android` or `npx cap run ios` (requires Android Studio / Xcode)

---

## Technical Details

### Offline Queue Data Structure
Each queued operation is stored as:
```text
{
  queueId: "unique-id",
  table: "clients",
  operation: "create" | "update" | "delete",
  data: { ... record fields ... },
  recordId: "uuid" (for update/delete),
  timestamp: 1707300000000,
  status: "pending" | "syncing" | "failed",
  retryCount: 0
}
```

### Conflict Resolution Strategy
- **Create**: Always applies (server assigns final ID)
- **Update**: Compare local `timestamp` vs server `updated_at`; if server is newer, keep server version and notify user
- **Delete**: Attempt delete; if record already deleted, silently succeed

### Pre-cache Query Keys
The following queries will be prefetched on login:
- `['clients']`
- `['cases']`
- `['appointments']`
- `['payments']`
- `['expenses']`
- `['documents']`

### Capacitor Configuration
- App will use live-reload during development (points to preview URL)
- For production, the built web assets are bundled inside the native app
- Safe-area CSS variables ensure content doesn't overlap device notches or home bars

