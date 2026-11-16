ALTER TABLE documents
    ADD COLUMN owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE documents DROP CONSTRAINT documents_content_hash_key;

ALTER TABLE documents
    ADD CONSTRAINT documents_owner_content_hash_key UNIQUE (owner_id, content_hash);