CREATE TABLE documents (
    id           UUID         PRIMARY KEY,
    file_name    VARCHAR(255) NOT NULL,
    content_hash CHAR(64)     NOT NULL UNIQUE,
    pages        INT          NOT NULL,
    chunks       INT          NOT NULL,
    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);