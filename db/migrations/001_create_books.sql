CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_easy_read BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT books_name_not_blank
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT books_author_not_blank
        CHECK (LENGTH(TRIM(author)) > 0),

    CONSTRAINT books_category_not_blank
        CHECK (LENGTH(TRIM(category)) > 0)
);