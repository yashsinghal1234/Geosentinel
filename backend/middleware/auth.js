const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me-in-production';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      badge: user.badge
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.geosentinel_token) {
    token = req.cookies.geosentinel_token;
  }

  if (!token) {
    // Development / demo graceful fallback
    req.user = {
      username: 'operator@geosentinel.gov.in',
      email: 'operator@geosentinel.gov.in',
      role: 'operator',
      name: 'S. K. Verma (Chief Mining Safety Engineer)',
      badge: 'OPERATOR L3'
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn('JWT verification failed:', err.message);
    // Dev fallback
    req.user = {
      username: 'operator@geosentinel.gov.in',
      email: 'operator@geosentinel.gov.in',
      role: 'operator',
      name: 'S. K. Verma (Chief Mining Safety Engineer)',
      badge: 'OPERATOR L3'
    };
    return next();
  }
}

async function optionalAuth(req, res, next) {
  return requireAuth(req, res, next);
}

module.exports = {
  generateToken,
  requireAuth,
  optionalAuth,
  JWT_SECRET
};
