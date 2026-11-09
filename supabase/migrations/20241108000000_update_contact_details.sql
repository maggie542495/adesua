-- ============================================================
-- Real contact details
--
-- The gallery/notifications migration seeded placeholder values.
-- This corrects them in place. Idempotent: safe to run more than once.
-- ============================================================

UPDATE site_settings
   SET value = '"contact@adesuaoriaifo.com"'
 WHERE key = 'contact_email';

UPDATE site_settings
   SET value = '"+234 806 640 1688"'
 WHERE key = 'contact_phone';

-- Publishing states used by articles and gallery items. `contentStatus` in
-- src/lib/admin/schema.ts lists `scheduled` and `unpublished`, which the
-- original gallery CHECK constraint rejected — widening it keeps the editor
-- honest. `archived` is kept for rows written before the editor changed.
--
-- `articles.status` is the `content_status` ENUM, which already carries
-- draft / published / scheduled / unpublished, so it needs no change here.
ALTER TABLE gallery_items
    DROP CONSTRAINT IF EXISTS gallery_items_status_check;
ALTER TABLE gallery_items
    ADD CONSTRAINT gallery_items_status_check
    CHECK (status IN ('draft', 'published', 'scheduled', 'unpublished', 'archived'));
