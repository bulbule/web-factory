# WEB Factory v2.0
GitHub Pages frontend + Google Apps Script backend + Google Sheets database + Google Drive asset storage.

## Important privacy note
A private GitHub repository does **not** automatically make its GitHub Pages website private on ordinary GitHub plans. GitHub documents private Pages access control as an Enterprise Cloud feature. On other plans, treat the static frontend as publicly reachable. The API in this project separately requires a valid Google ID token and an email allowlist before it returns or mutates any data. If you require the entire website shell to be inaccessible to the public, use GitHub Enterprise Cloud private Pages or move the frontend behind an authenticated host.

## Architecture
- `frontend/`: static GitHub Pages site.
- `backend/Code.gs`: Apps Script API, authentication, Sheets/Drive operations.
- `backend/PromptService.gs`: hardcoded pitch deck and development prompt templates.
- No Claude, ChatGPT or Gemini API calls.

## Cross-origin transport
Apps Script web apps do not provide a general-purpose configurable CORS middleware for arbitrary frontend fetch requests. The frontend therefore uses a standard HTML form POST targeted at a hidden iframe. The Apps Script `doPost` handler returns a small HTML response that uses `postMessage` to return the result. This avoids fetch preflight and does not require JSONP or `Access-Control-Allow-Origin` headers.
The frontend validates that the message came from its own hidden iframe and from the expected Apps Script response origins. The backend validates Google ID tokens and an email allowlist on every request.

## Security caveat
For Apps Script compatibility, this starter uses Google's `oauth2.googleapis.com/tokeninfo` endpoint to validate ID tokens. Google documents tokeninfo as a development/debugging validation method and recommends a dedicated JWT verification library for production systems. This is a practical private internal MVP, not a hardened high-assurance authentication service. For a stronger production security boundary, put a Cloud Run/Functions API in front of Apps Script or move data operations to a backend that can verify Google's JWT signatures locally, enforce CSRF/rate limits, and issue server-side sessions.
Never put OAuth client secrets, Drive credentials, service account keys or private API keys in the GitHub frontend.

## Requirements
- GitHub account and a repository named `web-factory`.
- Google account with access to Apps Script, Sheets and Drive.
- Google Cloud OAuth 2.0 Web client ID configured for Sign in with Google.
- Apps Script deployment URL.

## 1. Create Google backend
1. Open https://script.google.com/ and create a standalone Apps Script project, e.g. `WEB Factory API`.
2. Create `Code.gs` and `PromptService.gs`; paste the corresponding files from `backend/`.
3. Run `setupApp()` once and authorize Sheets and Drive access.
4. Copy the generated spreadsheet and root Drive folder URLs for your records.
5. In Apps Script Project Settings → Script Properties, configure:
   - `WF_GOOGLE_CLIENT_ID` = your OAuth Web Client ID
   - `WF_ALLOWED_EMAILS` = your Google email, or comma-separated approved emails
   - `WF_DB_ID` = created automatically by setupApp()
   - `WF_ROOT_FOLDER_ID` = created automatically by setupApp()
6. Deploy → New deployment → Web app.
   - Execute as: **Me** (the script owner)
   - Who has access: **Anyone** (the app's own backend token/email allowlist is the authorization gate)
   - Copy the `/exec` URL.
7. Do not share the Apps Script project editor with untrusted users. Do not expose Script Properties.

Note: "Anyone" makes the endpoint reachable, not the data public. Every request still needs a valid Google ID token whose audience matches the configured client ID and whose email is allowlisted. Use a dedicated Google account for the owner if desired.

## 2. Configure Google Identity Services
1. Open Google Cloud Console: https://console.cloud.google.com/
2. Create/select a project and configure the OAuth consent screen.
3. Create OAuth Client ID → Web application.
4. Add the exact GitHub Pages origin to Authorized JavaScript origins, e.g. `https://YOUR_GITHUB_USERNAME.github.io`.
5. Copy the Web Client ID. Do not put any client secret in the frontend; GIS web client IDs are public identifiers.
6. Add the client ID and allowed email(s) to Apps Script Script Properties as above.

## 3. Configure frontend
1. Copy `frontend/` contents to the root of the `web-factory` GitHub repository (so `index.html` is at repository root).
2. Edit `frontend/js/config.js`:
   - `API_URL`: Apps Script `/exec` URL.
   - `GOOGLE_CLIENT_ID`: OAuth Web Client ID.
3. If your repo is `username/web-factory`, project Pages origin is normally `https://username.github.io`. The app's `window.location.origin` is used as the frontend origin.
4. Push to GitHub.
5. Repository Settings → Pages → Deploy from branch → `main` / `(root)`.
6. Open the Pages URL over HTTPS.

## 4. Test checklist
- [ ] Sign in with an allowlisted Google account.
- [ ] Sign in with a non-allowlisted account; API must deny access.
- [ ] Dashboard lists only non-deleted projects.
- [ ] Create a project with required project and company names.
- [ ] Verify project folder and nine subfolders in Drive.
- [ ] Upload a logo, hero image and brochure; verify each target folder.
- [ ] Reopen project and verify brief, products and asset links.
- [ ] Generate pitch deck and development prompts for each AI target.
- [ ] Verify prompt text is stored in Sheets and `.md` files in `07-PROMPTS`.
- [ ] Test on mobile and desktop.

## Upload constraints
- 5 MB maximum per file in this starter.
- Browser converts each file to base64 and sends it in a form POST. Avoid selecting many large files at once; upload batches.
- Google Apps Script quotas and execution time limits apply.

## API actions
- `bootstrap`
- `listProjects`
- `getProject`
- `saveProject`
- `generatePrompts`
- `deleteProject`

## Current limitations
- `tokeninfo` validation should be replaced with local signature verification / a trusted backend for high-assurance production.
- No asset deletion UI yet.
- Editing adds newly selected assets; it does not automatically delete old Drive files.
- No automatic source-code export from generated websites; that output comes from the external AI workflow.
- GitHub Pages static files may be public even when the source repository is private, depending on plan. See GitHub's Pages access-control documentation.
