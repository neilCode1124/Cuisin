## 1. Application foundation

- [x] 1.1 Initialize the Next.js App Router, TypeScript, scripts, and project ignore rules without overwriting existing user files
- [x] 1.2 Add runtime dependencies for React, Next.js, DeepSeek, and response validation
- [x] 1.3 Add environment examples and document local setup
- [x] 1.4 Create the shared dish-analysis and French-style Chinese-naming types plus a runtime parser

## 2. Recognition and naming service

- [x] 2.1 Implement browser image validation, decode, resize, and JPEG normalization
- [x] 2.2 Implement the server-side `/api/analyze` route with body validation and a DeepSeek vision prompt that grounds the French-style Chinese name in the identified dish
- [x] 2.3 Return distinct typed states for success, non-food, low confidence, missing configuration, and upstream failure
- [x] 2.4 Disable DeepSeek thinking mode so the final Chinese naming JSON receives the full output budget

## 3. French menu experience

- [x] 3.1 Build the upload/drop zone with preview, replace, clear, and analysis controls
- [x] 3.2 Build the elegant result surface with a prominent AI-created Chinese name
- [x] 3.3 Add uncertainty treatment without presenting inference as fact
- [x] 3.4 Add responsive styling, accessible focus states, and reduced-motion behavior

## 4. Verification and handoff

- [x] 4.1 Add focused parser and status tests
- [x] 4.2 Run type checking, tests, and a production build
- [x] 4.3 Exercise the page locally at desktop and mobile widths and correct visual or interaction defects
- [x] 4.4 Run DeliveryGuard and OpenSpec validation and report any limitations without making release claims
- [x] 4.5 Validate the real DeepSeek flow with `public/image.png` and confirm a Chinese-only French-style dish name

## 5. Simplified result experience

- [x] 5.1 Reduce the model response contract and prompt to dish name, region, French-style Chinese name, and internal confidence
- [x] 5.2 Replace the multi-section menu card with one automatic upload-and-result workspace and remove prompt-derived interface copy
- [x] 5.3 Re-run focused tests, production build, OpenSpec validation, and the real `public/image.png` flow

## 6. Upload-first hardening

- [x] 6.1 Remove landing-style hero and auxiliary copy so the first viewport contains only the compact brand and upload workspace
- [x] 6.2 Add a six-request-per-minute client limit with HTTP 429 and `Retry-After` before DeepSeek invocation
- [x] 6.3 Verify focused tests, type checking, production build, OpenSpec, DeliveryGuard, and the real `public/image.png` flow at desktop and mobile widths

## 7. Restrained page framing

- [x] 7.1 Add a responsive footer with a subtle decorative accent, privacy statement, and AI-result caveat
- [x] 7.2 Verify component tests, type checking, production build, OpenSpec, DeliveryGuard, and desktop/mobile visual layout
