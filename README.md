# PromptRoom

A modern web app to create, organize, and evaluate prompt content. Manage prompt "packs", track versions, and assess clarity with built-in reviewing tools.

## Features

- **Authentication**: Email/password auth via Supabase (`src/contexts/AuthContext.tsx`).
- **Prompt Packs**: Create and manage packs and their prompts (`src/app/packs/`).
- **Prompt Versions**: Version prompts and view version history (`src/components/prompts/`).
- **Clarity Rating**: Score clarity/quality for a prompt or a specific version (`src/ai/flows/`).
- **Content Generation**: Produce improved prompt content from a title + draft (`src/ai/flows/generate-prompt-content.ts`).
- **Theming & UI**: Dark mode, shadcn/ui components, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI/Styling**: React 18, Tailwind CSS, shadcn/ui, Radix UI
- **Auth/DB**: Supabase JS client
- **Charts & Utils**: Recharts, date-fns, zod
- **AI Runtime**: Genkit with Google AI provider

Key configs:

- `package.json` scripts (dev/build/start)
- `next.config.ts` (Next.js config)
- `tailwind.config.ts`, `postcss.config.mjs`

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn
- Supabase project (for auth)
- Google Generative AI API key (for AI features via Genkit)

### Environment Variables

Create a `.env.local` (or `.env`) in the project root. Typical variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Google Generative AI (used by Genkit)
GEMINI_API_KEY=YOUR_API_KEY
```

Note: `.env*` files are gitignored (see `.gitignore`).

### Install and Run

```bash
# install deps
npm install

# start web app (Next.js) on port 9002
npm run dev

# optional: run Genkit dev runtime for flows
npm run genkit:dev
# or watch mode
npm run genkit:watch
```

### Scripts

- `dev`: Next dev server with Turbopack on port 9002
- `build`: Next production build
- `start`: Next production start
- `lint`: Next lint
- `typecheck`: TypeScript noEmit
- `genkit:dev`: Start Genkit and load flow modules
- `genkit:watch`: Same as above with watch

## Project Structure

```
src/
  ai/
    genkit.ts                # Genkit runtime configuration (Google AI provider)
    dev.ts                   # Loads flows for local Genkit runtime
    flows/
      generate-prompt-content.ts
      rate-prompt-clarity.ts
      rate-prompt-version-clarity.ts
  app/                       # App Router pages and layouts
    login/
    register/
    packs/
    profile/
    page.tsx
    layout.tsx
  components/
    layout/
    packs/
    prompts/
    ui/                      # shadcn/ui components
  contexts/
    AuthContext.tsx          # Supabase auth context
```

## Development Notes

- Images are allowed from `placehold.co` and `picsum.photos` (see `next.config.ts`).
- shadcn/ui is configured via `components.json`.
- Tailwind styles are in `src/app/globals.css`.

## Deployment

- Works well on Vercel or any Node.js host.
- Ensure the environment variables are set in your hosting provider.
- If using a separate background runtime for AI flows, run `genkit` alongside or integrate flows via API routes.

## Roadmap Ideas

- Role-based access and team sharing for packs
- Analytics dashboard for prompt performance
- Export/import packs and versions

## License

MIT
