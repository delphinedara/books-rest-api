const path = require('path');
const dotenv = require('dotenv');

const result = dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
  quiet: true
});

if (result.error) {
  throw new Error(
    'Missing .env.test. Create it before running automated tests.'
  );
}

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests require NODE_ENV=test.');
}

if (process.env.DB_NAME !== 'books_api_test') {
  throw new Error(
    'Refusing to run tests against a non-test database.'
  );
}