const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Consult = require('../models/consult');
const Hospital = require('../models/hospital');
const QRCode = require('qrcode'); // ✅ IMPORTANT

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
// CREATE PRESCRIPTION WITH REAL QR CODE
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

    // 3. Verify Consultation
    let consultation = null;
    if (consultationId) {
      consultation = await Consult.findById(consultationId);
      if (!consultation || String(consultation.user_id) !== String(patientId)) {
        return res.status(400).send({ error: 'Invalid consultationId' });
      }
    }

    // 4. Get Doctor & Hospital
    const doctor = await Users.findById(req.user.id);
    const hospital = doctor?.hospital_id
      ? await Hospital.findById(doctor.hospital_id)
      : null;

    // ==========================================
    // 🔥 CREATE QR DATA (WHAT SCAN WILL SHOW)
    // ==========================================
    const qrData = {
      doctor_name: doctor.name,
      doctor_phone: doctor.phone || 'N/A',
      doctor_email: doctor.email || 'N/A',
      hospital_name: hospital ? hospital.name : 'Unknown Hospital'
    };

    // ==========================================
    // 🔥 GENERATE REAL QR IMAGE (BASE64)
    // ==========================================
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

    // ==========================================
    // SAVE PRESCRIPTION (WITH QR IMAGE)
    // ==========================================
    const [id] = await Prescription.create({
      doctor_id: req.user.id,
      patient_id: patient.id,
      hospital_id: hospital ? hospital.id : null,
      consultation_id: consultation ? consultation.id : null,
      medicines: JSON.stringify(medicines),
      qr_code: qrCodeImage // ✅ REAL QR IMAGE
    });

    // ==========================================
    // UPDATE CONSULTATION STATUS
    // ==========================================
    if (consultation) {
      await Consult.markPrescribed(consultation.id, req.user.id, id, 'prescribed');
    }

    // ==========================================
    // RETURN DATA
    // ==========================================
    const record = await Prescription.findById(id);

    res.json({
      ...record,
      hospital_name: hospital ? hospital.name : null,
      qr_code: qrCodeImage // ✅ send image
    });

  } catch (err) {
    console.error("CRITICAL ERROR:", err);
    res.status(500).json({ error: "Failed to create prescription" });
  }
});

module.exports = router;