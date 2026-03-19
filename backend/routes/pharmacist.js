const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Hospital = require('../models/hospital');
const router = express.Router();

router.use(auth(['pharmacist']));

router.get('/prescriptions', async (req, res) => {
  const prescriptions = await Prescription.all();
  res.send(prescriptions.filter(p => p.status === 'Prescribed'));
});

router.post('/verify', async (req, res) => {
  const { id, qr_code } = req.body;
  let rxId = id;
  if (!rxId && qr_code) {
    try {
      const parsed = JSON.parse(qr_code);
      rxId = parsed.id;
    } catch (e) {
      return res.status(400).send({ error: 'Invalid qr_code payload' });
    }
  }

  if (!rxId) return res.status(400).send({ error: 'id or qr_code is required' });

  const p = await Prescription.findById(rxId);
  if (!p) return res.status(404).send({ error: 'Not found' });

  await Prescription.updateStatus(rxId, 'Verified');

  const doctor = p.doctor_id ? await Users.findById(p.doctor_id) : null;
  const hospital = p.hospital_id ? await Hospital.findById(p.hospital_id) : null;

  res.json({
    valid: true,
    prescription: {
      ...p,
      status: 'Verified',
      doctor_name: doctor ? doctor.name : null,
      hospital_name: hospital ? hospital.name : null
    }
  });
});

module.exports = router;