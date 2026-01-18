# Implementation Plan — Citizen Mobile App (React Native)

**Project:** AI-Powered Geolocation Crime Mapping & Real-Time Emergency Alert System (Muntinlupa)  
**Module:** Mobile App (Citizen) — READ-ONLY (data comes from Admin Web API)  
**Stack:** React Native + Expo Router, NativeWind, Lucide, Mapbox, TanStack Query, Zod, React Hook Form, Supabase Auth (email+google) + Phone OTP (required)

---

## 0) Ground Rules / Scope

- ✅ App is **READ-ONLY** for incidents, hotspots, heatmaps, route-safety, and notifications (fetch from Admin API).
- ✅ Supabase is used for **Auth** + **Phone OTP verification** + session persistence.
- ✅ Map features:
  - Incidents on map (clustered)
  - Filters
  - Incident drawer + details modal
  - Directions A→B
  - Route safety assessment via API (BigQuery-based model)
- ✅ Notifications:
  - push notifications (Expo Push or FCM)
  - stored inbox screen + details
- ❌ No citizen incident reporting in this scope (unless explicitly added later).
- ❌ No full turn-by-turn navigation (unless explicitly added later).

---

## 1) Project Setup & Baseline (Phase 1)

### 1.1 Initialize repo

- [ ] Create Expo app (recommended):
  - [ ] `npx create-expo-app citizen-app`
  - [ ] Configure `expo-router`
- [ ] Install core deps:
  - [ ] `@tanstack/react-query`
  - [ ] `zod`
  - [ ] `react-hook-form`
  - [ ] `@hookform/resolvers`
  - [ ] `nativewind` + tailwind config
  - [ ] `lucide-react-native`
  - [ ] `@supabase/supabase-js`
- [ ] Add env handling:
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `EXPO_PUBLIC_API_BASE_URL`
  - [ ] `EXPO_PUBLIC_MAPBOX_TOKEN`

### 1.2 Folder structure (target)

- [ ] Create `src/` structure:
  - [ ] `src/app/` (expo-router routes)
  - [ ] `src/features/auth/`
  - [ ] `src/features/map/`
  - [ ] `src/features/emergency/`
  - [ ] `src/features/notifications/`
  - [ ] `src/components/` (reusable UI)
  - [ ] `src/services/api/` (fetchers)
  - [ ] `src/services/supabase/` (client + auth helpers)
  - [ ] `src/services/push/` (push setup + handlers)
  - [ ] `src/lib/` (constants, utils)
  - [ ] `src/types/` (zod schemas + inferred types)
  - [ ] `src/store/` (query client)
- [ ] Add eslint/prettier config (optional but recommended)

### 1.3 App shell

- [ ] Create base navigation:
  - [ ] `(auth)/` group
  - [ ] `(app)/(tabs)/map`
  - [ ] `(app)/(tabs)/emergency`
  - [ ] `(app)/(tabs)/notifications`
- [ ] Create common layout providers:
  - [ ] `QueryClientProvider`
  - [ ] Auth session provider
  - [ ] Toast/snackbar provider (optional)
- [ ] Create a consistent design system:
  - [ ] Buttons, Inputs, Cards, Badges, BottomSheet wrapper

**Acceptance criteria**

- App launches with tab shell and placeholder screens.
- Env variables load correctly.
- QueryClient wired and working.

---

## 2) Auth + Session Management + Phone OTP Gate (Phase 2)

### 2.1 Supabase client and auth state

- [ ] Implement `supabaseClient.ts`
- [ ] Build `AuthProvider`:
  - [ ] On boot: `getSession()`
  - [ ] Subscribe to `onAuthStateChange`
  - [ ] Expose: `session`, `user`, `isLoading`, `signOut()`
- [ ] Implement splash / boot screen:
  - [ ] Show while loading session

### 2.2 Screens (Auth)

- [ ] `Welcome` (optional)
- [ ] `Login` (email+password)
- [ ] `Signup` (email+password)
- [ ] `ForgotPassword`
- [ ] `EmailVerification` helper screen (for email signup)

### 2.3 Google sign-in (Expo flow)

- [ ] Choose auth method:
  - [ ] Expo Auth Session + Supabase OAuth
- [ ] Implement “Sign in with Google” on Login/Signup

### 2.4 Mandatory Phone Verification (Gate)

**Rule:** After signup/login (any provider), user must have `phone_verified=true` to access tabs.

- [ ] Add `profiles` model expectation:
  - [ ] `phone_number`, `phone_verified`
- [ ] Add `PhoneVerification` screen:
  - [ ] Enter phone number
  - [ ] Send OTP (Supabase phone OTP)
  - [ ] Verify OTP
  - [ ] On success: update profile (`phone_verified=true`)
  - [ ] Resend OTP with cooldown timer
- [ ] Add route guard:
  - [ ] If session exists AND `phone_verified=false` → redirect to PhoneVerification
  - [ ] Tabs remain inaccessible until verified

