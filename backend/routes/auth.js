const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, requireAuth } = require('../middleware/auth');
const { DEFAULT_USERS, InMemoryStore, seedAllData } = require('../seed/seedData');
const { getIsMock } = require('../config/db');

// 1. POST /api/auth/login - Strict Database Authentication
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const inputUser = (email || username || '').trim();
    const inputPass = (password || '').trim();

    if (!inputUser || !inputPass) {
      return res.status(400).json({
        status: 'error',
        message: 'Both Email/Username and Password are required.'
      });
    }

    let userDoc = null;
    const isMock = getIsMock();

    // 1. Query MongoDB if connected
    if (!isMock) {
      try {
        userDoc = await User.findOne({
          $or: [
            { email: new RegExp(`^${inputUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            { username: new RegExp(`^${inputUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          ]
        });
      } catch (err) {
        console.warn('MongoDB query warning in login:', err.message);
      }
    }

    // 2. Query InMemoryStore if not in MongoDB or in offline mode
    if (!userDoc) {
      userDoc = InMemoryStore.users.find(
        u => u.email.toLowerCase() === inputUser.toLowerCase() || u.username.toLowerCase() === inputUser.toLowerCase()
      );
    }

    // 3. If user is NOT found in database, REJECT immediately (NO AUTO-CREATION)
    if (!userDoc) {
      return res.status(401).json({
        status: 'error',
        message: `Account '${inputUser}' not found in database. Please use registered credentials (e.g. admin@geo.com / password123).`
      });
    }

    // 4. Strict Password Verification
    let isPasswordValid = false;
    if (typeof userDoc.comparePassword === 'function') {
      isPasswordValid = await userDoc.comparePassword(inputPass);
    } else if (userDoc.password_hash) {
      isPasswordValid = await bcrypt.compare(inputPass, userDoc.password_hash);
    } else if (userDoc.password) {
      isPasswordValid = inputPass === userDoc.password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect password. Access denied.'
      });
    }

    // 5. Generate secure JWT token
    const token = generateToken(userDoc);

    return res.status(200).json({
      status: 'success',
      access_token: token,
      token: token,
      token_type: 'bearer',
      name: userDoc.name || 'Safety Officer',
      role: userDoc.role || 'operator',
      email: userDoc.email || inputUser,
      badge: userDoc.badge || (userDoc.role || 'OPERATOR').toUpperCase(),
    });
  } catch (err) {
    console.error('Login router error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication.'
    });
  }
});

// 2. POST /api/auth/seed
router.post('/seed', async (req, res) => {
  await seedAllData();
  return res.json({
    status: 'success',
    message: 'Default admin (admin@geo.com / password123) and operator credentials seeded successfully.'
  });
});

// 3. GET /api/auth/credentials-hint
router.get('/credentials-hint', (req, res) => {
  return res.json({
    admin: {
      email: 'admin@geo.com',
      username: 'admin@geo.com',
      password: 'password123',
      role: 'admin',
      name: 'Directorate General (DGMS Admin)'
    },
    operator: {
      email: 'operator@geosentinel.gov.in',
      username: 'operator@geosentinel.gov.in',
      password: 'password123',
      role: 'operator',
      name: 'S. K. Verma (Chief Mining Safety Engineer)'
    }
  });
});

// 4. GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    status: 'success',
    user: req.user
  });
});

module.exports = router;
