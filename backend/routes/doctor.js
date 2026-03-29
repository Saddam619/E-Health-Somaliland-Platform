const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Consult = require('../models/consult');
const Hospital = require('../models/hospital');
const QRCode = require('qrcode');

const router = express.Router();

// Only doctors can access these routes
router.use(auth(['doctor']));

// GET PENDING CONSULTATIONS
router.get('/consultations', async (req, res) => {
  try {
    const consultations = await Consult.findPendingWithPatient();
    res.json(consultations || []);
  } catch (err) {
    console.error("ERROR fetching consultations:", err);
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// MARK CONSULTATION AS SERVED
router.patch('/consultations/:id/serve', async (req, res) => {
  try {
    await Consult.markServed(req.params.id, req.user.id, 'served');
    res.send({ success: true });
  } catch (err) {
    console.error("ERROR marking served:", err);
    res.status(500).json({ error: "Failed to update consultation" });
  }
});

// CREATE PRESCRIPTION (RESTORED PROFESSIONAL FORMAT)
router.post('/prescribe', async (req, res) => {
  try {
    const { patientId, consultationId, medicines } = req.body;

    // 1. Validation
    if (!patientId || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).send({ error: 'patientId and medicines are required' });
    }

    // 2. Fetch involved parties
    const patient = await Users.findById(patientId);
    const doctor = await Users.findById(req.user.id);
    const hospital = doctor?.hospital_id ? await Hospital.findById(doctor.hospital_id) : null;

    if (!patient) return res.status(404).send({ error: 'Patient not found' });

    // 3. STEP ONE: Create the Database record first to get the real ID
    const [id] = await Prescription.create({
      doctor_id: req.user.id,
      patient_id: patient.id,
      hospital_id: hospital ? hospital.id : null,
      consultation_id: consultationId || null,
      medicines: JSON.stringify(medicines),
      qr_code: '' // Leave empty for a moment
    });

    // 4. STEP TWO: Prepare the QR Data (Restores your professional view)
    const qrData = {
      id: id, // ✅ Added ID so pharmacist can verify
      doctor_name: doctor.name,
      doctor_phone: doctor.phone || 'N/A',
      doctor_email: doctor.email || 'N/A',
      hospital_name: hospital ? hospital.name : 'Unknown Hospital',
      patient_name: patient.name || 'N/A',
      date: new Date().toLocaleString(),
      prescriptions: medicines.map(m => ({
        medicine: m.name || m.medicine,
        dosage: m.dosage,
        instructions: m.instructions
      }))
    };

    // 5. STEP THREE: Generate the QR Image from the full data object
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

    // 6. STEP FOUR: Update the record with the generated image
    await Prescription.update(id, { qr_code: qrCodeImage });

    // 7. Update Consultation if it exists
    if (consultationId) {
      await Consult.markPrescribed(consultationId, req.user.id, id, 'prescribed');
    }

    // 8. Return the final record to the frontend
    const record = await Prescription.findById(id);
    res.json({
      ...record,
      hospital_name: hospital ? hospital.name : 'Unknown Hospital',
      qr_code: qrCodeImage 
    });

  } catch (err) {
    console.error("CRITICAL ERROR:", err);
    res.status(500).json({ error: "Failed to create prescription" });
  }
});

module.exports = router;