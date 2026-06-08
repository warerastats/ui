# WareraStats UI

Bare-bones SvelteKit app with TypeScript, Houdini GraphQL integration, and Cloudflare-ready deployment configuration.

## Stack

- SvelteKit + TypeScript
- Houdini (houdinigraphql)
- Cloudflare adapter + Wrangler

## Environment

Copy `.env.example` to `.env` (or set vars in your shell):

- `GRAPHQL_ENDPOINT` defaults to `https://graph.warerastats.io/query`
- `GRAPHQL_BEARER_TOKEN` should be set to your bearer token (`ben` for now)

## Server-only GraphQL boundary

- Upstream GraphQL access lives in `src/lib/server/graphql/client.ts`
- Browser-side Houdini client points to internal `POST /api/graphql`
- `src/routes/api/graphql/+server.ts` is the only network bridge to upstream GraphQL

This keeps bearer auth out of browser code.

## Local development

1. Install deps:
   - `pnpm install`
2. Pull the latest schema (requires `GRAPHQL_BEARER_TOKEN`):
   - `pnpm houdini:pull-schema`
3. Optional runtime generation:
   - `pnpm houdini:generate`
4. Start dev server:
   - `pnpm dev`

## Build

- `pnpm build`
- `pnpm preview`

## Cloudflare Pages

`wrangler.toml` is configured for Cloudflare output at `.svelte-kit/cloudflare`.

Useful commands:

- Local Pages preview: `pnpm cf:dev`
- Deploy to Pages: `pnpm cf:deploy`

Set `GRAPHQL_BEARER_TOKEN` in Cloudflare Pages environment variables/secrets for each environment.
