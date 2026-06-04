# Development Report

## LocalStorage persistence for user data during development

Completed the LocalStorage persistence task.

### What changed

- Added `src/storage.ts` with safe JSON helpers for reading, writing, clearing, and resetting development data in browser `localStorage`.
- Refactored `src/App.tsx` to load the persisted user and issue list on startup, save issue changes, persist login/signup sessions, clear the user on sign out, and restore seed issue data on reset.
- Added a Profile action named `Reset Local Development Data` so development data can be reset from the browser without adding backend persistence.
- Fixed captured report photo handling in `src/components/Report.tsx` by using `useEffect` for captured image side effects.
- Marked the LocalStorage persistence TODO item complete.
- Updated `README.md` with the LocalStorage keys and reset instructions.

### Verification

- Passed: `bun run lint`
- Passed: `bun run build`
- Note: build reports a client chunk size warning after adding Leaflet. The build still completes successfully.

## Report creation and editing flow

Completed the draft implementation for creating and editing local reports.

### What changed

- Added edit state in `src/App.tsx` so a selected local report can be reopened in the Report form.
- Added update handling in `src/App.tsx` so edited report details replace the existing issue in localStorage-backed state instead of creating duplicates.
- Updated `src/components/Report.tsx` to support create and edit modes, including pre-filled fields, edit-specific page copy, cancel behavior, and update submission.
- Added an `Edit Report` action to user report cards in `src/components/Profile.tsx`.
- Kept custom location picking, marker overlap handling, saved report history, and production persistence out of scope for this task.
- Moved the TODO item to Draft Completed.

### Verification

- Passed: `bun run lint`
- Passed: `bun run build`

## Saved reports list/history

Completed the draft implementation for saved report history.

### What changed

- Added report history types in `src/types.ts`.
- Added creation and edit history events in `src/App.tsx`.
- Updated `src/components/Profile.tsx` with a Recent/History segmented view.
- Kept history stored inside local report records in `civicpulse_issues` to preserve the existing development-only LocalStorage model.
- Moved the TODO item to Draft Completed.

### Verification

- Passed: `bun run lint`
- Passed: `bun run build`

## Map/report location improvements

Completed the draft implementation for a real Toronto-centered map, development location selection, and stacked map pins.

### What changed

- Added `src/locations.ts` with shared mock Toronto locations, preset coordinates, wards, and fallback location resolution.
- Installed `leaflet`, `react-leaflet`, and `@types/leaflet`.
- Replaced the static map backdrop with a Leaflet/OpenStreetMap world map centered on Toronto.
- Added `/api/geocode` in `server.ts` to resolve typed Toronto addresses through OpenStreetMap Nominatim with a local in-memory cache.
- Added `src/geocoding.ts` to use exact mock locations first, then real geocoding, then safe fallback coordinates.
- Added `src/wards.ts` with Toronto's 25-ward model names and approximate coordinate-based ward assignment.
- Replaced the Report form's two-location toggle with an editable address field, explicit validation, resolved-address feedback, testing examples, an opt-in browser location action, and an explicit Toronto Core fallback.
- Added landmark aliases and typo suggestions for common Toronto location inputs.
- Removed silent fallback for invalid typed addresses so users must correct or explicitly choose a fallback before submitting.
- Updated report creation/editing to save resolved coordinates and wards from the shared location helper.
- Added a startup migration for saved local reports so existing user-created reports are re-resolved to current mock coordinates and wards.
- Added a Profile action to recalculate saved local report map positions without deleting reports.
- Replaced approximate seed and quick-pick coordinates with geocoded Toronto coordinates.
- Tightened startup migration so it only updates exact known addresses and does not overwrite custom geocoded report locations.
- Expanded saved map position recalculation so it can correct seed/default reports as well as user-created reports.
- Updated `src/components/Map.tsx` to render real latitude/longitude markers and fan out pins that share the same coordinates.
- Added marker clustering for dense map areas so nearby report pins collapse into numbered groups.
- Moved the TODO item to Draft Completed.

### Verification

- Passed: `bun run lint`
- Passed: `bun run build`
