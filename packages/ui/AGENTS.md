# packages/ui - Shared React Components

Shared UI components using Radix UI primitives, Tailwind CSS, and class-variance-authority.

## Setup & Build

```bash
# From repo root
bun install

# Dev (watch mode with tsup)
bun run dev

# Build (generates dist/index.js + dist/index.d.ts)
bun run build

# Typecheck
bun run typecheck

# Lint
bun run lint
```

## Patterns & Conventions

### File Organization

```
src/
├── index.ts           # All component exports
├── components/
│   └── button.tsx     # Component files
└── utils/
    └── cn.ts          # Tailwind class merge utility
```

### Component Patterns

- **DO**: Use Radix UI primitives for accessibility
  ```tsx
  import * as React from 'react';
  import { Slot } from '@radix-ui/react-slot';
  ```

- **DO**: Use class-variance-authority (cva) for variants
  ```tsx
  import { cva, type VariantProps } from 'class-variance-authority';
  
  const buttonVariants = cva(
    'base-classes',
    {
      variants: {
        variant: { default: '...', destructive: '...' },
        size: { default: '...', sm: '...' },
      },
      defaultVariants: { variant: 'default', size: 'default' },
    }
  );
  ```

- **DO**: Forward refs properly
  ```tsx
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
      return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
  );
  Button.displayName = 'Button';
  ```

- **DO**: Use `cn()` utility for class merging
  ```tsx
  import { cn } from '../utils/cn.js';
  ```

### Styling

- Tailwind CSS classes only
- Use design tokens (colors from Tailwind palette)
- Primary: `indigo-600`, Danger: `red-500`, Neutral: `gray-*`
- Focus rings: `focus-visible:ring-2 focus-visible:ring-indigo-500`

## Key Files

| File | Purpose |
|------|---------|
| `components/button.tsx` | Button component with variants |
| `utils/cn.ts` | `clsx` + `tailwind-merge` utility |
| `index.ts` | Public exports |

## JIT Index

```bash
# Find component
rg "export.*Button\|export.*Component" src/components --type tsx

# Find variant definition
rg "cva(" src/components --type tsx

# Find cn usage
rg "cn(" src --type tsx
```

## Common Gotchas

- **Peer dependencies**: React 19+ required (not bundled)
- **Build required**: Changes require `bun run build` to propagate
- **Forward refs**: Always forward refs for composability
- **asChild pattern**: Use Radix Slot for polymorphic components

## Pre-PR Checks

```bash
cd packages/ui && bun run typecheck && bun run lint && bun run build
```

## Consumer Usage

```tsx
// In web app
import { Button } from '@firsttimers/ui';

<Button variant="destructive" size="sm">Delete</Button>
```
