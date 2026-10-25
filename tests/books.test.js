
const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../server');
const pool = require('../db/pool');
const { jwtConfig, ALGORITHM } = require('../auth');

function tokenFor(role) {
  const config = jwtConfig();

  return jwt.sign(
    { role },
    config.secret,
    {
      algorithm: ALGORITHM,
      issuer: config.issuer,
      audience: config.audience,
      subject: `test-${role}`,
      expiresIn: '15m'
    }
  );
}

const adminToken = tokenFor('admin');
const readerToken = tokenFor('reader');

const adminAuth = `Bearer ${adminToken}`;
const readerAuth = `Bearer ${readerToken}`;

afterAll(async () => {
  await pool.end();
});

describe('Books API - security and CRUD', () => {
  test('rejects requests without authentication', async () => {
    const response = await request(app)
      .get('/api/books');

    expect(response.status).toBe(401);
  });

  test('rejects an invalid token', async () => {
    const response = await request(app)
      .get('/api/books')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  test('reader can retrieve books', async () => {
    const response = await request(app)
      .get('/api/books')
      .set('Authorization', readerAuth);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.books)).toBe(true);
  });

  test('reader cannot create books', async () => {
    const response = await request(app)
      .post('/api/books')
      .set('Authorization', readerAuth)
      .send({
        name: 'Forbidden Book',
        author: 'Tester',
        category: 'Security'
      });

    expect(response.status).toBe(403);
  });

  test('rejects an invalid UUID', async () => {
    const response = await request(app)
      .get('/api/books/invalid-id')
      .set('Authorization', readerAuth);

    expect(response.status).toBe(400);
  });

  test('rejects missing required fields', async () => {
    const response = await request(app)
      .post('/api/books')
      .set('Authorization', adminAuth)
      .send({ name: 'Incomplete Book' });

    expect(response.status).toBe(400);
  });

  test('rejects unexpected fields', async () => {
    const response = await request(app)
      .post('/api/books')
      .set('Authorization', adminAuth)
      .send({
        name: 'Test',
        author: 'Tester',
        category: 'Testing',
        isAdmin: true
      });

    expect(response.status).toBe(400);
  });

  test('rejects SQL injection-shaped IDs', async () => {
    const response = await request(app)
      .get("/api/books/' OR 1=1 --")
      .set('Authorization', readerAuth);

    expect(response.status).toBe(400);
  });

  test('includes security headers', async () => {
    const response = await request(app)
      .get('/api/books');

    expect(response.headers['x-content-type-options'])
      .toBe('nosniff');

    expect(response.headers['x-powered-by'])
      .toBeUndefined();
  });

  test('admin can create, read, update and delete a book', async () => {
    let bookId;

    try {
      const created = await request(app)
        .post('/api/books')
        .set('Authorization', adminAuth)
        .send({
          name: 'Automation Test Book',
          author: 'QA Engineer',
          category: 'Testing',
          isEasyRead: true
        });

      expect(created.status).toBe(201);
      expect(created.body._id).toBeDefined();

      bookId = created.body._id;

      const retrieved = await request(app)
        .get(`/api/books/${bookId}`)
        .set('Authorization', readerAuth);

      expect(retrieved.status).toBe(200);
      expect(retrieved.body.name).toBe('Automation Test Book');

      const updated = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', adminAuth)
        .send({ category: 'API Automation' });

      expect(updated.status).toBe(200);
      expect(updated.body.category).toBe('API Automation');

      const deleted = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', adminAuth);

      expect(deleted.status).toBe(200);

      const missing = await request(app)
        .get(`/api/books/${bookId}`)
        .set('Authorization', readerAuth);

      expect(missing.status).toBe(404);
    } finally {
      if (bookId) {
        await pool.query(
          'DELETE FROM books WHERE id = $1',
          [bookId]
        );
      }
    }
  });
});
