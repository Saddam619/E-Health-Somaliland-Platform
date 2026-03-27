const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Consult = require('../models/consult');
const knex = require('knex')(require('../db/knexfile').development);
const Hospital = require('../models/hospital');

const router = express.Router();

// Only doctors can access these routes
router.use(auth(['doctor']));

// ==========================================
// GET PENDING CONSULTATIONS
// ==========================================
router.get('/consultations', async (req, res) => {
  try {
    const consultations = await Consult.findPendingWithPatient();
    res.json(consultations || []);
  } catch (err) {
    console.error("ERROR fetching consultations:", err);
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// ==========================================
// MARK CONSULTATION AS SERVED
// ==========================================
router.patch('/consultations/:id/serve', async (req, res) => {
  try {
    await Consult.markServed(req.params.id, req.user.id, 'served');
    res.send({ success: true });
  } catch (err) {
    console.error("ERROR marking served:", err);
    res.status(500).json({ error: "Failed to update consultation" });
  }
});

// ==========================================
// CREATE PRESCRIPTION WITH ENHANCED QR DATA
// ==========================================
router.post('/prescribe', async (req, res) => {
  try {
    const { patientId, consultationId, medicines } = req.body;

    // 1. Validation
    if (!patientId || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).send({ error: 'patientId and medicines are required' });
    }

    // 2. Verify Patient
    const patient = await Users.findById(patientId);
    if (!patient || String(patient.role).toLowerCase() !== 'patient') {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // 3. Verify Consultation (if provided)
    let consultation = null;
    if (consultationId) {
      consultation = await Consult.findById(consultationId);
      if (!consultation || String(consultation.user_id) !== String(patientId)) {
        return res.status(400).send({ error: 'Invalid consultationId for this patient' });
      }
    }

    // 4. Get Doctor and Hospital Info
    const doctor = await Users.findById(req.user.id);
    const hospitalId = doctor && doctor.hospital_id ? doctor.hospital_id : null;
    const hospital = hospitalId ? await Hospital.findById(hospitalId) : null;

    // 5. Create Initial Prescription Record
    const [id] = await Prescription.create({
      doctor_id: req.user.id,
      patient_id: patient.id,
      hospital_id: hospitalId,
      consultation_id: consultation ? consultation.id : null,
      medicines: JSON.stringify(medicines),
      qr_code: '' // Placeholder until we generate data below
    });

    // 6. Generate Enhanced QR Data (For Pharmacist Verification)
    const qrData = {
      type: "OFFICIAL_PRESCRIPTION",
      prescription_id: id,
      date: new Date().toISOString(),
      patient: {
        name: patient.name,
        id: patient.id
      },
      doctor: {
        name: doctor.name,
        phone: doctor.phone || 'No phone provided',
        email: doctor.email || 'No email provided'
      },
      hospital: {
        name: hospital ? hospital.name : 'Independent Practice',
        address: hospital ? hospital.address : 'N/A'
      },
      medicines: medicines
    };

    // 7. Update Record with the QR String
    const qrCodeString = JSON.stringify(qrData);
    await knex('prescriptions').where({ id }).update({ qr_code: qrCodeString });

    // 8. Update Consultation status
    if (consultation) {
      await Consult.markPrescribed(consultation.id, req.user.id, id, 'prescribed');
    }

    // 9. Return result to frontend
    const record = await Prescription.findById(id);
    res.json({
      ...record,
      hospital_name: hospital ? hospital.name : null,
      qr_code: qrCodeString // Explicitly sending the string back
    });

  } catch (err) {
    console.error("CRITICAL ERROR during prescription creation:", err);
    res.status(500).json({ error: "Failed to create prescription" });
  }
});

module.exports = router;