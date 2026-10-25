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

const readerAuth = `Bearer ${tokenFor('reader')}`;

afterAll(async () => {
  await pool.end();
});

describe('OWASP API5:2023 - Broken Function Level Authorization', () => {
  const testId = '00000000-0000-4000-8000-000000000001';

  test('reader cannot update books', async () => {
    const response = await request(app)
      .put(`/api/books/${testId}`)
      .set('Authorization', readerAuth)
      .send({ category: 'Unauthorized Update' });

    expect(response.status).toBe(403);
  });

  test('reader cannot delete books', async () => {
    const response = await request(app)
      .delete(`/api/books/${testId}`)
      .set('Authorization', readerAuth);

    expect(response.status).toBe(403);
  });

  test('unauthenticated user cannot create books', async () => {
    const response = await request(app)
      .post('/api/books')
      .send({
        name: 'Unauthorized Book',
        author: 'Attacker',
        category: 'Security'
      });

    expect(response.status).toBe(401);
  });

  test('unauthenticated user cannot update books', async () => {
    const response = await request(app)
      .put(`/api/books/${testId}`)
      .send({ category: 'Unauthorized Update' });

    expect(response.status).toBe(401);
  });

  test('unauthenticated user cannot delete books', async () => {
    const response = await request(app)
      .delete(`/api/books/${testId}`);

    expect(response.status).toBe(401);
  });
});
