const express = require('express');
const auth = require('../utils/authMiddleware');
const Users = require('../models/user');
const Emergency = require('../models/emergency');
const Consult = require('../models/consult');
const Prescription = require('../models/prescription');
const Hospital = require('../models/hospital');
const Pharmacy = require('../models/pharmacy');
const router = express.Router();

router.use(auth(['admin']));

// Get all users
router.get('/users', async (req, res) => {
  res.json(await Users.all());
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  await Users.updateRole(req.params.id, req.body.role);
  res.send({ success: true });
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  await Users.delete(req.params.id);
  res.send({ success: true });
});

// Get all emergencies
router.get('/emergencies', async (req, res) => {
  res.json(await Emergency.all());
});

// Update emergency status (Dispatching)
router.patch('/emergencies/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await Emergency.updateStatus(req.params.id, status);
    res.send({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Hospital & Pharmacy Management
router.get('/hospitals', async (req, res) => res.json(await Hospital.all()));
router.post('/hospitals', async (req, res) => { const [id] = await Hospital.create(req.body); res.json({ id }); });
router.put('/hospitals/:id', async (req, res) => { await Hospital.update(req.params.id, req.body); res.send({ success: true }); });
router.delete('/hospitals/:id', async (req, res) => { await Hospital.delete(req.params.id); res.send({ success: true }); });

router.get('/pharmacies', async (req, res) => res.json(await Pharmacy.all()));
router.post('/pharmacies', async (req, res) => { const [id] = await Pharmacy.create(req.body); res.json({ id }); });
router.put('/pharmacies/:id', async (req, res) => { await Pharmacy.update(req.params.id, req.body); res.send({ success: true }); });
router.delete('/pharmacies/:id', async (req, res) => { await Pharmacy.delete(req.params.id); res.send({ success: true }); });

// FIXED REPORTS ROUTE
router.get('/reports', async (req, res) => {
  try {
    // Get counts
    const consultsCount = await Consult.count();
    const emergenciesCount = await Emergency.count();
    const prescriptionsCount = await Prescription.count();
    
    // Get full list of emergencies to serve/manage
    const emergencyList = await Emergency.all();

    res.json({ 
      counts: {
        consults: consultsCount || 0, 
        emergencies: emergenciesCount || 0, 
        prescriptions: prescriptionsCount || 0 
      },
      emergencies: emergencyList || []
    });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ error: "Failed to load reports" });
  }
});

module.exports = router;