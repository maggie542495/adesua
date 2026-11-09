-- ═══════════════════════════════════════════════════════════
-- 000002 — Row Level Security policies
-- Public-readable (published) vs admin-only separation.
-- Never trust user-supplied role info — role always comes
-- from admin_profiles keyed by auth.uid().
-- ═══════════════════════════════════════════════════════════

-- ── Enable RLS ──────────────────────────────────────────────
alter table public.admin_profiles enable row level security;
alter table public.admin_invitations enable row level security;
alter table public.site_settings enable row level security;
alter table public.homepage_content enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.services enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.media_assets enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.enquiry_assignments enable row level security;
alter table public.email_accounts enable row level security;
alter table public.email_messages enable row level security;
alter table public.email_attachments enable row level security;
alter table public.email_drafts enable row level security;
alter table public.email_send_log enable row level security;
alter table public.chatbot_conversations enable row level security;
alter table public.chatbot_messages enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_runs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.collective_entries enable row level security;

-- ── admin_profiles ──────────────────────────────────────────
drop policy if exists admin_profiles_select on public.admin_profiles;
create policy admin_profiles_select on public.admin_profiles
  for select to authenticated
  using (id = auth.uid() or public.has_admin_role('editor'));

drop policy if exists admin_profiles_self_update on public.admin_profiles;
create policy admin_profiles_self_update on public.admin_profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Owner manages roles/status via service role or owner policies
drop policy if exists admin_profiles_owner_manage on public.admin_profiles;
create policy admin_profiles_owner_manage on public.admin_profiles
  for all to authenticated
  using (public.has_admin_role('owner'))
  with check (public.has_admin_role('owner'));

-- ── admin_invitations (admin+) ──────────────────────────────
drop policy if exists invitations_admin_all on public.admin_invitations;
create policy invitations_admin_all on public.admin_invitations
  for all to authenticated
  using (public.has_admin_role('administrator'))
  with check (public.has_admin_role('administrator'));

-- ── site_settings ───────────────────────────────────────────
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated
  using (is_public = true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all to authenticated
  using (public.has_admin_role('administrator'))
  with check (public.has_admin_role('administrator'));

-- ── homepage_content ────────────────────────────────────────
drop policy if exists homepage_public_read on public.homepage_content;
create policy homepage_public_read on public.homepage_content
  for select to anon, authenticated
  using (true);

drop policy if exists homepage_admin_write on public.homepage_content;
create policy homepage_admin_write on public.homepage_content
  for all to authenticated
  using (public.has_admin_role('administrator'))
  with check (public.has_admin_role('administrator'));

-- ── pages ───────────────────────────────────────────────────
drop policy if exists pages_public_read on public.pages;
create policy pages_public_read on public.pages
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists pages_admin_write on public.pages;
create policy pages_admin_write on public.pages
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

-- ── page_sections ───────────────────────────────────────────
drop policy if exists page_sections_public_read on public.page_sections;
create policy page_sections_public_read on public.page_sections
  for select to anon, authenticated
  using (
    is_visible
    and exists (
      select 1 from public.pages p
      where p.id = page_id and p.status = 'published'
    )
  );

drop policy if exists page_sections_admin_write on public.page_sections;
create policy page_sections_admin_write on public.page_sections
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

-- ── services ────────────────────────────────────────────────
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

-- ── article_categories ──────────────────────────────────────
drop policy if exists categories_public_read on public.article_categories;
create policy categories_public_read on public.article_categories
  for select to anon, authenticated
  using (true);

drop policy if exists categories_admin_write on public.article_categories;
create policy categories_admin_write on public.article_categories
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

-- ── articles ────────────────────────────────────────────────
drop policy if exists articles_public_read on public.articles;
create policy articles_public_read on public.articles
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists articles_admin_write on public.articles;
create policy articles_admin_write on public.articles
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

-- ── media_assets ────────────────────────────────────────────
drop policy if exists media_public_read on public.media_assets;
create policy media_public_read on public.media_assets
  for select to anon, authenticated
  using (true);

drop policy if exists media_admin_write on public.media_assets;
create policy media_admin_write on public.media_assets
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

-- ── enquiries ───────────────────────────────────────────────
-- Anyone may submit an enquiry (insert only, validated server-side too).
drop policy if exists enquiries_public_insert on public.enquiries;
create policy enquiries_public_insert on public.enquiries
  for insert to anon, authenticated
  with check (
    status = 'new'
    and is_spam = false
    and source in ('contact-form', 'chatbot-escalation')
  );

drop policy if exists enquiries_admin_read on public.enquiries;
create policy enquiries_admin_read on public.enquiries
  for select to authenticated
  using (public.has_admin_role('editor'));

drop policy if exists enquiries_admin_update on public.enquiries;
create policy enquiries_admin_update on public.enquiries
  for update to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

drop policy if exists enquiries_admin_delete on public.enquiries;
create policy enquiries_admin_delete on public.enquiries
  for delete to authenticated
  using (public.has_admin_role('administrator'));

-- ── enquiry_notes / enquiry_assignments ─────────────────────
drop policy if exists enquiry_notes_admin_all on public.enquiry_notes;
create policy enquiry_notes_admin_all on public.enquiry_notes
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

drop policy if exists enquiry_assignments_admin_all on public.enquiry_assignments;
create policy enquiry_assignments_admin_all on public.enquiry_assignments
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

-- ── email (admin only) ──────────────────────────────────────
drop policy if exists email_accounts_admin on public.email_accounts;
create policy email_accounts_admin on public.email_accounts
  for all to authenticated
  using (public.has_admin_role('administrator'))
  with check (public.has_admin_role('administrator'));

drop policy if exists email_messages_admin on public.email_messages;
create policy email_messages_admin on public.email_messages
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

drop policy if exists email_attachments_admin on public.email_attachments;
create policy email_attachments_admin on public.email_attachments
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

drop policy if exists email_drafts_admin on public.email_drafts;
create policy email_drafts_admin on public.email_drafts
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

drop policy if exists email_send_log_admin on public.email_send_log;
create policy email_send_log_admin on public.email_send_log
  for select to authenticated
  using (public.has_admin_role('editor'));

-- ── chatbot ─────────────────────────────────────────────────
-- Anonymous visitors may create/read their own conversation via
-- server-side routes (service role). Direct anon policies limited
-- to insert for bootstrapping; reads go through the API layer.
drop policy if exists chat_conversations_public_insert on public.chatbot_conversations;
create policy chat_conversations_public_insert on public.chatbot_conversations
  for insert to anon, authenticated
  with check (status = 'active');

drop policy if exists chat_conversations_admin_read on public.chatbot_conversations;
create policy chat_conversations_admin_read on public.chatbot_conversations
  for select to authenticated
  using (public.has_admin_role('editor'));

drop policy if exists chat_conversations_admin_update on public.chatbot_conversations;
create policy chat_conversations_admin_update on public.chatbot_conversations
  for update to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));