### 2.5 Logout behavior (session reset)

- [ ] `signOut()` must:
  - [ ] call `supabase.auth.signOut()`
  - [ ] clear TanStack Query cache (`queryClient.clear()`)
  - [ ] clear local notification inbox cache (if used)
  - [ ] navigate to `(auth)/login`

**Acceptance criteria**

- After first login, reopening app goes directly to app (no login).
- Logging out returns to login and clears cached data.
- Unverified phone always blocks tab access until OTP verification.

---

## 3) API Layer + Validation + Query Patterns (Phase 3)

### 3.1 API client

- [ ] Create `apiClient.ts`:
  - [ ] Base URL from env
  - [ ] Attach auth token if required by your API
  - [ ] Standard error handling
- [ ] Add `zod` schemas in `src/types/` for:
  - [ ] Incident list response
  - [ ] Incident detail response
  - [ ] Route safety response
  - [ ] Hotlines response
  - [ ] Notifications response

### 3.2 TanStack Query conventions

- [ ] Define query keys:
  - [ ] `incidents.list({bbox, filters})`
  - [ ] `incidents.detail(id)`
  - [ ] `routes.safety({from,to,mode})`
  - [ ] `hotlines.list()`
  - [ ] `notifications.list()`
- [ ] Set caching policies:
  - [ ] incidents: short `staleTime` (15–30s)
  - [ ] hotlines: long `staleTime` (1 day)
  - [ ] notifications: medium `staleTime` (1–5 min)

**Acceptance criteria**

- All API calls validate responses with Zod.
- UI shows friendly errors (no crashes) when API fails or schema mismatch.

---

## 4) Map Tab — Incidents + Filters + Drawer + Details (Phase 4)

### 4.1 Mapbox integration

- [ ] Setup Mapbox token
- [ ] Render base map
- [ ] Ask location permission (optional, not blocking)
- [ ] If granted, show user puck/marker and enable “near me” sorting

### 4.2 Incidents rendering (clustered)

- [ ] Implement bbox tracking:
  - [ ] On region change end → compute bbox
  - [ ] Fetch incidents with `bbox` + filters
- [ ] Implement clustering:
  - [ ] Cluster layer for performance
  - [ ] Tap cluster → zoom in
- [ ] Marker styling by:
  - [ ] crime type
  - [ ] risk level
  - [ ] status

### 4.3 Top search + filters

- [ ] Search bar:
  - [ ] Mapbox geocoding OR your API endpoint
- [ ] Filters UI:
  - [ ] Barangay
  - [ ] Crime type
  - [ ] Status
  - [ ] Time range
  - [ ] Risk level
- [ ] Show filter chips + “Clear all”

### 4.4 Bottom drawer (Google Maps-like)

- [ ] Implement bottom sheet with 3 states:
  - [ ] Collapsed: quick summary
  - [ ] Half: list + sorting
  - [ ] Expanded: full list + search + filter summary
- [ ] Sorting:
  - [ ] nearest (if location)
  - [ ] most recent
  - [ ] highest risk

### 4.5 Incident details modal

- [ ] Implement details modal sections:
  - [ ] Header: type, status, timestamps
  - [ ] Location label + mini map preview
  - [ ] Summary
  - [ ] AI risk assessment + (optional confidence)
  - [ ] AI safety recommendations
  - [ ] Pattern assessment (trends + nearby related)
  - [ ] Source + verification badge + disclaimer
  - [ ] “View on map” + share/copy (optional)

**Acceptance criteria**

- Smooth map panning/zooming with clustered markers.
- Drawer list matches markers and filters.
- Incident detail modal opens from marker and list.

---

## 5) Map Tab — Directions A→B + Route Safety (Phase 5)

### 5.1 Directions UI (Google Maps-like)

- [ ] Add “Directions” button near search bar
- [ ] Bottom sheet “Directions Panel”:
  - [ ] From (default: user location if available)
  - [ ] To (search input)
  - [ ] Optional: set From/To by long-press pin
  - [ ] Travel mode (driving/walking) if needed

### 5.2 Routing + rendering

Pick one approach and implement:

**Option A (Recommended): API returns routes + safety**

- [ ] Call `POST /routes/safety` with `{from,to,mode,timestamp}`
- [ ] Render route polylines from API response
- [ ] Show route alternatives list with ETA + distance + safety rating

**Option B: Mapbox Directions then API safety**

- [ ] Use Mapbox Directions API to fetch route(s)
- [ ] Send chosen route geometry/polyline to API for safety score + warnings

### 5.3 Route safety presentation

- [ ] Route cards show:
  - [ ] ETA, distance
  - [ ] Safety score (0–100)
  - [ ] Risk badge (Safe/Caution/High Risk)
  - [ ] Warnings list
- [ ] “Route Safety Card” summary:
  - [ ] Top contributors/explanations
  - [ ] AI recommendations for safer travel

**Acceptance criteria**

