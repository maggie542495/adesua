-- ============================================================
-- Social links
--
-- `social_linkedin` was seeded as an empty string, so the About page's
-- "Connect on LinkedIn" link never rendered (the page treats an empty
-- setting as "no link"). This sets the real profile. Idempotent.
-- ============================================================

INSERT INTO site_settings (key, value, is_public) VALUES
    ('social_linkedin',
     '"https://www.linkedin.com/in/adesua-margaret-oriaifo-423633182"'::jsonb,
     true)
ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        is_public = EXCLUDED.is_public;
