-- ============================================================
-- Gallery, article publishing support and notifications
-- Idempotent: safe to run more than once.
-- ============================================================

-- ── Gallery ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_path TEXT NOT NULL,
    alt_text TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID REFERENCES admin_profiles(id)
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published gallery items" ON gallery_items;
CREATE POLICY "Public can view published gallery items"
    ON gallery_items FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage all gallery items" ON gallery_items;
CREATE POLICY "Admins can manage all gallery items"
    ON gallery_items FOR ALL
    USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- ── Article publishing support ──────────────────────────────
-- `body` holds Markdown; the public page renders it. These columns are
-- added defensively in case the base schema predates them.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_image_path TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;

-- ── Site settings the public pages read ─────────────────────
INSERT INTO site_settings (key, value, is_public) VALUES
    ('contact_email', '"adesua.oriaifo@gmail.com"', true),
    ('contact_phone', '"+234 803 456 7890"', true),
    ('contact_location', '"Lagos, Nigeria"', true),
    ('response_time', '"Within one working day"', true),
    ('gallery_categories', '["Professional","Workshop","Speaking","Team","Portrait","Consulting"]', true),
    ('business_hours', '{"monday":"9:00-17:00","tuesday":"9:00-17:00","wednesday":"9:00-17:00","thursday":"9:00-17:00","friday":"9:00-17:00","saturday":"closed","sunday":"closed"}', true)
ON CONFLICT (key) DO NOTHING;

-- ── Notifications ───────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their own notifications" ON notifications;
CREATE POLICY "Admins can view their own notifications"
    ON notifications FOR SELECT
    USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update their own notifications" ON notifications;
CREATE POLICY "Admins can update their own notifications"
    ON notifications FOR UPDATE
    USING (recipient_id = auth.uid());

-- New enquiry → notify every active owner/administrator.
CREATE OR REPLACE FUNCTION notify_on_enquiry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (recipient_id, title, body, kind, resource_id, resource_type, link)
    SELECT
        p.id,
        'New enquiry received',
        'A new ' || NEW.category || ' enquiry from ' || NEW.name,
        'enquiry',
        NEW.id,
        'enquiry',
        '/admin/enquiries/' || NEW.id
    FROM admin_profiles p
    WHERE p.role IN ('owner', 'administrator') AND p.status = 'active';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_on_enquiry_trigger ON enquiries;
CREATE TRIGGER notify_on_enquiry_trigger
    AFTER INSERT ON enquiries
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_enquiry();

-- Article published → notify the owner.
CREATE OR REPLACE FUNCTION notify_on_article_published()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (recipient_id, title, body, kind, resource_id, resource_type, link)
    SELECT
        p.id,
        'Article published',
        NEW.title || ' is now live on the site',
        'activity',
        NEW.id,
        'article',
        '/insights/' || NEW.slug
    FROM admin_profiles p
    WHERE p.role IN ('owner', 'administrator') AND p.status = 'active';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_on_article_published_trigger ON articles;
CREATE TRIGGER notify_on_article_published_trigger
    AFTER UPDATE ON articles
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published')
    EXECUTE FUNCTION notify_on_article_published();

-- Gallery item published → notify the owner.
CREATE OR REPLACE FUNCTION notify_on_gallery_published()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (recipient_id, title, body, kind, resource_id, resource_type, link)
    SELECT
        p.id,
        'Gallery updated',
        NEW.title || ' was published to the gallery',
        'activity',
        NEW.id,
        'gallery_item',
        '/gallery'
    FROM admin_profiles p
    WHERE p.role IN ('owner', 'administrator') AND p.status = 'active';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_on_gallery_published_trigger ON gallery_items;
CREATE TRIGGER notify_on_gallery_published_trigger
    AFTER INSERT OR UPDATE ON gallery_items
    FOR EACH ROW
    WHEN (NEW.status = 'published')
    EXECUTE FUNCTION notify_on_gallery_published();

-- ── Timestamps ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gallery_items_updated_at ON gallery_items;
CREATE TRIGGER update_gallery_items_updated_at
    BEFORE UPDATE ON gallery_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_items_status ON gallery_items(status);
CREATE INDEX IF NOT EXISTS idx_gallery_items_sort ON gallery_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);

-- ── Dashboard stats ─────────────────────────────────────────
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM enquiries WHERE status = 'new') AS new_enquiries,
    (SELECT COUNT(*) FROM enquiries WHERE status = 'in_progress') AS in_progress_enquiries,
    (SELECT COUNT(*) FROM enquiries WHERE status = 'resolved') AS resolved_enquiries,
    (SELECT COUNT(*) FROM articles WHERE status = 'published') AS published_articles,
    (SELECT COUNT(*) FROM articles WHERE status = 'draft') AS draft_articles,
    (SELECT COUNT(*) FROM gallery_items WHERE status = 'published') AS published_gallery_items,
    (SELECT COUNT(*) FROM notifications WHERE is_read = false) AS unread_notifications;
