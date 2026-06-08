## Run Locally

**Prerequisites:**  Bun


1. Install dependencies:
   `bun install`
2. Set the `OPENAI_API_KEY` in [.env.local](.env.local) to your OpenAI API key
3. Run the app:
   `bun run dev`

## Development Data

During local development, CivicPulse stores user/session data and report data in browser `localStorage`.

- User profile/session key: `civicpulse_user`
- Report data key: `civicpulse_issues`

To reset local development data from the app, open the Profile tab and click `Reset Local Development Data`. This clears the local user session and restores the seed report list.

You can also reset manually from browser DevTools by clearing the app's Local Storage entries and refreshing the page.

## Report Creation And Editing

Create a report from the Report tab, Map floating action button, or Statistics call-to-action. Submitted reports are saved to browser `localStorage` and appear in the Map, Statistics, and Profile views.

To edit a locally created report, open the Profile tab and click `Edit Report` on one of your recent dispatch cards. The Report form reopens with the existing title, category, description, location, and image pre-filled. Saving updates the existing local report instead of creating a duplicate.

Seed reports are read-only in this development flow. Custom location selection and overlapping map markers are tracked separately under map/report location improvements.

## Saved Reports And History

Open the Profile tab to review locally saved reports. The report area includes:

- `Recent`: report cards for locally created reports, including edit actions.
- `History`: a chronological list of saved local activity, including report creation and edit events.

History entries are stored inside the report data in `civicpulse_issues`, so they reset with `Reset Local Development Data`.

## Map And Report Locations

The Map page uses Leaflet with OpenStreetMap tiles and opens centered on Toronto at zoom level 15. You can pan and zoom the map like a normal world map, with close inspection limited to zoom level 21 and OpenStreetMap native tiles capped before unavailable tile levels.

Report locations are entered through a typed address field. Use `Validate` to check the address against the Toronto map before filing. Invalid typed addresses do not silently fall back; the user must correct the address, use a suggestion, choose a testing example, or explicitly select `Use Toronto Core`.

The form recognizes a few common Toronto landmarks and aliases, such as `High Park` and `Eaton Centre`, and turns them into absolute Toronto addresses before geocoding. Basic typo suggestions are also shown for common location terms, such as `duferin` to `Dufferin Street`.

`Use My Location` asks the browser for geolocation permission. This is opt-in only and may expose sensitive location data. The app uses that position only as the selected report location when the user chooses it.

Known mock locations and seed reports use geocoded Toronto coordinates. Custom text is geocoded through the local `/api/geocode` route, which uses OpenStreetMap Nominatim for Toronto address lookup and falls back to central Toronto if no match is available.

Wards use Toronto's current 25-ward model with an approximate coordinate-based assignment for local development. This is not a survey-grade ward boundary lookup.

When multiple reports share the same coordinates, the Map view offsets their pins slightly so stacked reports remain individually clickable.

When many report markers appear close together, the Map groups them into numbered clusters. Zoom in or click a cluster to separate the individual report pins.

To update older local test reports or seed reports after map/location changes, open Profile and click `Recalculate Saved Map Positions`.
