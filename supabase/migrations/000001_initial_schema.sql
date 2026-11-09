-- ═══════════════════════════════════════════════════════════
-- 000001 — Initial schema
-- Adesua Oriaifo personal brand & engagement platform
-- UUID PKs · created_at/updated_at · enums · indexes · triggers
-- Order: extensions → enums → helper fn → tables → role fns → triggers
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────
do $$ begin
  create type admin_role as enum ('owner', 'administrator', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_status as enum ('active', 'invited', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enquiry_status as enum ('new', 'in_progress', 'awaiting_response', 'resolved', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft', 'published', 'scheduled', 'unpublished');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum ('enquiry', 'escalation', 'email', 'failure', 'activity', 'alert', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_folder as enum ('inbox', 'sent', 'drafts', 'archive', 'trash');
exception when duplicate_object then null; end $$;

-- ── updated_at helper ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Admin ───────────────────────────────────────────────────
create table if not exists public.admin_profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null unique,
  full_name     text,
  role          admin_role not null default 'editor',
  status        admin_status not null default 'invited',
  avatar_url    text,
  last_login_at timestamptz,
  deactivated_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.admin_invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        admin_role not null default 'editor',
  token_hash  text not null,
  invited_by  uuid references public.admin_profiles (id) on delete set null,
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists admin_invitations_email_idx on public.admin_invitations (email);
create index if not exists admin_invitations_expires_idx on public.admin_invitations (expires_at);

-- ── Settings & homepage ─────────────────────────────────────
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  is_public   boolean not null default false,
  updated_by  uuid references public.admin_profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.homepage_content (
  id                     uuid primary key default gen_random_uuid(),
  hero_eyebrow           text,
  hero_headline          text,
  hero_subheadline       text,
  hero_body              text,
  hero_cta_primary_label text,
  hero_cta_primary_href  text,
  hero_cta_secondary_label text,
  hero_cta_secondary_href  text,
  featured_image_path    text,
  sections               jsonb not null default '[]'::jsonb,
  updated_by             uuid references public.admin_profiles (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ── Pages & sections ────────────────────────────────────────
create table if not exists public.pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  description      text,
  status           content_status not null default 'draft',
  hero_image_path  text,
  seo_title        text,
  seo_description  text,
  seo_image_path   text,
  published_at     timestamptz,
  scheduled_at     timestamptz,
  updated_by       uuid references public.admin_profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists pages_status_idx on public.pages (status);

create table if not exists public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references public.pages (id) on delete cascade,
  section_key text not null,
  sort_order  integer not null default 0,
  title       text,
  body        text,
  media       jsonb not null default '{}'::jsonb,
  config      jsonb not null default '{}'::jsonb,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (page_id, section_key)
);

create index if not exists page_sections_page_idx on public.page_sections (page_id, sort_order);

-- ── Services (two pathways) ─────────────────────────────────
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  pathway         text not null check (pathway in ('personal-growth', 'professional-impact')),
  title           text not null,
  summary         text,
  body            text,
  icon            text,
  sort_order      integer not null default 0,
  status          content_status not null default 'draft',
  seo_title       text,
  seo_description text,
  published_at    timestamptz,
  scheduled_at    timestamptz,
  updated_by      uuid references public.admin_profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists services_pathway_status_idx on public.services (pathway, status);

-- ── Insights (articles) ─────────────────────────────────────
create table if not exists public.article_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.articles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  title                text not null,
  excerpt              text,
  body                 text,
  cover_image_path     text,
  category_id          uuid references public.article_categories (id) on delete set null,
  status               content_status not null default 'draft',
  reading_time_minutes integer check (reading_time_minutes is null or reading_time_minutes > 0),
  is_featured          boolean not null default false,
  seo_title            text,
  seo_description      text,
  seo_image_path       text,
  published_at         timestamptz,
  scheduled_at         timestamptz,
  author_id            uuid references public.admin_profiles (id) on delete set null,
  updated_by           uuid references public.admin_profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists articles_status_pub_idx on public.articles (status, published_at desc);
create index if not exists articles_category_idx on public.articles (category_id);
create index if not exists articles_featured_idx on public.articles (is_featured) where is_featured;
create index if not exists articles_scheduled_idx on public.articles (scheduled_at) where status = 'scheduled';

-- ── Media library ───────────────────────────────────────────
create table if not exists public.media_assets (
  id              uuid primary key default gen_random_uuid(),
  storage_path    text not null unique,
  public_url      text,
  file_name       text not null,
  mime_type       text not null,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  width           integer,
  height          integer,
  alt_text        text,
  caption         text,
  category        text not null default 'general',
  is_featured     boolean not null default false,
  uploaded_by     uuid references public.admin_profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists media_category_idx on public.media_assets (category);
create index if not exists media_created_idx on public.media_assets (created_at desc);

-- ── Enquiries ───────────────────────────────────────────────
create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(btrim(name)) between 1 and 200),
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        text,
  subject      text,
  category     text not null,
  message      text not null check (length(btrim(message)) between 1 and 20000),
  pathway      text check (pathway is null or pathway in ('personal-growth', 'professional-impact')),
  status       enquiry_status not null default 'new',
  source       text not null default 'contact-form',
  assigned_to  uuid references public.admin_profiles (id) on delete set null,
  is_spam      boolean not null default false,
  ip_hash      text,
  user_agent   text,
  responded_at timestamptz,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists enquiries_status_idx on public.enquiries (status, created_at desc);
create index if not exists enquiries_assigned_idx on public.enquiries (assigned_to);
create index if not exists enquiries_email_idx on public.enquiries (email);

create table if not exists public.enquiry_notes (
  id          uuid primary key default gen_random_uuid(),
  enquiry_id  uuid not null references public.enquiries (id) on delete cascade,
  author_id   uuid references public.admin_profiles (id) on delete set null,
  body        text not null,
  is_internal boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists enquiry_notes_enquiry_idx on public.enquiry_notes (enquiry_id, created_at);

create table if not exists public.enquiry_assignments (
  id            uuid primary key default gen_random_uuid(),
  enquiry_id    uuid not null references public.enquiries (id) on delete cascade,
  assigned_to   uuid references public.admin_profiles (id) on delete set null,
  assigned_by   uuid references public.admin_profiles (id) on delete set null,
  assigned_at   timestamptz not null default now(),
  unassigned_at timestamptz
);

create index if not exists enquiry_assignments_enquiry_idx on public.enquiry_assignments (enquiry_id, assigned_at desc);

-- ── Email (Zoho) ────────────────────────────────────────────
create table if not exists public.email_accounts (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  email_address text not null unique,
  provider      text not null default 'zoho',
  is_default    boolean not null default false,
  imap_host     text,
  imap_port     integer,
  smtp_host     text,
  smtp_port     integer,
  sync_cursor   text,
  last_sync_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.email_messages (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.email_accounts (id) on delete cascade,
  provider_message_id text not null,
  thread_id           text,
  folder              email_folder not null default 'inbox',
  direction           text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  subject             text,
  from_name           text,
  from_email          text,
  to_recipients       jsonb not null default '[]'::jsonb,
  cc_recipients       jsonb not null default '[]'::jsonb,
  bcc_recipients      jsonb not null default '[]'::jsonb,
  reply_to            jsonb,
  body_text           text,
  body_html           text,
  preview_text        text,
  is_read             boolean not null default false,
  has_attachments     boolean not null default false,
  sent_at             timestamptz,
  received_at         timestamptz,
  enquiry_id          uuid references public.enquiries (id) on delete set null,
  raw_headers         jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (account_id, folder, provider_message_id)
);

create index if not exists email_messages_folder_idx on public.email_messages (account_id, folder, coalesce(sent_at, received_at) desc);
create index if not exists email_messages_thread_idx on public.email_messages (thread_id);
create index if not exists email_messages_enquiry_idx on public.email_messages (enquiry_id);
create index if not exists email_messages_unread_idx on public.email_messages (account_id, folder) where not is_read;

create table if not exists public.email_attachments (
  id                     uuid primary key default gen_random_uuid(),
  message_id             uuid not null references public.email_messages (id) on delete cascade,
  file_name              text not null,
  mime_type              text,
  size_bytes             bigint,
  storage_path           text,
  provider_attachment_id text,
  created_at             timestamptz not null default now()
);

create index if not exists email_attachments_message_idx on public.email_attachments (message_id);

create table if not exists public.email_drafts (
  id                     uuid primary key default gen_random_uuid(),
  account_id             uuid references public.email_accounts (id) on delete set null,
  to_recipients          jsonb not null default '[]'::jsonb,
  cc_recipients          jsonb not null default '[]'::jsonb,
  bcc_recipients         jsonb not null default '[]'::jsonb,
  subject                text,
  body_html              text,
  body_text              text,
  signature_html         text,
  in_reply_to_message_id uuid references public.email_messages (id) on delete set null,
  enquiry_id             uuid references public.enquiries (id) on delete set null,
  is_ai_generated        boolean not null default false,
  ai_meta                jsonb,
  status                 text not null default 'draft' check (status in ('draft', 'sent', 'discarded')),
  created_by             uuid references public.admin_profiles (id) on delete set null,
  sent_message_id        uuid references public.email_messages (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists email_drafts_status_idx on public.email_drafts (status, updated_at desc);

create table if not exists public.email_send_log (
  id         uuid primary key default gen_random_uuid(),
  message_id text,
  envelope   jsonb,
  subject    text,
  status     text not null check (status in ('queued', 'sent', 'failed', 'retried')),
  error      text,
  attempts   integer not null default 1,
  enquiry_id uuid references public.enquiries (id) on delete set null,
  draft_id   uuid references public.email_drafts (id) on delete set null,
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists email_send_log_status_idx on public.email_send_log (status, created_at desc);

-- ── Chatbot & AI ────────────────────────────────────────────
create table if not exists public.chatbot_conversations (
  id               uuid primary key default gen_random_uuid(),
  visitor_key      text not null,
  session_token    text,
  name             text,
  email            text,
  phone            text,
  consent_contact  boolean not null default false,
  pathway_interest text check (pathway_interest is null or pathway_interest in ('personal-growth', 'professional-impact')),
  status           text not null default 'active' check (status in ('active', 'escalated', 'closed')),
  escalated_at     timestamptz,
  enquiry_id       uuid references public.enquiries (id) on delete set null,
  started_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  ended_at         timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists chat_conversations_status_idx on public.chatbot_conversations (status, last_message_at desc);
create index if not exists chat_conversations_visitor_idx on public.chatbot_conversations (visitor_key);

create table if not exists public.chatbot_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chatbot_conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system', 'escalation')),
  content         text not null,
  tokens_in       integer,
  tokens_out      integer,
  created_at      timestamptz not null default now()
);

create index if not exists chat_messages_conversation_idx on public.chatbot_messages (conversation_id, created_at);

create table if not exists public.ai_usage_logs (
  id              uuid primary key default gen_random_uuid(),
  action          text not null,
  provider        text,
  model           text,
  conversation_id uuid references public.chatbot_conversations (id) on delete set null,
  enquiry_id      uuid references public.enquiries (id) on delete set null,
  user_id         uuid references public.admin_profiles (id) on delete set null,
  tokens_in       integer,
  tokens_out      integer,
  latency_ms      integer,
  status          text not null default 'success' check (status in ('success', 'error', 'fallback', 'rate_limited')),
  error           text,
  created_at      timestamptz not null default now()
);

create index if not exists ai_usage_created_idx on public.ai_usage_logs (created_at desc);
create index if not exists ai_usage_action_idx on public.ai_usage_logs (action, created_at desc);

-- ── Notifications & push ────────────────────────────────────
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.admin_profiles (id) on delete cascade,
  kind          notification_kind not null,
  title         text not null,
  body          text,
  link          text,
  resource_type text,
  resource_id   text,
  is_read       boolean not null default false,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, is_read, created_at desc);

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_id      uuid not null references public.admin_profiles (id) on delete cascade,
  device_label text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

-- ── Automation ──────────────────────────────────────────────
create table if not exists public.automation_rules (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  name       text not null,
  enabled    boolean not null default false,
  config     jsonb not null default '{}'::jsonb,
  updated_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id            uuid primary key default gen_random_uuid(),
  rule_key      text not null,
  trigger_type  text not null,
  resource_type text,
  resource_id   text,
  status        text not null check (status in ('success', 'failed', 'skipped')),
  detail        jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists automation_runs_created_idx on public.automation_runs (created_at desc);
create index if not exists automation_runs_rule_idx on public.automation_runs (rule_key, created_at desc);

-- ── Audit ───────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.admin_profiles (id) on delete set null,
  actor_email   text,
  action        text not null,
  resource_type text not null,
  resource_id   text,
  metadata      jsonb not null default '{}'::jsonb,
  ip_hash       text,
  created_at    timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

-- ── The Intentional Collective ──────────────────────────────
-- Extensible editorial content only — no membership checkout,
-- prices, registration, or fabricated events.
create table if not exists public.collective_entries (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text,
  body         text,
  entry_type   text not null default 'note' check (entry_type in ('note', 'reflection', 'resource', 'update')),
  image_path   text,
  status       content_status not null default 'draft',
  sort_order   integer not null default 0,
  published_at timestamptz,
  scheduled_at timestamptz,
  updated_by   uuid references public.admin_profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists collective_status_idx on public.collective_entries (status, sort_order);

-- ── Role helper functions (tables must exist first) ─────────
create or replace function public.current_admin_role()
returns admin_role
language sql
security definer
set search_path = public
stable
as $$
  select role from admin_profiles where id = auth.uid() and status = 'active';
$$;

create or replace function public.has_admin_role(required admin_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    case public.current_admin_role()
      when 'owner' then true
      when 'administrator' then required in ('administrator', 'editor')
      when 'editor' then required = 'editor'
      else false
    end,
    false
  );
$$;

revoke all on function public.current_admin_role() from public;
revoke all on function public.has_admin_role(admin_role) from public;
grant execute on function public.current_admin_role() to authenticated, anon;
grant execute on function public.has_admin_role(admin_role) to authenticated, anon;

-- ── updated_at triggers ─────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_profiles', 'site_settings', 'homepage_content', 'pages',
    'page_sections', 'services', 'article_categories', 'articles',
    'media_assets', 'enquiries', 'enquiry_notes', 'email_accounts',
    'email_messages', 'email_drafts', 'chatbot_conversations',
    'automation_rules', 'collective_entries'
  ] loop
    begin
      execute format(
        'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
        t
      );
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;
