# Development Quick Start

## To run the app without Sentry warnings:

```bash
# Option 1: Run without Turbopack (recommended for now)
npm run dev

# Option 2: If you want to use Turbopack, disable Sentry temporarily
NEXT_PUBLIC_SENTRY_DSN="" npm run dev --turbo
```

## The warnings you're seeing are because:

1. Turbopack (the new Next.js bundler) doesn't support the old Sentry configuration style
2. We've updated to use the new instrumentation approach
3. These are just warnings - the app will still run fine

## To completely resolve:

1. The configuration has been updated to use `instrumentation-client.ts`
2. The old `sentry.client.config.ts` has been renamed to `.old`
3. Just restart your dev server normally with `npm run dev`
