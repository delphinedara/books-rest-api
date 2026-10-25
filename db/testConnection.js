require('dotenv').config();

const pool = require('./pool');

async function testConnection() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS username
    `);

    console.log('PostgreSQL connection successful');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();