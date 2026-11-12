# Adesua Oriaifo — Personal Brand & Engagement Platform

A production-ready personal brand platform for **Adesua Oriaifo** — Customer Experience Specialist (CXS™), Head of Customer Success, coach and facilitator — combining a fast, editorial public website with a private content, enquiry and email studio.

> **Transform. Transcend. Become.**

- **Public site:** biography, pathways, insights, gallery, references and contact
- **Studio (admin):** content management, article publishing, enquiry inbox, email replies and team administration
- **Zee:** an AI concierge that answers visitor questions, captures enquiries and emails both visitor and owner

---

## Table of contents

- [Overview](#overview)
- [Routes at a glance](#routes-at-a-glance)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [First owner and team access](#first-owner-and-team-access)
- [Admin roles](#admin-roles)
- [How the main pieces work](#how-the-main-pieces-work)
- [Data model](#data-model)
- [Design system](#design-system)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [Contributing](#contributing)

---

## Overview

This repository contains two experiences that share one codebase and one database:

1. **The public site** — a typography-led, motion-aware marketing site with server-rendered, cached content reads from Supabase. It remains fully available even when Supabase is not configured.
2. **The studio** — a private, role-gated admin area for everything Adesua publishes, receives and replies to. Access is protected by Supabase Auth, an `admin_profiles` record and an optional TOTP factor.

The platform is built as a single Next.js App Router application with server actions, a generic table registry for administration, and purpose-built screens where generic editing would get in the way (articles, email, security and settings).

---

## Routes at a glance

### Public

| Route | Purpose |
| --- | --- |
| `/` | Homepage: hero, metrics, pathways, featured insights and calls to action |
| `/about` | Biography, values, professional experience and credentials |
| `/work-with-me` | Coaching, consulting, speaking and writing pathways |
| `/insights` | Published articles with category filtering |
| `/insights/[slug]` | Article reader with Markdown-rendered body |
| `/gallery` | Curated visual record of coaching, facilitation and speaking work |
| `/references` | LinkedIn recommendations, quoted verbatim |
| `/contact` | Enquiry form with validation, spam checks and email delivery |
| `/email-preview` | Internal email template preview (development helper) |

### Studio and auth

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard: enquiries, activity, notifications and quick actions |
| `/admin/[table]` | Registry-driven list, create, edit and delete screens for every managed table |
| `/admin/[table]/new` | Create a record |
| `/admin/[table]/[id]` | Edit a record |
| `/admin/[table]/export` | CSV export that honours the active search, sort and filters |
| `/admin/articles` | Article workspace with Markdown editor, cover upload and publishing controls |
| `/admin/email-studio` | SMTP connection status, enquiry inbox, replies, test email |
| `/admin/security` | Password change, TOTP MFA, sign out everywhere, recent audit events |
| `/admin/settings` | Site settings such as contact details, announcement and booking link |
| `/auth/login` | Studio sign-in |
| `/auth/setup` | One-time owner bootstrap or invitation acceptance |

### API

| Route | Purpose |
| --- | --- |
| `/api/zee/chat` | `GET` conversation history, `POST` visitor message to Zee |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16.4.5** (App Router, Server Actions, Cache Components) |
| UI | **React 19.3**, TypeScript 5, Tailwind CSS 4 via `@tailwindcss/turbopack` |
| Database & auth | **Supabase** — Postgres, Auth, Storage and Row Level Security |
| Validation | **Zod 4** |
| Motion | **Framer Motion 14** |
| Icons | **Lucide React** |
| Email | **Nodemailer** over **Zoho Mail SMTP** |
| AI | **Google Gemini** (free-tier model chain) |
| Fonts | Cormorant Garamond (display) and Manrope (body) via `next/font` |

The project tracks the Next.js 16 conventions documented in `node_modules/next/dist/docs/`. Notably, it uses `cacheComponents`, `"use cache"`, `cacheLife`, `cacheTag`, `connection()` and route-level `export const instant = false` where a route must remain blocking. Check those docs before introducing new data-fetching, caching or middleware patterns.

---

## Project structure

```text
.
├── public/                        # Brand assets, icons, fonts and static images
├── scripts/
│   └── generate-icons.mjs         # Regenerates favicons and social icons from source art
├── src/
│   ├── app/
│   │   ├── (public)/              # Marketing routes (shared public layout)
│   │   ├── admin/                 # Studio routes (auth-gated)
│   │   ├── api/zee/chat/          # Zee conversation endpoint
│   │   ├── auth/                  # Login, setup and invitation acceptance
│   │   ├── email-preview/         # Email template preview
│   │   ├── globals.css            # Design tokens, typography and base styles
│   │   └── layout.tsx             # Fonts, metadata, theme provider
│   ├── components/
│   │   ├── admin/                 # Studio shell, article editor, forms, MFA panel
│   │   ├── auth/                  # Login, setup and invitation forms
│   │   ├── public/                # Hero, navigation, sections, motion primitives
│   │   └── ui/                    # Buttons, cards, badges, accordions and icons
│   ├── config/site.ts             # Single source of truth for brand content and links
│   ├── content/                   # Curated recommendations and experience copy
│   ├── lib/
│   │   ├── admin/                 # Table registry, data access, actions, derivation
│   │   ├── auth/                  # Roles, session helpers, sign-in and setup actions
│   │   ├── email/                 # Zoho SMTP transport, templates and sends
│   │   ├── media/                 # Resolves repository and Supabase Storage images
│   │   ├── supabase/              # Browser, server, public and service-role clients
│   │   ├── zee/                   # AI assistant prompt, model chain and conversation store
│   │   ├── markdown.ts            # Small escape-first Markdown renderer
│   │   └── validation/            # Zod schemas for auth and forms
│   ├── providers/                 # Theme and other client providers
│   ├── repositories/              # Cached, read-only public content repositories
│   ├── types/database.ts          # Generated Supabase types
│   └── middleware.ts              # Session refresh, scoped to /admin and /auth only
├── supabase/
│   ├── migrations/                # Schema, RLS policies, storage and seeds
│   └── seed/                      # Optional seed data
├── .env.example                   # Every supported environment variable
├── next.config.ts                 # Cache Components, images, Turbopack rules
└── AGENTS.md                      # Next.js 16 guidance for AI-assisted development
```

---

## Getting started

### Prerequisites

- **Node.js 20.9 or newer** (Next.js 16 requires `>=20.9.0`)
- **npm** (a `package-lock.json` is committed)
- A **Supabase project** for the studio, authentication and public content
- A **Zoho Mail** mailbox with SMTP access for outbound email
- A **Google AI Studio API key** for Zee

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env.local
```

Fill in the values described in [Environment variables](#environment-variables). Never commit `.env.local`; `.env*` is ignored except for `.env.example`.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public site renders even with an empty environment; the studio needs Supabase configuration.

---

## Environment variables

All supported variables live in [`.env.example`](.env.example). The table below explains what each one is for.

### Site

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin used for metadata, Open Graph and emails. Defaults to `https://adesua.com`. |
| `NEXT_PUBLIC_APP_URL` | Optional | Secondary application URL used by integrations. |

### Supabase

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL, readable in the browser. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable/anon key for browser and public content clients. |
| `SUPABASE_URL` | Recommended | Server-side project URL; falls back to `NEXT_PUBLIC_SUPABASE_URL`. |
| `SUPABASE_SECRET_KEY` | Server only | Service-role key. Bypasses RLS. Never expose it to the browser. |
| `SUPABASE_JWKS_URL` | Optional | Reserved for asymmetric JWT verification. |
| `SUPABASE_PUBLISHABLE_KEY` | Optional | Server alias for the publishable key. |

### Admin bootstrap

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_SETUP_SECRET` | First run only | Long random value that unlocks one-time owner creation at `/auth/setup`. Generate with `openssl rand -hex 32`. |

### Zoho Mail — outbound SMTP

| Variable | Required | Purpose |
| --- | --- | --- |
| `ZOHO_SMTP_HOST` | Yes | e.g. `smtp.zoho.com`. |
| `ZOHO_SMTP_PORT` | Yes | `465` for implicit TLS, `587` for STARTTLS. |
| `ZOHO_SMTP_SECURE` | Yes | `true` with port 465, `false` with port 587. |
| `ZOHO_SMTP_USER` | Yes | Authenticated mailbox address. |
| `ZOHO_SMTP_PASSWORD` | Yes | Mailbox or app password. |
| `ZOHO_MAIL_FROM` | Yes | Must be the authenticated address or a verified alias. Zoho rejects anything else with `550 5.7.1 Sender is not allowed to relay emails`. |
| `ZOHO_MAIL_FROM_NAME` | Optional | Display name on sent messages. |
| `ZOHO_MAIL_REPLY_TO` | Optional | Where replies are directed. |

### Zoho Mail — inbox integration (optional / reserved)

`ZOHO_API_BASE_URL`, `ZOHO_OAUTH_CLIENT_ID`, `ZOHO_OAUTH_CLIENT_SECRET`, `ZOHO_OAUTH_REFRESH_TOKEN`, `ZOHO_ACCOUNT_ID`, `ZOHO_IMAP_HOST` and `ZOHO_IMAP_PORT` are scaffolded in `.env.example` for future mailbox synchronisation. Outbound email and the enquiry inbox work without them.

### Zee — AI assistant

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_API_KEY` | Yes | Gemini Developer API key from Google AI Studio. |
| `AI_MODEL` | Optional | Pin a model, or provide a comma-separated chain. |
| `AI_MODEL_FALLBACKS` | Optional | Extra models tried before the built-in free-tier chain. |
| `AI_MAX_TOKENS` | Optional | Default `400`. |
| `AI_TEMPERATURE` | Optional | Default `0.6`. |

The built-in chain tries free-tier Gemini models in order and falls through automatically on a rate limit or retired model.

### Web push (optional / reserved)

`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` are scaffolded for browser push notifications. The `push_subscriptions` table exists in the schema; in-app notifications work without these values.

---

## Supabase setup

Apply the migrations in filename order. Using the Supabase CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Or paste each file from [`supabase/migrations`](supabase/migrations) into the Supabase SQL Editor, in order:

| Migration | Contents |
| --- | --- |
| `000001_initial_schema.sql` | Enums, tables, indexes and `updated_at` triggers |
| `000002_rls_policies.sql` | Row Level Security policies for every public and admin table |
| `000003_storage.sql` | Storage buckets and object policies |
| `000004_structure_seed.sql` | Initial structure and reference data |
| `20241107000000_add_blog_gallery_notifications.sql` | Blog, gallery and notifications additions |
| `20241108000000_update_contact_details.sql` | Contact detail updates |
| `20241108000001_update_social_links.sql` | Social link updates |

After applying them:

1. Confirm **Storage** has the expected public buckets for media, article covers and gallery images.
2. Confirm RLS is enabled on all tables.
3. Add the production origin to **Authentication → URL Configuration**.

---

## First owner and team access

There is no public sign-up.

1. Set `ADMIN_SETUP_SECRET` in the environment.
2. Visit `/auth/setup`.
3. Enter the setup secret, your name, email and password.
4. The first owner account is created, an `admin_profiles` record is written and the setup path disables itself once an owner exists.

Everyone after that joins through an invitation:

1. Sign in as the owner.
2. Open **Team** (`/admin/admin_invitations`).
3. Invite an email and choose a role.
4. The invitation is emailed and expires after seven days. The recipient sets a name and password at `/auth/setup?invite=…`.

---

## Admin roles

| Role | Rank | Intended use |
| --- | --- | --- |
| `editor` | 1 | Day-to-day content, enquiries and replies |
| `administrator` | 2 | Content plus team and settings management |
| `owner` | 3 | Full access, including security-sensitive operations |

Role checks are centralised in [`src/lib/auth/roles.ts`](src/lib/auth/roles.ts) and enforced on the server by `requireAdmin` and `requireAdminApi`.

---

## How the main pieces work

### Public content and caching

Public reads go through small repository functions in [`src/repositories`](src/repositories). Each uses `"use cache"`, a `cacheLife` window and a `cacheTag`, so pages are fast and can be invalidated precisely when content changes.

```ts
"use cache";
cacheLife("minutes");
cacheTag("articles:published");
```

Admin actions call `revalidatePath` and `updateTag` after writes, keeping the public site and studio in sync without a full rebuild.

### Generic table registry

[`src/lib/admin/schema.ts`](src/lib/admin/schema.ts) describes every managed table once: its label, columns, field types, validation, read-only fields and which role may write it. The list, create, edit, delete and export screens are generated from that registry, so adding a table or column is usually a one-file change.

Purpose-built screens sit alongside it where a generic form would be poor:

- **Articles** need a body, slug, SEO fields, cover upload and draft/scheduled/published states.
- **Email Studio** needs a live SMTP check, enquiry context and AI-assisted replies.
- **Security** needs MFA enrolment, password changes and audit history.
- **Settings** needs typed JSON editing with validation.

### Contact and enquiries

The public contact form validates input with Zod, applies spam checks and stores an enquiry in Supabase. The studio shows new enquiries in the dashboard and Email Studio, where they can be triaged, replied to and marked through their lifecycle (`new → in_progress → awaiting_response → resolved → archived`).

### Zee, the AI concierge

Zee lives in a floating widget on the public site. The browser posts to `/api/zee/chat`; the server loads the visitor's conversation, builds a grounded prompt from Adesua's verified professional profile, and streams back a reply through the Gemini model chain.

Zee can:

- answer questions about Adesua's background, services and pathways
- remember a visitor's conversation between visits using a browser-held key
- capture a name, email and area of interest with consent
- create an enquiry
- email the owner an alert and send the visitor an auto-reply

Conversation and AI usage are logged in the database for review.

### Email

Outbound mail uses Nodemailer over Zoho SMTP. Templates are composed in [`src/lib/email/template.ts`](src/lib/email/template.ts); sends are centralised in [`src/lib/email/send.ts`](src/lib/email/send.ts). The transport is cached after the first use.

The studio performs a real SMTP connection check rather than trusting environment variables, and it warns when `ZOHO_MAIL_FROM` does not belong to the authenticated mailbox — the most common cause of silent send failures.

### Markdown

Article bodies are rendered by a deliberately small renderer in [`src/lib/markdown.ts`](src/lib/markdown.ts). It supports headings, emphasis, links, images, lists, quotes, tables, rules, inline code and fenced code, and escapes everything else. Raw HTML never passes through, so article bodies cannot inject markup. Tables scroll horizontally inside the article column on narrow screens.

---

## Data model

The schema is organised around these domains:

| Domain | Tables |
| --- | --- |
| Administration | `admin_profiles`, `admin_invitations`, `audit_logs` |
| Site content | `site_settings`, `homepage_content`, `pages`, `page_sections`, `services`, `media_assets` |
| Articles | `article_categories`, `articles` |
| Gallery | `gallery_items` |
| Enquiries | `enquiries`, `enquiry_notes`, `enquiry_assignments` |
| Email | `email_accounts`, `email_messages`, `email_attachments`, `email_drafts`, `email_send_log` |
| Zee | `chatbot_conversations`, `chatbot_messages`, `ai_usage_logs` |
| Notifications | `notifications`, `push_subscriptions` |
| Automation | `automation_rules`, `automation_runs` |
| Community | `collective_entries` |

Enums cover admin roles and statuses, enquiry status, content status, notification kinds and email folders. `updated_at` is maintained by a shared trigger. Row Level Security is enabled in `000002_rls_policies.sql`.

---

## Design system

- **Palette:** plum, gold and ivory tokens defined in [`src/app/globals.css`](src/app/globals.css), with light and dark themes.
- **Typography:** Cormorant Garamond for display headings, Manrope for body copy.
- **Motion:** reveal-on-scroll, magnetic links, scroll progress, marquee, quote rotation and a particle field — all progressively enhanced.
- **Components:** reusable primitives live in `src/components/ui`; public composition lives in `src/components/public`.
- **Accessibility:** semantic landmarks, visible focus states, reduced-motion handling and descriptive alt text on imagery.

Brand copy, metrics, pathways, values and social links live in [`src/config/site.ts`](src/config/site.ts). Prefer editing that file over scattering copy across components.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server with Turbopack |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `node scripts/generate-icons.mjs` | Regenerate favicons and app icons from the source brand art |

---

## Deployment

The application deploys cleanly to any Node.js host that supports Next.js 16; Vercel is the simplest fit.

1. Import the repository into the hosting provider.
2. Add every variable from `.env.example` that your deployment needs. At minimum: Supabase URL, publishable key and secret key; `ADMIN_SETUP_SECRET` for the first boot; `NEXT_PUBLIC_SITE_URL`; Zoho SMTP credentials; `AI_API_KEY`.
3. Apply the Supabase migrations against the production project.
4. Make sure `NEXT_PUBLIC_SITE_URL` matches the production origin so canonical URLs, Open Graph images and email links resolve correctly.
5. Add the production origin to Supabase **Authentication → URL Configuration**.
6. After the first owner is created, you may remove `ADMIN_SETUP_SECRET` from the environment. Owner setup is also blocked once an owner exists.

Images from Supabase Storage are allowed through `next.config.ts` for the project host under `/storage/v1/object/public/**`. If you move to a different storage host, update `remotePatterns` too.

---

## Security notes

- **Never expose `SUPABASE_SECRET_KEY`.** It is only read by [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts), which is marked `server-only`.
- **Middleware is deliberately scoped** to `/admin` and `/auth`. A Supabase outage cannot take the public site down, and public pages never depend on a session.
- **RLS is the backstop.** Admin writes are also checked in the application, but every table carries Row Level Security policies.
- **Setup is single-use.** Owner creation requires `ADMIN_SETUP_SECRET` and is refused once an owner exists. Invitations are single-use and expire after seven days.
- **Markdown is escaped.** No raw HTML reaches the rendered article body.
- **Email addresses are never validated by existence.** Sign-in failures are deliberately vague.
- **Secrets stay out of the database.** SMTP passwords and AI keys are environment variables, never settings records.
- **CSV export is role-gated** and mirrors the filters the admin is currently viewing.

---

## Contributing

1. Create a branch from `main`.
2. Keep changes focused; match the existing patterns rather than introducing a second way to do the same thing.
3. Before writing data-fetching or routing code, read the relevant guide in `node_modules/next/dist/docs/` — this Next.js version differs from older App Router conventions.
4. Run `npm run lint` and `npm run build` before opening a pull request.
5. Do not commit `.env.local`, generated mail dumps or `.tmp-*` files.

Questions about the platform: [contact@adesuaoriaifo.com](mailto:contact@adesuaoriaifo.com)

---

© Adesua Oriaifo. All rights reserved.
