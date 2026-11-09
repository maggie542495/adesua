-- ═══════════════════════════════════════════════════════════
-- 000004 — Structural seed (safe for production)
-- Only structural rows: insight categories (per spec),
-- site setting keys, automation rule defaults, homepage row.
-- Contains NO fabricated biography, credentials, prices,
-- testimonials, or client content.
-- Development-only content seeds live in supabase/seed/.
-- ═══════════════════════════════════════════════════════════

-- ── Insight categories (7, per content spec) ────────────────
insert into public.article_categories (slug, name, sort_order) values
  ('personal-growth',       'Personal Growth',          1),
  ('professional-impact',   'Professional Impact',      2),
  ('leadership',            'Leadership',               3),
  ('customer-experience',   'Customer Experience',      4),
  ('purpose-intentionality','Purpose & Intentionality', 5),
  ('facilitation-l-d',      'Facilitation & L&D',       6),
  ('reflections',           'Reflections',              7)
on conflict (slug) do nothing;

-- ── Site settings keys ──────────────────────────────────────
insert into public.site_settings (key, value, is_public) values
  ('site_name',        '"Adesua Oriaifo"'::jsonb,                 true),
  ('brand_description','"Customer Experience & Client Success Leader, Coach, and Facilitator."'::jsonb, true),
  ('contact_email',    '""'::jsonb,                               false),
  ('contact_phone',    '""'::jsonb,                               false),
  ('social_linkedin',  '""'::jsonb,                               true),
  ('social_twitter',   '""'::jsonb,                               true),
  ('social_instagram', '""'::jsonb,                               true),
  ('footer_tagline',   '"A life lived with purpose. An impact made with intention."'::jsonb, true),
  ('footer_copyright', '"© Adesua Oriaifo"'::jsonb,               true),
  ('seo_defaults',     '{"titleSuffix":"Adesua Oriaifo","description":"","image":"/brand/portrait-black-blazer.jpg"}'::jsonb, true),
  ('homepage_hero',    '{"eyebrow":"","headline":"","subheadline":"","image":"/brand/cutout-headshot.png","ctaPrimaryLabel":"","ctaPrimaryHref":"/work-with-me","ctaSecondaryLabel":"","ctaSecondaryHref":"/about"}'::jsonb, true),
  ('announcement_banner', '{"enabled":false,"message":"","link":""}'::jsonb, true),
  ('notification_prefs',   '{"emailOnNewEnquiry":true,"emailOnEscalation":true,"emailOnEmailFailure":true,"pushEnabled":false}'::jsonb, false),
  ('ai_settings',          '{"provider":"","model":"","draftOnly":true,"maxMessagesPerSession":40}'::jsonb, false),
  ('email_status',         '{"configured":false,"lastCheckedAt":null}'::jsonb, false)
on conflict (key) do nothing;

-- ── Homepage single row ─────────────────────────────────────
insert into public.homepage_content (id, hero_eyebrow, hero_headline, hero_subheadline, hero_body, hero_cta_primary_label, hero_cta_primary_href, hero_cta_secondary_label, hero_cta_secondary_href, featured_image_path, sections)
values (
  '00000000-0000-0000-0000-000000000001',
  'Transform. Transcend. Become.',
  'A life lived with purpose. An impact made with intention.',
  'Customer Experience & Client Success Leader · Coach · Facilitator',
  'Meaningful growth, without losing yourself.',
  'Work with me',
  '/work-with-me',
  'About Adesua',
  '/about',
  '/brand/cutout-headshot.png',
  '[]'::jsonb
)
on conflict (id) do nothing;

-- ── Automation rules (all disabled until explicitly enabled) ─
insert into public.automation_rules (key, name, enabled, config) values
  ('enquiry_acknowledgement',   'Enquiry acknowledgement to sender',        false, '{"template":"enquiry_ack"}'),
  ('contact_confirmation',      'Contact form confirmation to sender',      false, '{"template":"contact_confirm"}'),
  ('admin_new_enquiry_notify',  'Notify admins of new enquiries',           true,  '{"channel":"dashboard"}'),
  ('ai_reply_draft',            'AI-assisted reply drafting (draft-only)',  false, '{"requiresApproval":true}'),
  ('follow_up_reminder',        'Follow-up reminder for open enquiries',    false, '{"daysAfter":3}'),
  ('internal_escalation',       'Internal escalation notification',         true,  '{"channel":"dashboard"}')
on conflict (key) do nothing;
