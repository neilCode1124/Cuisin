## Context

The repository starts without application code. The first version must be locally runnable and deployable to a standard Node.js host while keeping the DeepSeek credential server-side. DeepSeek's official Vision guide documents `deepseek-flash`, base64 image input, and the Chat Completions request shape.

## Goals / Non-Goals

**Goals:**
- Use one repository and one deployable Next.js application for UI and API.
- Keep image preparation bounded on the client and validation repeated on the server.
- Separate factual dish identification from the creative Chinese naming step with French restaurant sensibility inside one model response.
- Deliver a restrained, responsive upload-and-result interface without a large UI component library or explanatory report sections.
- Put the upload surface directly below a compact brand so the primary action is immediately visible.
- Finish the composition with a quiet responsive footer for privacy and AI-result guidance.
- Allow the application to build and present concise configuration guidance without an API key.
- Add a basic server-side cost guard for repeated recognition requests.

**Non-Goals:**
- Speech synthesis, pronunciation playback, or generated audio.
- Persisting or sharing dish history.
- Exact dish authentication, recipes, nutrition, or allergen certification.
- Multi-user quotas, billing controls, or an administrative dashboard.

## Decisions

### Next.js App Router with TypeScript

Use one Next.js application for the server-rendered page, client interaction, and the `/api/analyze` route handler. This removes cross-service deployment and CORS work. A separate frontend/backend was rejected because it adds operational cost without a current scaling requirement.

### Browser-side image normalization

Decode the selected image in the browser, scale its longest edge to at most 1,600 px, and re-encode it as JPEG at bounded quality. This reduces upload and model cost and strips most embedded metadata. The server still validates media type and payload size because client checks are not a trust boundary. Sending original files directly was rejected because camera photos can be unnecessarily large.

### Direct DeepSeek vision request

Call `https://api.deepseek.com/chat/completions` from the server with `deepseek-flash`, a text content block, and an `image_url` block carrying the base64 data URL, following the [official DeepSeek Vision guide](https://api-docs.deepseek.com/guides/vision). A direct HTTP request was selected over adding an SDK because the API shape is small and it removes an unnecessary dependency. The prompt asks only for a cautious identification, its region, and a Chinese name with the structure and restraint of an elegant French menu entry.

### Runtime-validated JSON response

Request JSON-only output and validate it with a Zod schema before returning it to the browser. The schema includes only the identified dish name, region, Chinese-only French-restaurant-style name, and an internal confidence value used to distinguish uncertain identification. A small parser and schema keep the UI resilient to formatting drift while preventing unused explanation fields from entering the response.

### No persistence

Keep image bytes and results in request/response memory only. No database, object storage, analytics, or logs containing image data are introduced. This matches the privacy promise and reduces the initial system surface.

### Process-local request throttling

Apply a fixed one-minute window before parsing the request body or calling DeepSeek, allowing six requests per client address. Return HTTP 429 with `Retry-After` when the window is exhausted. This gives the small initial deployment a bounded cost guard without introducing a database. It is intentionally not treated as distributed quota enforcement; multi-instance hosting must add an edge or shared-store limit.

### Restrained page footer

Keep the upload workspace dominant while restoring a clear visual ending below it. Use a thin rule, small brand repeat, cinnabar accent, and two factual notes: images are used only for the current recognition and AI results are for reference. On mobile, the footer stacks without introducing a separate content section.

## Risks / Trade-offs

- Vision recognition can confuse visually similar regional dishes. → Keep an internal confidence threshold and label uncertain results as an AI inference rather than a fact.
- Creative French-style naming can overstate ingredients or origin. → Explicitly prohibit invented ingredients or origins and keep the result concise.
- Large base64 JSON bodies can exceed platform limits. → Normalize client images, cap dimensions and encoded size, reject oversized server payloads, and rely on a serverless-friendly route response.
- Mobile browsers have uneven image decoding behavior. → Show an actionable decode error and keep file input available.
- Explanatory model output can make the interface feel like exposed prompt text. → Exclude rationale, tasting notes, and alternatives from both the response contract and the rendered result.
- A landing-style hero can delay the only useful action. → Keep only the compact brand before the upload surface.
- Process-local throttling is not globally consistent across instances. → Treat it as a basic guard and require an edge or shared-store limit for high-traffic deployment.
- Model names and account access change over time. → Keep `DEEPSEEK_MODEL` configurable and provide a documented default rather than hard-wiring a UI assumption.

## Migration Plan

This is a new application, so there is no data migration. Deployment consists of installing dependencies, configuring `DEEPSEEK_API_KEY` and optionally `DEEPSEEK_MODEL`, and running the standard Next.js build/start commands. Rollback is redeploying the previous build or removing the new environment.

## Open Questions

None required before implementation. User quotas, analytics, and saved naming collections can be evaluated after real usage.
