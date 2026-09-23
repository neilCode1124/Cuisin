## Purpose

Turns a user-supplied dish photo into a cautious, minimal structured identification and a grounded French-restaurant-style Chinese naming result that presentation features can rely on.

## ADDED Requirements

### Requirement: Bounded local image intake
The system MUST accept a user-selected image only after validating its type and size, and MUST reduce its dimensions and encoded size before transmission.

#### Scenario: Valid photo selected
- **WHEN** the user selects a supported image within the size limit
- **THEN** the system shows a local preview, prepares a bounded JPEG payload for recognition, and starts recognition automatically

#### Scenario: Invalid photo selected
- **WHEN** the user selects an unsupported, unreadable, or oversized file
- **THEN** the system rejects the file without calling recognition and explains how to proceed

### Requirement: Server-side dish recognition
The system MUST send the prepared image only from a server-side endpoint to a configured DeepSeek vision model and MUST keep the API key out of client bundles.

#### Scenario: Configured recognition succeeds
- **WHEN** a valid image is submitted and the service is configured
- **THEN** the system returns a minimal structured result containing a Chinese dish name, region, and AI-created Chinese name with French restaurant sensibility

#### Scenario: API key is missing
- **WHEN** recognition is requested without server-side DeepSeek configuration
- **THEN** the system returns a configuration error and does not fabricate a dish result

### Requirement: Grounded French-style Chinese naming
The French-style name MUST be written entirely in Chinese and read as a natural fine-dining menu entry. The response MUST NOT require or display a naming rationale, tasting notes, alternatives, or prompt-derived explanation.

#### Scenario: Identified dish receives a French-style Chinese name
- **WHEN** the model identifies a food image with usable confidence
- **THEN** the result contains a Chinese-only French-style name tied to the identification

#### Scenario: Uncertainty limits naming claims
- **WHEN** the dish identity is uncertain
- **THEN** the result remains concise and the UI labels the French-style Chinese name as an AI inference

### Requirement: Honest uncertainty handling
The system MUST distinguish an image that does not contain food from a food image whose dish identity is uncertain.

#### Scenario: Non-food image
- **WHEN** the model determines that the image does not show food
- **THEN** the UI presents a short non-food message without a fabricated French-style Chinese name

#### Scenario: Uncertain dish identity
- **WHEN** the model cannot identify one dish with high confidence
- **THEN** the response includes the cautious result and the UI distinguishes it from a confident identification

### Requirement: Non-persistence
The application MUST NOT persist uploaded image bytes or recognition results in a database or application storage.

#### Scenario: Recognition completed
- **WHEN** a recognition request finishes
- **THEN** no uploaded image or result is retained by the application after the response completes

### Requirement: Basic request throttling
The recognition endpoint MUST reject excessive requests from one client before sending another request to DeepSeek.

#### Scenario: Client exhausts the local allowance
- **WHEN** one client makes a seventh recognition request within one minute
- **THEN** the endpoint returns HTTP 429 with retry timing and does not call DeepSeek
