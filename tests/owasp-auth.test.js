const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../server');
const pool = require('../db/pool');
const { jwtConfig, ALGORITHM } = require('../auth');

const config = jwtConfig();

function makeToken(payload, options = {}) {
  return jwt.sign(payload, config.secret, {
    algorithm: ALGORITHM,
    issuer: config.issuer,
    audience: config.audience,
    ...options
  });
}

function getBooks(token) {
  return request(app)
    .get('/api/books')
    .set('Authorization', `Bearer ${token}`);
}

afterAll(async () => {
  await pool.end();
});

describe('OWASP API2:2023 - Broken Authentication', () => {
  test('rejects expired JWTs', async () => {
    const token = makeToken(
      { role: 'reader' },
      { expiresIn: -60 }
    );

    const response = await getBooks(token);

    expect(response.status).toBe(401);
  });

  test('rejects JWTs signed with the wrong secret', async () => {
    const token = jwt.sign(
      { role: 'admin' },
      'incorrect-test-signing-secret',
      {
        algorithm: ALGORITHM,
        issuer: config.issuer,
        audience: config.audience,
        expiresIn: '15m'
      }
    );

    const response = await getBooks(token);

    expect(response.status).toBe(401);
  });

  test('rejects tampered JWTs', async () => {
    const token = makeToken(
      { role: 'reader' },
      { expiresIn: '15m' }
    );

    const parts = token.split('.');
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString()
    );

    payload.role = 'admin';
    parts[1] = Buffer.from(
      JSON.stringify(payload)
    ).toString('base64url');

    const response = await getBooks(parts.join('.'));

    expect(response.status).toBe(401);
  });

  test('rejects JWTs with the wrong audience', async () => {
    const token = makeToken(
      { role: 'reader' },
      { audience: 'unauthorized-client', expiresIn: '15m' }
    );

    const response = await getBooks(token);

    expect(response.status).toBe(401);
  });

  test('rejects JWTs with the wrong issuer', async () => {
    const token = makeToken(
      { role: 'reader' },
      { issuer: 'untrusted-issuer', expiresIn: '15m' }
    );

    const response = await getBooks(token);

    expect(response.status).toBe(401);
  });
});
