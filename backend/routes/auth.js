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

    if (!name || !password || !role) {
      return res.status(400).json({ message: "Name, password, and role are required." });
    }

    // Patients can use email OR phone
    if (role === "Patient") {
      if (!email && !phone) {
        return res.status(400).json({ message: "Patient must provide email OR phone." });
      }
    }

    // Other roles must use email
    if (role !== "Patient" && !email) {
      return res.status(400).json({ message: "Email is required for this role." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email || null,
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
// LOGIN
// ======================
router.post('/login', async (req, res) => {
  try {

    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    let user;

    if (email) {
      user = await User.findByEmail(email);
    } else if (phone) {
      user = await User.findByPhone(phone);
    } else {
      return res.status(400).json({ message: "Provide email OR phone." });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      'secret123',
      { expiresIn: '7d' }
    );

    res.json({
      message: "Login successful",
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