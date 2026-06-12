# Development Report

## Supabase auth

Completed the draft implementation for Supabase-backed authentication.

### What changed

- Installed `@supabase/supabase-js`.
- Added `src/supabase.ts` for the browser Supabase client, config checks, and Supabase-user-to-app-user mapping.
- Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders to `.env.example` and appended missing placeholders to the local `.env` without printing existing secrets.
- Replaced browser-local development account login/signup with Supabase email/password login and signup.
- Routed Google and Apple buttons through Supabase OAuth providers.
- Added Supabase session restoration and auth-state subscription in `App.tsx`.
- Updated sign-out, reset, and profile metadata updates to call Supabase Auth.
- Removed the obsolete custom Google token verification route and local development account registry code.
- Updated README with Supabase Auth setup instructions.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`

## Toronto Open311 API test script

Completed the draft command-line test script for Toronto 311/Open311 API calls.

### What changed

- Added `script/toronto-open311-test.ts` with discovery, service list, service definition, dry-run payload, and guarded submit commands.
- Added the `open311:test` Bun script.
- Added Toronto Open311 environment placeholders to `.env.example`.
- Updated `README.md` with setup and usage notes for the script.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`
- Not run: `bun run open311:test payload` was blocked by the local Windows sandbox spawn setup before the script process started.

## Tencent COS report storage

Completed the draft implementation for Tencent Cloud COS report storage.

### What changed

- Installed `cos-nodejs-sdk-v5`.
- Added Tencent COS environment variables to `.env.example` and appended missing placeholders to the local `.env` without printing existing secrets.
- Updated `/api/photos` so images save under `<uid>/<reportId>/files/` in COS when configured, with the same folder structure under `data/` as the local fallback.
- Added `/api/reports` to persist final report data as `<uid>/<reportId>/report-details.json`.
- Updated camera capture and file upload flows to share the same report ID that the submitted report uses.
- Updated report create/edit handling to save the final report JSON after local state is updated.
- Updated README and TODO with the COS storage setup and persistence decision.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`
- Passed: local `/api/photos` and `/api/reports` smoke test wrote `smoke_user/smoke_report/files/...` and `smoke_user/smoke_report/report-details.json` using the fallback storage path.

## Local stats tracking

Completed the draft implementation for locally tracked statistics.

### What changed

- Added `src/stats.ts` to calculate report totals, active/resolved status counts, ward totals, solved counts per ward, and issue-category percentages from saved reports.
- Updated the Statistics tab to use the local report list instead of placeholder citywide baselines.
- Updated Profile quick stats to use the same tracked calculation for the signed-in user's saved reports.
- Removed visible homepage copy that claimed fixed placeholder performance numbers.
- Updated `README.md` and `TODO.md` to document and track the local stats behavior.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`

## Superseded Google sign-in development hookup

Completed the earlier draft fix for Google registration/sign-in so it no longer routed through a template development account. This custom route has since been superseded by Supabase Auth.

### What changed

- Added a temporary custom Google Identity Services flow before the Supabase Auth migration.
- Later replaced that custom route and button rendering with Supabase OAuth.
- Added a setup message when Google OAuth is not configured instead of silently creating a fake Google user.
- Removed seeded Google and Apple template accounts from the default development account registry.
- Left Apple sign-in disabled with an explicit not-connected message.
- Updated `.env.example` and `README.md` with Google OAuth client ID setup notes.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`
- Superseded: Google OAuth is now configured through Supabase providers.

## Auth/profile development behavior

Completed the draft implementation for local development auth and editable profile behavior.

### What changed

- Added a browser-local development account registry under `civicpulse_dev_accounts`.
- Seeded a demo development account while keeping sessions in `civicpulse_user`.
- Updated login to validate against local development accounts instead of inventing a user from any email.
- Updated signup to create persisted local-only development accounts.
- Replaced mock ward options with Toronto's 25-ward list in auth and profile editing.
- Added inline Profile editing for name, email, ward, phone, and profile note.
- Preserved local report ownership when the signed-in user's email changes.
- Reset Local Development Data now clears the active user and development accounts, then restores seed reports.
- Superseded: account registry behavior has since been replaced by Supabase Auth.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`

