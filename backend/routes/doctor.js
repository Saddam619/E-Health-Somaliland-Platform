const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Consult = require('../models/consult');
const Hospital = require('../models/hospital');
const QRCode = require('qrcode');

const router = express.Router();

router.use(auth(['doctor']));

// GET PENDING CONSULTATIONS
router.get('/consultations', async (req, res) => {
  try {
    const consultations = await Consult.findPendingWithPatient();
    res.json(consultations || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// MARK CONSULTATION AS SERVED
router.patch('/consultations/:id/serve', async (req, res) => {
  try {
    await Consult.markServed(req.params.id, req.user.id, 'served');
    res.send({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update consultation" });
  }
});

// CREATE PRESCRIPTION
router.post('/prescribe', async (req, res) => {
  try {
    const { patientId, consultationId, medicines } = req.body;

    if (!patientId || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).send({ error: 'patientId and medicines are required' });
    }

    const patient = await Users.findById(patientId);
    const doctor = await Users.findById(req.user.id);
    const hospital = doctor?.hospital_id ? await Hospital.findById(doctor.hospital_id) : null;

    if (!patient) return res.status(404).send({ error: 'Patient not found' });

    // ✅ CREATE WITH STATUS
    const [id] = await Prescription.create({
      doctor_id: req.user.id,
      patient_id: patient.id,
      hospital_id: hospital ? hospital.id : null,
      consultation_id: consultationId || null,
      medicines: JSON.stringify(medicines),
      status: 'Prescribed',
      qr_code: ''
    });

    const qrData = {
      id: id,
      doctor_name: doctor.name,
      hospital_name: hospital ? hospital.name : 'Unknown Hospital',
      patient_name: patient.name,
      prescriptions: medicines.map(m => ({
        medicine: m.name || m.medicine,
        dosage: m.dosage,
        instructions: m.instructions
      }))
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

    await Prescription.update(id, { qr_code: qrCodeImage });

    if (consultationId) {
      await Consult.markPrescribed(consultationId, req.user.id, id, 'prescribed');
    }

    const record = await Prescription.findById(id);

    res.json({
      ...record,
      qr_code: qrCodeImage
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create prescription" });
  }
});

module.exports = router;