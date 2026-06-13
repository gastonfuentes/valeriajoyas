# valeria joyas

E-commerce de joyas de plata 925, diseño minimalista. Buenos Aires, Argentina.  
Currency: ARS. Language: es-AR.

## Tech stack

- **Next.js 15** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** (PostCSS plugin)
- **Supabase** (Postgres + Auth + Storage) via `@supabase/ssr`
- **Mercado Pago** (payments — Stage 4)
- Node 26, npm 11

## Prerequisites

- Node ≥ 20 (tested on 26)
- npm ≥ 10
- A Supabase project — already provisioned at ref `qpcmisncomrgngwxdgkn`

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in the real values in .env.local (see table below)
npm run dev
```

The Supabase project is already provisioned and migrated. You do not need to run migrations unless resetting locally.

## Environment variables

| Variable | Required now | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Stage 3+ | Service role key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full public URL for OAuth redirects |
| `MP_ACCESS_TOKEN` | Stage 4 | Mercado Pago server token |
| `MP_PUBLIC_KEY` | Stage 4 | Mercado Pago public key |
| `MP_WEBHOOK_SECRET` | Stage 4 | Mercado Pago webhook secret |
| `SHIPPING_PROVIDER` | Stage 5 | `mock` \| `andreani` \| `oca` \| `correo_ar` |
| `ANDREANI_API_KEY` | Stage 5 | Andreani REST API key |
| `OCA_USER` / `OCA_PASSWORD` | Stage 5 | OCA e-Pak credentials |
| `CORREO_AR_API_KEY` | Stage 5 | Correo Argentino API key |
| `SHIP_ORIGIN_POSTAL_CODE` | Stage 5 | Store origin postal code |
| `AI_PROVIDER` | Stage 6 | `claude` \| `openai` |
| `ANTHROPIC_API_KEY` | Stage 6 | Anthropic API key |
| `OPENAI_API_KEY` | Stage 6 | OpenAI API key |

## Database

Migrations live in `supabase/migrations/`. Seed in `supabase/seed.sql`.

To apply via CLI (if you link the project):
```bash
supabase link --project-ref qpcmisncomrgngwxdgkn
supabase db push          # apply pending migrations
supabase db reset         # reset + re-seed (destructive)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript check without build |

## Auth

1. In the [Supabase dashboard](https://supabase.com/dashboard/project/qpcmisncomrgngwxdgkn/auth/providers):
   - Enable **Email** provider (enabled by default)
   - Enable **Google** provider: add OAuth Client ID + Secret from Google Cloud Console; set authorized redirect URI to `https://<project>.supabase.co/auth/v1/callback`

2. **Make yourself an admin** — sign up, then run in the Supabase SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## Deploy

**Vercel** (recommended):
1. Import repo in Vercel
2. Set all required env vars in Project Settings
3. Deploy

**Netlify**:
1. Import repo
2. Install `@netlify/plugin-nextjs`
3. Set env vars; build command is `npm run build`

## Roadmap

| Stage | Description | Status |
|---|---|---|
| 1 | Project scaffold, Supabase SSR, auth, home page | ✅ Done |
| 2 | Product catalog, product detail, category filter | Pending |
| 3 | Admin panel (CRUD products, categories, inventory) | Pending |
| 4 | Cart, checkout, Mercado Pago integration | Pending |
| 5 | Shipping quotes (Andreani / OCA / Correo AR) | Pending |
| 6 | AI chatbot (product recommendations) | Pending |
| 7 | Orders dashboard, email notifications | Pending |