## CivicSnap rename

Completed the local product and package rename from CivicPulse/New Reporting App to CivicSnap/civic-snap.

### What changed

- Updated browser title, metadata, visible app header, auth branding, server startup log, and geocoding user agent to CivicSnap.
- Updated `package.json` and `bun.lock` package names to `civic-snap`.
- Updated `README.md` development-data wording to use CivicSnap.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`

## Report capture and location cleanup

Completed the draft cleanup for camera entry points, stricter location validation, and more natural AI report copy.

### What changed

- Updated the Snap Scene mode button so it opens the camera capture flow directly.
- Removed testing location example buttons and the `Use Toronto Core` fallback action from the Report form.
- Removed the pre-validation mock location preview so ward labels appear only after a typed address, suggestion, or browser location has been resolved.
- Kept browser location opt-in as a permission-gated location path.
- Updated `src/issueConfig.ts` so AI-generated titles and descriptions use plain, natural report language instead of image-caption phrasing.
- Updated `README.md` to describe the stricter location and ward-label behavior.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`

## Camera/photo issue capture

Completed the draft implementation for local camera capture and photo file persistence.

### What changed

- Added `/api/photos` in `server.ts` to save PNG, JPEG, WEBP, and GIF data URLs into report-scoped storage.
- Exposed the local `data` folder at `/data` so saved report images can be previewed and reused by reports.
- Added `src/photoStorage.ts` with client helpers for deriving a development UID and uploading captured photos.
- Updated `src/components/CameraView.tsx` to use browser camera capture, save shutter frames to the backend, and keep file upload as a fallback path.
- Updated `src/App.tsx` and `src/components/Report.tsx` so report previews and submitted reports use the stored image URL returned by the server.
- Updated `/api/analyze-issue` so locally stored `/data/...` images are read back into data URLs before OpenAI analysis.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`
- Passed: `/api/analyze-issue` live smoke test returned `category: "other"` with `isSimulated: false` for an unclear generated image.
- Passed: `/api/analyze-issue` smoke test returned simulated report JSON while `API_KEY` and `APP_ID` are unset.
- Passed: `/api/photos` smoke test saved a PNG under `/data/smoke_test/...` and served it back with HTTP 200.

## Qianfan vision report generation

Completed the draft wiring for live LLM report generation using the `deepseek.py` client pattern.

### What changed

- Updated `/api/analyze-issue` to use the OpenAI-compatible Qianfan base URL `https://qianfan.baidubce.com/v2`.
- Set the live vision model to `qwen3.5-397b-a17b`.
- Added the Qianfan `appid` default header through `APP_ID`, with `API_KEY` used as the client API key.
- Switched live image analysis from Responses API calls to chat completions with text and image content.
- Kept the existing simulated fallback active until `API_KEY` and `APP_ID` are configured.
- Updated `.env.example` and `README.md` with the new credential names and model details.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`

## Configurable issue categories and prompt

Completed the draft cleanup for AI-owned classification and configurable report generation prompts.

### What changed

- Added `src/issueConfig.ts` as the standalone category and prompt configuration file.
- Added the `other` issue category and wired it through report creation, maps, profile cards, and statistics.
- Updated `/api/analyze-issue` so the Qianfan prompts come from `src/issueConfig.ts`.
- Removed user-controlled category selection from the report form; the field is now a read-only AI classification result.
- Split `Open Camera` and `Upload From Storage` into separate actions so file upload no longer opens the camera UI.
- Updated direct report file uploads to save images through `/api/photos` before analysis.

### Checks

- Passed: `bun run lint`
- Passed: `bun run build`

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

- Updated the default map zoom from 13 to 15 and the maximum close zoom from 18 to 21 while keeping the minimum zoom at 11.
- Added a stable map instance key and capped native OpenStreetMap tile requests so the new zoom default takes effect and close zooming does not blank the map.
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
