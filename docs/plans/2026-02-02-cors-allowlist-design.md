# CORS Allowlist for Production Subdomains

## Context
The production web app at `https://firsttimers.lwukz1.church` calls the API at
`https://firsttimers-api.lwukz1.church`. The API currently only allows localhost
origins, which causes CORS preflight failures in production.

## Goals
- Allow CORS requests from any subdomain of `lwukz1.church`.
- Keep safe defaults for local development without extra configuration.
- Make allowed origins configurable via environment variables.

## Non-Goals
- Implement a generic CORS proxy or wildcard allow-all.
- Introduce new dependencies or runtime services.

## Approach
Add a `CORS_ORIGINS` environment variable with a comma-separated allowlist.
Entries can be exact origins or wildcard subdomain patterns like
`https://*.lwukz1.church`. At runtime, build a resolver that validates the
request `Origin` header against the allowlist. Exact matches compare the full
origin string. Wildcard entries validate scheme and hostname suffix, allowing
any subdomain while rejecting the apex domain unless explicitly listed.

If `CORS_ORIGINS` is not set, default to the existing localhost allowlist for
developer convenience. If the origin does not match, return `null` so the
middleware omits `Access-Control-Allow-Origin` and the browser blocks the
request.

## Configuration
- `CORS_ORIGINS=https://*.lwukz1.church` in Dokploy for production.
- Optional local override in `.env.example`.

## Testing
- Manual: load the web app, verify preflight succeeds, and `/auth/me` works.
- Safety: confirm an unrelated origin does not receive CORS headers.
