const express = require('express');
const auth = require('../utils/authMiddleware');
const Consult = require('../models/consult');
const Emergency = require('../models/emergency');
const Users = require('../models/user');
const Pharmacy = require('../models/pharmacy');
const Prescription = require('../models/prescription');
const Hospital = require('../models/hospital');
const { sendSMS } = require('../utils/notifications');
const router = express.Router();

// patient-only middleware
router.use(auth(['patient']));

// Submit a consultation request
router.post('/consult', async (req, res) => {
  try {
    const { name, age, phone, location, address, symptoms, explanation } = req.body;
    if (!name || !age || !phone || !location || !address || !symptoms) {
      return res.status(400).send({ error: 'All fields required' });
    }

    await Consult.create({
      user_id: req.user.id,
      name,
      age,
      phone,
      location,
      address,
      symptoms,
      explanation,
      status: 'pending'
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to create consultation' });
  }
});

// Get all consultations for logged-in patient
router.get('/consultations', async (req, res) => {
  try {
    const consultations = await Consult.findByUserId(req.user.id);
    res.json(consultations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// Submit emergency request
router.post('/emergency', async (req, res) => {
  try {
    const { name, age, location, address, emergencyType, description } = req.body;
    if (!name || !age || !location || !address || !emergencyType || !description) {
      return res.status(400).send({ error: 'All fields required' });
    }

    const hospitals = await Hospital.all();
    let nearest = null;
    let minDist = Infinity;

    const [lat, lon] = location.split(',').map(c => parseFloat(c.trim()));
    if (!isNaN(lat) && !isNaN(lon)) {
      hospitals.forEach(h => {
        const [hLat, hLon] = (h.location || '').split(',').map(c => parseFloat(c.trim()));
        if (isNaN(hLat) || isNaN(hLon)) return;
        const d = Math.sqrt((hLat - lat) ** 2 + (hLon - lon) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = h;
        }
      });
    }

    const nearestHospital = nearest || hospitals[0] || null;

    await Emergency.create({
      user_id: req.user.id,
      name,
      age,
      location,
      address,
      emergency_type: emergencyType,
      description,
      nearest_hospital: nearestHospital ? nearestHospital.name : null,
      status: 'requested'
    });

    const user = await Users.findById(req.user.id);
    if (user.phone && nearestHospital) {
      const message = `Emergency request sent: ${emergencyType} at ${location}. Nearest hospital: ${nearestHospital.name}. Ambulance: ${nearestHospital.ambulance_contact || 'N/A'}`;
      sendSMS(user.phone, message);
    }

    res.send({
      success: true,
      nearestHospital: nearestHospital
        ? { name: nearestHospital.name, location: nearestHospital.location, ambulance_contact: nearestHospital.ambulance_contact || '' }
        : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to create emergency request' });
  }
});

// List licensed pharmacies
router.get('/pharmacies', async (req, res) => {
  try {
    const pharmacies = await Pharmacy.licensed();
    res.json(pharmacies);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch pharmacies' });
  }
});

// Get prescriptions for patient
router.get('/prescriptions', async (req, res) => {
  try {
    const prescriptions = await Prescription.findByUserId(req.user.id);
    res.json(prescriptions);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch prescriptions' });
  }
});

module.exports = router;