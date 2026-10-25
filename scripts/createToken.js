
require('dotenv').config({ quiet: true });

const jwt = require('jsonwebtoken');
const {
  jwtConfig,
  ALGORITHM
} = require('../auth');

const role = process.argv[2];

if (!['reader', 'admin'].includes(role)) {
  console.error(
    'Usage: node scripts/createToken.js reader|admin'
  );
  process.exitCode = 1;
} else {
  try {
    const config = jwtConfig();

    const token = jwt.sign(
      { role },
      config.secret,
      {
        algorithm: ALGORITHM,
        issuer: config.issuer,
        audience: config.audience,
        subject: `local-${role}`,
        expiresIn: '15m'
      }
    );

    console.log(token);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
