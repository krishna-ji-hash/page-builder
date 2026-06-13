-- Domain verification audit fields (additive)
ALTER TABLE project_domains
  ADD COLUMN last_checked_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at,
  ADD COLUMN verification_error VARCHAR(512) NULL DEFAULT NULL AFTER last_checked_at;