drop policy if exists chat_messages_public_insert on public.chatbot_messages;
create policy chat_messages_public_insert on public.chatbot_messages
  for insert to anon, authenticated
  with check (true);

drop policy if exists chat_messages_admin_read on public.chatbot_messages;
create policy chat_messages_admin_read on public.chatbot_messages
  for select to authenticated
  using (public.has_admin_role('editor'));

-- ── ai_usage_logs (server writes via service role) ──────────
drop policy if exists ai_usage_admin_read on public.ai_usage_logs;
create policy ai_usage_admin_read on public.ai_usage_logs
  for select to authenticated
  using (public.has_admin_role('administrator'));

-- ── notifications ───────────────────────────────────────────
drop policy if exists notifications_recipient_read on public.notifications;
create policy notifications_recipient_read on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_recipient_update on public.notifications;
create policy notifications_recipient_update on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- inserts happen server-side (service role) on real events

-- ── push_subscriptions ──────────────────────────────────────
drop policy if exists push_own_all on public.push_subscriptions;
create policy push_own_all on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── automation ──────────────────────────────────────────────
drop policy if exists automation_rules_admin on public.automation_rules;
create policy automation_rules_admin on public.automation_rules
  for all to authenticated
  using (public.has_admin_role('administrator'))
  with check (public.has_admin_role('administrator'));

drop policy if exists automation_runs_admin_read on public.automation_runs;
create policy automation_runs_admin_read on public.automation_runs
  for select to authenticated
  using (public.has_admin_role('administrator'));

-- ── audit_logs ──────────────────────────────────────────────
drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs
  for select to authenticated
  using (public.has_admin_role('administrator'));

-- inserts via service role only (server-side audit writer)

-- ── collective_entries ──────────────────────────────────────
drop policy if exists collective_public_read on public.collective_entries;
create policy collective_public_read on public.collective_entries
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists collective_admin_write on public.collective_entries;
create policy collective_admin_write on public.collective_entries
  for all to authenticated
  using (public.has_admin_role('editor'))
  with check (public.has_admin_role('editor'));
