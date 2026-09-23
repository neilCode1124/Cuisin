# Product requirement: Chinese dish, French-style Chinese name

## Goal

Create a focused web experience where a user uploads a photo of a Chinese regional dish, the AI identifies the most likely dish, and the page returns a short Chinese-language name with a French fine-dining sensibility.

## Primary user

A traveler, diner, content creator, or Chinese-food enthusiast who wants a quick dish identification and a memorable French-restaurant-style Chinese name.

## Required behavior

1. The page places only the compact product brand before the image upload surface, without a marketing headline or explanatory preamble. Supporting privacy and AI guidance is reserved for a restrained footer.
2. A user can choose or drag an image file into the page.
3. Selecting a valid image starts preparation and recognition automatically; no second confirmation step is required.
4. The browser validates the file, decodes it, downsizes it to a bounded resolution, and converts it to JPEG before upload.
5. The server accepts only bounded base64 JPEG, PNG, WebP, or GIF input and sends it to a DeepSeek vision model.
6. The visible result contains only:
   - the most likely Chinese dish name;
   - the dish's region or cuisine tradition;
   - the AI-created Chinese name with a French restaurant sensibility.
7. The French-style name MUST be written entirely in Chinese and sound natural in a refined restaurant-menu context. It MUST NOT falsely add ingredients or origin that are not supported by the image or the most likely dish.
8. The interface MUST remain a single upload-and-result surface. It MUST NOT display prompt rules, naming rationale, tasting notes, confidence calculations, alternatives, process explanations, or other model-facing instructions as user-facing copy.
9. Non-food images, uncertain identification, missing API configuration, API failures, and local request throttling remain distinguishable with short, actionable messages.
10. The recognition endpoint rejects more than six requests from one client within one minute before calling DeepSeek.
11. The experience is responsive and keyboard accessible.
12. Uploaded images and results are not stored by the application.

## Non-goals

- Speech synthesis, audio playback, or pronunciation reading.
- User accounts or history.
- Restaurant recommendations.
- Nutrition or allergen guarantees.
- Production database or image CDN.
- Exact recipe reconstruction.
- Long-form naming explanations, flavor commentary, or a multi-section menu report.

## Acceptance criteria

- A valid dish image automatically produces a concise result containing the dish name, region, and French-style Chinese name.
- The upload surface is the first-viewport focus; no large promotional headline appears before it, and supporting guidance stays in the footer.
- The visible interface contains no prompt-derived explanation, naming rationale, tasting notes, alternatives, or multi-step editorial copy.
- The French-style Chinese name is not merely a mechanical translation or a literal “法式” prefix.
- An invalid or oversized file is rejected before upload with actionable feedback.
- A missing `DEEPSEEK_API_KEY` yields a configuration state without fabricating a result.
- A seventh request from the same client within one minute returns HTTP 429 without calling DeepSeek.
- A non-food image yields a clear non-food state.
- The layout works at desktop and mobile widths with no horizontal overflow.
- Type checking, focused parser tests, and a production build pass.