- Users can set From/To and see route line(s).
- Each route has safety assessment returned by API and shown in UI.
- Switching routes updates highlighted polyline and safety card.

---

## 6) Emergency Tab — Hotlines (Phase 6)

### 6.1 Hotlines UI

- [ ] Top: large “Call 911” button
- [ ] Sections:
  - [ ] National hotlines
  - [ ] Local hotlines grouped:
    - [ ] Police
    - [ ] Fire
    - [ ] Hospitals / Ambulance
    - [ ] Rescue / DRRMO
    - [ ] Barangay (optional)

### 6.2 Row actions

- [ ] Call button (opens dialer)
- [ ] Copy number button
- [ ] Optional: directions to station if geo exists

### 6.3 Data source

- [ ] Fetch `GET /hotlines` from API
- [ ] Cache strongly (long stale time)

**Acceptance criteria**

- Emergency screen works offline if cached.
- Call + copy works reliably.

---

## 7) Notifications — Push + Inbox + Details (Phase 7)

### 7.1 Push notifications setup

- [ ] Choose push approach:
  - [ ] Expo Push (recommended for Expo)
  - [ ] FCM if bare RN / advanced control
- [ ] Register device push token
- [ ] Send token to API (if required):
  - [ ] `POST /devices/register`

### 7.2 Inbox storage

- [ ] On app open:
  - [ ] fetch `GET /notifications`
  - [ ] store in Query cache and (optional) local persistence
- [ ] On push received:
  - [ ] display native notification
  - [ ] insert into inbox list
  - [ ] dedupe by `notification_id`

### 7.3 Notifications tab screens

- [ ] Notifications list:
  - [ ] urgency badge
  - [ ] timestamp
  - [ ] read/unread indicator
- [ ] Notification details:
  - [ ] full message
  - [ ] “View on Map” if incident_id present
  - [ ] mark as read (API update)

**Acceptance criteria**

- Push notification appears while app in background/foreground.
- Notification is visible in inbox and detail view.
- Deep link from notification opens relevant detail.

---

## 8) Quality, Security & UX Hardening (Phase 8)

### 8.1 Reliability

- [ ] Offline mode:
  - [ ] show cached incidents/notifications with “Last updated”
- [ ] Skeleton loading states for all major screens
- [ ] Error boundaries and friendly fallback UI

### 8.2 Security and privacy

- [ ] Never log secrets/tokens
- [ ] Ensure location is optional and clearly explained
- [ ] Add disclaimers for unverified incidents

### 8.3 Performance

- [ ] Debounce bbox fetch during map movement
- [ ] Use clustering always for large data
- [ ] Avoid heavy re-renders (memoize markers/lists)

**Acceptance criteria**

- App remains responsive with many markers.
- No crashes on network failures or invalid API payloads.

---

## 9) Testing Checklist (Phase 9)

### Auth & Session

- [ ] Signup (email) → email verify → phone verify → tabs access
- [ ] Google signup → phone verify → tabs access
- [ ] App kill/reopen → session restores
- [ ] Logout → returns to login + clears cache
- [ ] Phone not verified → cannot access tabs

### Map & Incidents

- [ ] Marker cluster zoom behavior
- [ ] Filters affect both list and markers
- [ ] Incident details show correct AI sections
- [ ] Offline shows cached list

### Directions & Safety

- [ ] From/To set via search and pin
- [ ] Route displayed correctly
- [ ] Safety score/warnings show for each route
- [ ] Switching routes updates UI

### Emergency

- [ ] Call button opens dialer
- [ ] Copy works

### Notifications

- [ ] Push received → stored in inbox
- [ ] Tap push → opens correct screen
- [ ] Mark as read syncs

---

## 10) Deliverables (What “Done” Means)

- [ ] Citizen app authenticates via Supabase (email+google)
- [ ] Phone verification is mandatory gate
- [ ] Session persists across restarts; logout resets state
- [ ] Map shows incidents (clustered) + filters + drawer + details
- [ ] Directions A→B works; route safety assessment displayed from API
- [ ] Emergency hotlines are present with call/copy
- [ ] Push notifications displayed and stored in inbox

---

## 11) API Endpoints Needed (Reference)

> Adjust naming to match your Admin Web API.

- `GET /incidents?bbox=...&barangay=...&type=...&status=...&risk=...&time_range=...`
- `GET /incidents/:id`
- `POST /routes/safety` (recommended)
  - body: `{ from:{lat,lng}, to:{lat,lng}, mode, timestamp? }`
- `GET /hotlines`
- `GET /notifications`
- `POST /notifications/read` or `PATCH /notifications/:id`
- `POST /devices/register` (for push tokens)

---

## 12) Notes for Codex Execution

- Work phase-by-phase; do not skip gating requirements.
- Always add Zod schema for any new API response.
- Maintain consistent UI primitives and avoid one-off components.
- Prioritize correctness and stability over visuals initially.
- When uncertain about Mapbox SDK specifics, implement the simplest working path first (polyline + markers + bottom sheet), then iterate.
