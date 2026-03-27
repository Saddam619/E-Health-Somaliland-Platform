const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ======================
// REGISTER
// ======================
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required (name, email, password, role)." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role
    });

    res.json({
      message: "User registered successfully",
      user
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});


// ======================
// LOGIN (EMAIL ONLY)
// ======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Require email + password
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // ✅ CREATE TOKEN
    const token = jwt.sign(
      { id: user.id, role: user.role },
      'secret123',
      { expiresIn: '7d' }
    );

    // ✅ SEND TOKEN + USER
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;