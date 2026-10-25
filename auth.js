
const jwt = require('jsonwebtoken');

const ALGORITHM = 'HS256';

function jwtConfig() {
  const secret = process.env.JWT_SECRET;
  const issuer = process.env.JWT_ISSUER;
  const audience = process.env.JWT_AUDIENCE;

  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes.');
  }

  if (!issuer || !audience) {
    throw new Error('JWT_ISSUER and JWT_AUDIENCE are required.');
  }

  return { secret, issuer, audience };
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !/^Bearer \S+$/.test(header)) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  const token = header.slice(7);

  try {
    const config = jwtConfig();

    const payload = jwt.verify(token, config.secret, {
      algorithms: [ALGORITHM],
      issuer: config.issuer,
      audience: config.audience,
      clockTolerance: 5
    });

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      !['reader', 'admin'].includes(payload.role)
    ) {
      return res.status(401).json({
        error: 'Invalid authentication token.'
      });
    }

    req.user = {
      id: payload.sub,
      role: payload.role
    };

    next();
  } catch (error) {
    if (error.message.startsWith('JWT_')) {
      return next(error);
    }

    return res.status(401).json({
      error: 'Invalid or expired authentication token.'
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions.'
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  jwtConfig,
  ALGORITHM
};
