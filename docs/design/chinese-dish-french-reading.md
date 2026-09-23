# Technical design: Chinese dish, French-style Chinese name

## Experience flow

1. The user selects or drags a dish photo.
2. The browser validates and decodes the file, scales it to a maximum 1,600 px edge, and re-encodes it as JPEG below 1.9 MB.
3. The client sends the normalized base64 image to `POST /api/analyze` automatically.
4. The server applies a six-request-per-minute client limit before parsing the body or calling DeepSeek.
5. The server validates the data URL and size, then calls DeepSeek's Chat Completions endpoint with a text block and an `image_url` block.
6. The request disables DeepSeek thinking mode and asks for a minimal JSON object: a cautious identification, region, French-style Chinese name, and confidence used only to distinguish uncertainty.
7. The server validates the JSON with Zod and returns either a typed success response or an actionable error.
8. The page shows one upload/result workspace containing only the recognized dish name, region, and French-style Chinese name, followed by a restrained footer with privacy and AI guidance. No image or result is persisted.

The image request follows the [official DeepSeek Vision guide](https://api-docs.deepseek.com/guides/vision).

## Main modules

- `app/page.tsx`: server-rendered entry point.
- `components/cuisin-experience.tsx`: automatic upload, analysis, state, and concise result presentation.
- `lib/image.ts`: client-only image validation and normalization.
- `lib/dish-analysis.ts`: minimal shared schema, types, and model-output parser.
- `app/api/analyze/route.ts`: client request throttling, direct DeepSeek HTTP request, concise prompt, and API error contract.
- `app/globals.css`: restrained editorial visual system and responsive behavior.

## Page framing

The header contains only the product mark and name. The upload workspace remains the primary visual surface. A thin-rule footer closes the composition with a small brand repeat, a cinnabar accent, the image-use statement, and an AI-result caveat. It introduces no product explanation or model prompt language and stacks naturally on narrow screens.

## Model contract

The model returns one of three states:

- `identified`: a dish object with `chineseName`, `region`, `frenchStyleName`, and `confidence`.
- `uncertain`: the same dish object, with `confidence` no higher than `0.69`; the UI labels the name as an AI inference.
- `not_food`: no dish object and one short Chinese message.

The prompt, naming rules, rationale, tasting notes, alternatives, and internal confidence value are not rendered as page copy. Naming explanation fields are intentionally absent from the response contract.

## Configuration

- `DEEPSEEK_API_KEY`: required at runtime for real recognition.
- `DEEPSEEK_MODEL`: optional; defaults to `deepseek-flash`.

The API key is read only by the route handler and is never sent to the browser. The application calls DeepSeek directly without a model SDK.

## Request throttling

The route keeps a process-local fixed window keyed by the first trusted proxy address header available. Each client can make six recognition requests per minute. The seventh request returns HTTP 429 with `Retry-After` before request parsing or any DeepSeek call. This is a basic cost guard for a small deployment; multi-instance or high-traffic hosting still requires an edge or shared-store rate limit.

## Error contract

- `CONFIG_MISSING`: DeepSeek key or account permission is unavailable.
- `INVALID_IMAGE`: request or image format is invalid.
- `IMAGE_TOO_LARGE`: normalized or raw payload exceeds the accepted boundary.
- `MODEL_OUTPUT_INVALID`: DeepSeek responded but did not satisfy the schema.
- `RATE_LIMITED`: the client exceeded the local six-request-per-minute allowance.
- `UPSTREAM_ERROR`: network, rate-limit, timeout, or model failure after request acceptance.

## Privacy

The application keeps uploaded bytes in browser memory and the request lifecycle only. It does not write image data to disk and does not introduce analytics or a database. DeepSeek's data handling is governed by the account and service terms configured for the API key.
