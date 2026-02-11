# eSales Mobile App

A React Native application used by ASUS sales teams and partners to access dashboards, claims, schemes, reports, notifications, and operational workflows in a single mobile experience.

---

## Project Overview

### What this application is
`esales` is a **React Native + TypeScript** mobile app with country-specific flows (ASIN, ATID, ACMY, ACSG, ACJP, TW) and role-based feature visibility.

The app combines:
- Authentication and employee profile lookup
- Role-aware dashboards and KPI views
- Demo/claim/schemes/work-order style workflows
- Notification-driven navigation
- Offline-friendly persistence for selected data and state

### Problem it solves
Sales and channel teams often need to switch between multiple systems for reporting, field operations, partner programs, and communications. This app centralizes those flows into one mobile interface, reducing context switching and improving speed of execution in day-to-day operations.

---

## Architecture at a Glance

The app follows a layered pattern that is designed for reuse and low duplication:

- **UI Layer**: `src/screens`, `src/components`
- **Navigation Layer**: `src/navigation` (auth gating, country routing, stack/drawer/tab orchestration)
- **State Layer**: Zustand stores in `src/stores`
- **Server State Layer**: React Query hooks in `src/hooks/queries`
- **Integration Layer**: API wrappers and services in `src/utils` + `src/config`

### Core runtime flow
1. `index.js` registers background handlers.
2. `App.tsx` composes splash, providers, connectivity checks, and root navigation.
3. `RootNavigator` decides between auth flow and country-specific app flow.
4. Country and role determine available screens/tabs/features.

---

## Maximizing Potential of the Existing Codebase

To move quickly and safely, build on existing patterns rather than introducing one-off implementations.

### 1) Reuse the existing query/mutation hooks
Before adding a new API call, check `src/hooks/queries/*`.

Best practice:
- Add endpoint logic to shared API wrappers (`handleASINApiCall` / `handleAPACApiCall`)
- Expose it through a feature hook (`useQuery` / `useMutation`)
- Use stable query keys and existing cache patterns

### 2) Reuse global stores instead of local prop-drilling
Use existing Zustand stores (`useLoginStore`, `useUserStore`, `useThemeStore`, `useLoaderStore`, etc.) when state is cross-screen or app-global.

### 3) Reuse shared UI primitives
Prefer existing custom components in `src/components/customs` (`AppText`, `AppInput`, `AppButton`, `AppModal`, etc.) to keep:
- Consistent styling
- Dark/light support
- Predictable behavior across screens

### 4) Follow navigation conventions
Add new screens through the relevant navigator (`AuthNavigator`, country navigator, or nested tab/drawer setup), and keep naming consistent with current routes.

### 5) Keep role/country logic centralized
When adding feature access rules, use constants in `src/utils/constant.ts` and existing role/country branching patterns to avoid hidden logic spread across files.

---

## Efficiency & DRY Principles (How to Avoid Repeating Work)

This repository may not use native Android/Kotlin constructs directly (e.g., Kotlin extension functions), but it already has strong **equivalent DRY mechanisms**.

### A) “Extension function” equivalents
Use reusable utility functions and hook abstractions instead of duplicating logic in screens:
- `src/utils/*` for cross-cutting logic (API calls, permissions, file helpers, notifications)
- `src/hooks/*` for reusable behavior (`useNetworkStatus`, query hooks, image/location helpers)

### B) “Base class” equivalents
Prefer compositional base building blocks instead of inheritance:
- `AppLayout` and `AuthLayout` provide shared page scaffolding
- Shared custom components encapsulate common input/button/text/modal patterns

### C) Dependency Injection equivalents
In React Native, DI is largely achieved through providers and module boundaries:
- `AppProviders` composes app-wide dependencies (navigation container, query provider, sheets, theme wiring, safe area, gesture root)
- API clients and wrappers provide a single integration point for networking
- Stores provide globally accessible state through typed hooks

### D) Practical DRY checklist
Before writing new code, verify:
- Is there already a component for this UI pattern?
- Is there already a query hook or API wrapper for similar endpoint usage?
- Can existing store state be reused?
- Can role/country logic be expressed using existing constants?
- Can this be added to shared utilities instead of copied across screens?

---

## How to Get Started (Android Studio)

### Prerequisites
- Node.js `>=18`
- Java/JDK compatible with React Native 0.79
- Android Studio (latest stable)
- Android SDK + Emulator configured

### 1) Install dependencies
```bash
npm install
```

### 2) Start Metro bundler
```bash
npm start
```

### 3) Build and run Android app
In a second terminal:
```bash
npm run android
```

> Alternative: Open `android/` in Android Studio and run from IDE (Gradle sync + emulator/device).

### Useful scripts
```bash
npm run lint          # Linting
npm test              # Unit tests
npm run clean-gradle  # Clean Android build artifacts
npm run build-apk     # Release APK
npm run build-aab     # Release AAB
```

---

## Recommended Newcomer Learning Path

1. Read `App.tsx` and `src/stores/providers/AppProvider.tsx` to understand app wiring.
2. Read `src/navigation/RootNavigator.tsx` to understand auth/country entry logic.
3. Explore one complete feature path (for example, ASIN Home/Dashboard + related query hooks).
4. Review `src/utils/handleApiCall.ts` and `src/config/apiConfig.ts` to understand network behavior.
5. Build one small enhancement using existing custom components + query/store patterns.

---

## Contribution Expectations

- Keep features modular and colocated by domain.
- Reuse existing utilities/hooks/components before introducing new abstractions.
- Keep role/country logic explicit and centralized.
- Prefer small, testable changes with predictable navigation impact.

