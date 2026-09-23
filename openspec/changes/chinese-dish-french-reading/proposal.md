## Why

Travelers and food lovers can photograph a Chinese regional dish but often cannot name it or give it a memorable Chinese name with French restaurant sensibility. The first interface iteration exposed too much internal prompt language and too many explanatory fields. The experience should stay short: upload, recognize, return the useful text.

## What Changes

- Add a responsive single-page web experience for uploading or dragging a dish photo.
- Make the upload surface the first-viewport focus, with only a compact brand before it.
- Close the page with a restrained footer containing only privacy and AI-result guidance.
- Validate and compress the selected image in the browser, then start recognition automatically.
- Use a DeepSeek vision model to identify the most likely Chinese regional dish and return a minimal structured result.
- Present only the recognized Chinese dish name, region, and AI-created Chinese name with French restaurant sensibility.
- Keep prompt rules, naming rationale, flavor notes, confidence calculations, alternatives, and process explanations out of the visible interface.
- Provide concise loading, non-food, low-confidence, missing-key, and API-error states without losing the uploaded image.
- Keep the API key server-side and avoid persisting uploaded photos or recognition results.
- Reject excessive requests from one client before they consume DeepSeek capacity.

## Capabilities

### New Capabilities

- `dish-recognition`: Photo intake, automatic server-side AI recognition, minimal Chinese-output, and failure handling.
- `french-menu-presentation`: Concise French-restaurant-style Chinese naming result and the restrained responsive interface.

### Modified Capabilities

- None.

## Impact

- New Next.js App Router application, TypeScript UI, route handler, and direct DeepSeek API integration.
- New `DEEPSEEK_API_KEY` and optional `DEEPSEEK_MODEL` runtime configuration.
- Product and technical documentation under `docs/`.
- No database, authentication, analytics, or durable image storage in this version.
