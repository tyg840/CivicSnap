## Run Locally

**Prerequisites:**  Bun


1. Install dependencies:
   `bun install`
2. Set `API_KEY` and `APP_ID` in [.env.local](.env.local) for Qianfan live vision analysis. The app uses `https://qianfan.baidubce.com/v2` with model `qwen3.5-397b-a17b`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Project Settings -> API to enable Supabase Auth.
4. Set `VITE_APP_URL` to the public app URL, such as `https://civicsnap.ca`, so Supabase email verification and OAuth redirects return to the deployed site.
5. In Supabase Auth URL Configuration, set the Site URL to `https://civicsnap.ca` and add `https://civicsnap.ca`, `https://civicsnap.ca/*`, and `http://localhost:3000` to the redirect URLs. Keep the localhost URL only if you still use local development auth.
6. Set `TENCENT_SECRET_ID`, `TENCENT_SECRET_KEY`, `TENCENT_COS_BUCKET`, and `TENCENT_COS_REGION` to save report photos and report JSON to Tencent Cloud COS. `TENCENT_COS_PUBLIC_BASE_URL` is optional, but recommended when uploaded images need browser-visible URLs.
7. Run the app:
   `bun run dev`

## Toronto 311 API Test Script

Use `script/toronto-open311-test.ts` to exercise Toronto's Open311 GeoReport v2 API from the command line.

1. Ask the City of Toronto for an Open311 API key, then set `TORONTO_311_API_KEY` and the other `TORONTO_311_*` values in `.env`.
2. List the discovery document:
   `bun run open311:test discovery`
3. List service codes:
   `bun run open311:test services`
4. Inspect required metadata for a selected service code:
   `bun run open311:test definition`
5. Review the request payload without sending:
   `bun run open311:test payload`
6. Submit to the configured endpoint only after reviewing the payload:
   `$env:TORONTO_311_SEND="true"; bun run open311:test submit --send`

The script defaults to Toronto's Open311 test endpoint. Set `TORONTO_311_ENV=production` only when you intend to file a real 311 request; production submissions also require `TORONTO_311_CONFIRM_PRODUCTION=true`.

## Development Data

During local development, CivicSnap uses Supabase for authentication and keeps a browser `localStorage` cache for display/session convenience and report data.

- User profile/session key: `civicpulse_user`
- Report data key: `civicpulse_issues`

To reset local development data from the app, open the Profile tab and click `Reset Local Development Data`. This clears the local user session and restores the seed report list.

Login, signup, sign-out, and OAuth provider flows use Supabase Auth. Profile edits update Supabase user metadata for name, ward, phone, and profile notes. Updating an email also keeps that user's local reports attached to the new email.

Captured and uploaded report photos are saved through `/api/photos`, where the UID is derived from the signed-in user email or `anonymous_user` during unsigned development use. When Tencent COS is configured, files are stored in COS under `<uid>/<reportId>/files/`. When COS is not configured, the local fallback uses `data/<uid>/<reportId>/files/`.

Submitted and edited reports are also persisted through `/api/reports` as `<uid>/<reportId>/report-details.json`. The JSON file includes the final report fields produced by the AI-assisted form, including title, category, description, location, image URL, ward, status, votes, and history.

You can also reset manually from browser DevTools by clearing the app's Local Storage entries and refreshing the page.

## Report Creation And Editing

Create a report from the Report tab, Map floating action button, or Statistics call-to-action. Submitted reports are saved to browser `localStorage` and appear in the Map, Statistics, and Profile views.

The Snap Scene flow opens the browser camera when permission is granted. Shutter captures and uploaded image files are persisted through `/api/photos` before the report form uses them.

Photo analysis uses the OpenAI-compatible Qianfan chat completions API when `API_KEY` and `APP_ID` are configured. Until those are provided, `/api/analyze-issue` returns the local simulated analysis fallback.

Issue categories and the vision-analysis prompt live in `src/issueConfig.ts`. Edit that file to adjust category ids, labels, map labels, stats labels, or the prompt text used by `/api/analyze-issue`.

To edit a locally created report, open the Profile tab and click `Edit Report` on one of your recent dispatch cards. The Report form reopens with the existing title, category, description, location, and image pre-filled. Saving updates the existing local report instead of creating a duplicate.

Seed reports are read-only in this development flow. Custom location selection and overlapping map markers are tracked separately under map/report location improvements.

## Saved Reports And History

Open the Profile tab to review locally saved reports. The report area includes:

- `Recent`: report cards for locally created reports, including edit actions.
- `History`: a chronological list of saved local activity, including report creation and edit events.

History entries are stored inside the report data in `civicpulse_issues`, so they reset with `Reset Local Development Data`.

## Local Statistics

The Statistics tab calculates its dashboard from the locally saved `civicpulse_issues` report list. Current tracked metrics include total reports, resolved reports, active reports, top wards by report count, solved counts per ward, and issue-category percentages.

The Profile quick stats use the same local calculation for the signed-in user's own saved reports. These numbers update when reports are created, edited, reset, or when local development data is cleared.

## Map And Report Locations

The Map page uses Leaflet with OpenStreetMap tiles and opens centered on Toronto at zoom level 15. You can pan and zoom the map like a normal world map, with close inspection limited to zoom level 21 and OpenStreetMap native tiles capped before unavailable tile levels.

Report locations are entered through a typed address field. Use `Validate` to check the address against the Toronto map before filing. Invalid typed addresses do not silently fall back; the user must correct the address, use a suggestion, or use browser location permission before submitting.

The form recognizes a few common Toronto landmarks and aliases, such as `High Park` and `Eaton Centre`, and turns them into absolute Toronto addresses before geocoding. Basic typo suggestions are also shown for common location terms, such as `duferin` to `Dufferin Street`.

`Use My Location` asks the browser for geolocation permission. This is opt-in only and may expose sensitive location data. The app uses that position only as the selected report location when the user chooses it.

Known mock locations and seed reports use geocoded Toronto coordinates. Custom text is geocoded through the local `/api/geocode` route, which uses OpenStreetMap Nominatim for Toronto address lookup and returns an error if no Toronto match is available.

Ward labels are assigned only after a report location has been validated or resolved from browser coordinates. Local development uses Toronto's current 25-ward model with coordinate-based assignment; this is not a survey-grade ward boundary lookup.

When multiple reports share the same coordinates, the Map view offsets their pins slightly so stacked reports remain individually clickable.

When many report markers appear close together, the Map groups them into numbered clusters. Zoom in or click a cluster to separate the individual report pins.

To update older local test reports or seed reports after map/location changes, open Profile and click `Recalculate Saved Map Positions`.
