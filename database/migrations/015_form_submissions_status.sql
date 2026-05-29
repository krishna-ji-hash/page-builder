ALTER TABLE form_submissions
  ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'received' AFTER meta_json,
  ADD INDEX idx_form_submissions_status (status);
