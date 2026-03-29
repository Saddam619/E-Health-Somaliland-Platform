const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const knex = require('knex')(require('../db/knexfile').development);

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, hospital_id } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: role.toLowerCase(),
      hospital_id: role.toLowerCase() === 'doctor' ? (hospital_id || null) : null
    });

    res.json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// LOGIN (Joins with Hospitals to get the Name)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Join users with hospitals to get the actual name (e.g., 'Manhal Hospital')
    const user = await knex('users')
      .leftJoin('hospitals', 'users.hospital_id', 'hospitals.id')
      .where('users.email', email)
      .select('users.*', 'hospitals.name as hospital_name')
      .first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, 'secret123', { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        hospital_id: user.hospital_id,
        hospital_name: user.hospital_name || 'General Hospital'
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;