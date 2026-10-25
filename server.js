
require('dotenv').config({ quiet: true });

const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { z } = require('zod');

const pool = require('./db/pool');
const { authenticate, authorize, jwtConfig } = require('./auth');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '16kb' }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false
}));

const bookColumns = `
  id AS "_id",
  name,
  author,
  category,
  is_easy_read AS "isEasyRead"
`;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bookSchema = z.object({
  name: z.string().trim().min(1).max(150),
  author: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
  isEasyRead: z.boolean().optional()
}).strict();

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function validateId(req, res, next) {
  if (!uuidPattern.test(req.params.id)) {
    return res.status(400).json({
      error: 'Invalid book ID.'
    });
  }

  next();
}

function validateBody(req, res, next) {
  const schema = req.method === 'POST'
    ? bookSchema
    : bookSchema.partial().refine(
        data => Object.keys(data).length > 0,
        'At least one field is required.'
      );

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid book data.',
      details: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  req.body = result.data;
  next();
}

// All Books API routes require authentication.
app.use('/api/books', authenticate);

// GET all books: reader or admin
app.get('/api/books',
  authorize('reader', 'admin'),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT ${bookColumns}
       FROM books
       ORDER BY name, id`
    );

    res.status(200).json({
      books: result.rows
    });
  })
);

// GET one book: reader or admin
app.get('/api/books/:id',
  authorize('reader', 'admin'),
  validateId,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT ${bookColumns}
       FROM books
       WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Book not found.'
      });
    }

    res.status(200).json(result.rows[0]);
  })
);

// CREATE: admin only
app.post('/api/books',
  authorize('admin'),
  validateBody,
  asyncHandler(async (req, res) => {
    const {
      name,
      author,
      category,
      isEasyRead = false
    } = req.body;

    const result = await pool.query(
      `INSERT INTO books
         (name, author, category, is_easy_read)
       VALUES ($1, $2, $3, $4)
       RETURNING ${bookColumns}`,
      [name, author, category, isEasyRead]
    );

    res.status(201).json(result.rows[0]);
  })
);

// UPDATE: admin only; partial updates supported
app.put('/api/books/:id',
  authorize('admin'),
  validateId,
  validateBody,
  asyncHandler(async (req, res) => {
    const allowedColumns = {
      name: 'name',
      author: 'author',
      category: 'category',
      isEasyRead: 'is_easy_read'
    };

    const entries = Object.entries(req.body);

    const assignments = entries.map(
      ([key], index) => `${allowedColumns[key]} = $${index + 1}`
    );

    const values = entries.map(([, value]) => value);

    const result = await pool.query(
      `UPDATE books
       SET ${assignments.join(', ')}
       WHERE id = $${values.length + 1}
       RETURNING ${bookColumns}`,
      [...values, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Book not found.'
      });
    }

    res.status(200).json(result.rows[0]);
  })
);

// DELETE: admin only
app.delete('/api/books/:id',
  authorize('admin'),
  validateId,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `DELETE FROM books
       WHERE id = $1
       RETURNING ${bookColumns}`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Book not found.'
      });
    }

    res.status(200).json(result.rows[0]);
  })
);

// Centralized error handling
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (
    err.type === 'entity.parse.failed' ||
    err.type === 'entity.too.large' ||
    err.status === 413 ||
    ['23514', '23502', '22001', '22P02'].includes(err.code)
  ) {
    return res.status(400).json({
      error: 'Invalid request data.'
    });
  }

  console.error(err);

  res.status(500).json({
    error: 'An unexpected server error occurred.'
  });
});

async function start() {
  jwtConfig();
  await pool.query('SELECT 1');

  const port = Number(process.env.PORT || 5000);

  app.listen(port, '127.0.0.1', () => {
    console.log(
      `Books API running at http://127.0.0.1:${port}`
    );
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error(
      'Unable to start the Books API:',
      error.message
    );
    process.exitCode = 1;
  });
}

module.exports = app;
