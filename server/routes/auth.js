const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, ready } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register new doctor/user
router.post('/register', async (req, res) => {
  try {
    await ready;
    const { username, email, password, doctor_name, hospital_name, designation, signature_title } = req.body;

    if (!username || !email || !password || !doctor_name) {
      return res.status(400).json({ error: 'Username, email, password, and doctor name are required' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = await db.run(`
      INSERT INTO users (username, email, password_hash, doctor_name, hospital_name, designation, signature_title)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      username.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      doctor_name.trim(),
      hospital_name ? hospital_name.trim() : 'General Hospital',
      designation ? designation.trim() : 'Medical Officer',
      signature_title ? signature_title.trim().toUpperCase() : doctor_name.trim().toUpperCase()
    ]);

    const newUser = await db.get('SELECT id, username, email, doctor_name, hospital_name, designation, signature_title FROM users WHERE id = ?', [result.lastID]);

    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      user: newUser,
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    await ready;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username.trim(), username.trim().toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      doctor_name: user.doctor_name,
      hospital_name: user.hospital_name,
      designation: user.designation,
      signature_title: user.signature_title
    };

    const token = jwt.sign(userProfile, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      user: userProfile,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get current profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    await ready;
    const user = await db.get(
      'SELECT id, username, email, doctor_name, hospital_name, designation, signature_title, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
