## Purpose

Presents a recognized Chinese dish as one restrained upload-and-result surface with only the useful identification and French-style Chinese name.

## ADDED Requirements

### Requirement: Concise naming result
The system MUST present a recognized dish with only the Chinese dish name, region or cuisine tradition, and AI-created Chinese name with French restaurant sensibility.

#### Scenario: Result rendered
- **WHEN** recognition returns a food result
- **THEN** the page displays those three pieces of information without naming rationale, tasting notes, confidence calculations, alternatives, or process copy

### Requirement: Upload-first empty state
The empty state MUST put the upload action in the first viewport with only a compact product brand before it and MUST reserve supporting guidance for the footer.

#### Scenario: User opens the page
- **WHEN** the page first renders
- **THEN** the user sees the brand and upload action without a marketing headline or explanatory preamble

### Requirement: Restrained footer
The page MUST end with concise privacy and AI-result guidance without reintroducing product explanation or prompt-derived copy.

#### Scenario: User reaches the end of the page
- **WHEN** the footer is visible at desktop or mobile width
- **THEN** it closes the composition with the product name, image-use statement, and AI-result caveat

### Requirement: No prompt-derived interface copy
The system MUST keep model instructions and prompt rules out of the user-facing interface.

#### Scenario: User views the page
- **WHEN** any empty, loading, success, uncertainty, or error state is visible
- **THEN** the copy describes only the user action or result and does not expose naming rules or internal reasoning

### Requirement: Elegant operational states
The interface MUST provide distinct, polished states for empty upload, image preparation, automatic analysis, success, uncertainty, non-food, configuration error, and request failure.

#### Scenario: Analysis starts automatically
- **WHEN** the user selects a valid image
- **THEN** the interface shows a calm progress treatment without requiring a second submission

#### Scenario: Request fails
- **WHEN** recognition fails for a reason other than missing configuration
- **THEN** the interface preserves the selected image and offers a retry action

### Requirement: Responsive and accessible interaction
The experience MUST support keyboard operation, visible focus states, reduced-motion preferences, and layouts from mobile to desktop widths without horizontal overflow.

#### Scenario: Keyboard-only upload
- **WHEN** a keyboard user focuses and activates the upload control
- **THEN** the file picker opens and all subsequent controls remain keyboard reachable

#### Scenario: Reduced motion
- **WHEN** the operating system requests reduced motion
- **THEN** non-essential animations are disabled
