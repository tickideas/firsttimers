# apps/web - Next.js Frontend

Next.js 15 + React 19 + TypeScript frontend for First Timers Management Platform.

## Setup & Run

```bash
# From repo root
bun install

# Dev server (runs on :3000 via turbo)
bun run dev

# Or directly
cd apps/web && bun run dev

# Build
bun run build

# Typecheck
bun run typecheck

# Lint
bun run lint
```

## Patterns & Conventions

### File Organization

```
app/                    # Next.js App Router
├── (admin)/           # Route group for admin pages
├── api/               # API routes (proxy to backend)
├── f/[churchSlug]/    # Public form submissions
├── login/             # Auth pages
├── layout.tsx         # Root layout
├── page.tsx           # Dashboard
└── globals.css        # Global styles

components/
├── ui/                # Reusable UI components
└── ...                # Feature components

lib/
└── utils.ts           # cn() and utilities
```

### Component Patterns

- **DO**: Use React Server Components by default
  - Example: `app/page.tsx` fetches data directly
- **DO**: Use `'use client'` only for interactivity
  - Example: Forms, buttons with onClick
- **DO**: Use shared UI components from `@firsttimers/ui`
  - Example: `import { Button } from '@firsttimers/ui'`
- **DO**: Use Tailwind CSS for styling
  - Example: `className="bg-indigo-600 text-white"`

### Styling

- Tailwind CSS v4 with PostCSS
- Design tokens via CSS variables in `globals.css`
- Use `cn()` from `@/lib/utils` for conditional classes
- Colors: indigo-600 primary, gray-100/200/300 for neutrals

### Data Fetching

- Server Components: Fetch directly in component
  ```tsx
  async function Dashboard() {
    const res = await fetch('/api/first-timers');
    const data = await res.json();
    return <div>{data.firstTimers.map(...)}</div>;
  }
  ```
- Client Components: Use `useEffect` + `useState`
  - See `app/page.tsx` for example

### Forms

- Use controlled inputs with `useState`
- Validate with Zod schemas from `@firsttimers/types`
- Show loading states during submission
- Handle errors with user-friendly messages

## Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with fonts, Providers |
| `app/page.tsx` | Main dashboard (example data fetching) |
| `app/providers.tsx` | React context providers |
| `components/ui/button.tsx` | Button component pattern |
| `lib/utils.ts` | `cn()` helper for Tailwind |

## JIT Index

```bash
# Find page component
rg "export default function" app --type tsx

# Find client component
rg "'use client'" app --type tsx

# Find API route handler
rg "export async function (GET|POST|PUT|DELETE)" app/api --type tsx

# Find component using shared UI
rg "from '@firsttimers/ui'" --type tsx
```

## Common Gotchas

- **Always use `@/` imports** for internal modules (configured in tsconfig.json)
- **Public forms** at `/f/{churchSlug}/{formId}` must never break (external facing)
- **Auth**: Check for auth state before rendering protected content
- **Images**: Use Next.js `<Image>` component for optimization

## Pre-PR Checks

```bash
cd apps/web && bun run typecheck && bun run lint
```

## Environment Variables

Copy from `.env.example` in repo root:
- `NEXT_PUBLIC_API_URL` - Backend API URL
