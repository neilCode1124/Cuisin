# Local setup

## Requirements

- Node.js 24 or newer
- pnpm
- A DeepSeek API key with access to `deepseek-flash`

## Configure

```bash
cp .env.example .env.local
```

Set the values in `.env.local`:

```dotenv
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_MODEL=deepseek-flash
```

`DEEPSEEK_MODEL` is optional. If it is omitted, the application uses `deepseek-flash`, which is the vision-capable model documented by DeepSeek.

## Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
pnpm run type-check
pnpm test
pnpm run build
```

## Deploy

Deploy as a standard Next.js application. Configure `DEEPSEEK_API_KEY` and, if needed, `DEEPSEEK_MODEL` in the hosting environment. Do not expose `DEEPSEEK_API_KEY` through a `NEXT_PUBLIC_` variable.

## Current limitations

- The app does not persist image or naming history.
- Identification is probabilistic; the UI labels uncertain results as an AI inference while keeping the result concise.
- The application-level rate limit is process-local. Add an edge or shared-store rate limit before a multi-instance or high-traffic public deployment.
- The project does not include user quotas or moderation controls.
