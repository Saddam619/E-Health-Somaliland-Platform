const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Consult = require('../models/consult');
const knex = require('knex')(require('../db/knexfile').development);
const Hospital = require('../models/hospital');
const router = express.Router();

router.use(auth(['doctor']));

router.get('/consultations', async (req, res) => {
  const consultations = await Consult.findPendingWithPatient();
  res.json(consultations);
});

router.patch('/consultations/:id/serve', async (req, res) => {
  await Consult.markServed(req.params.id, req.user.id, 'served');
  res.send({ success: true });
});

router.post('/prescribe', async (req, res) => {
  const { patientId, consultationId, medicines } = req.body; // medicines is array
  if (!patientId || !Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).send({ error: 'patientId and medicines are required' });
  }

  const patient = await Users.findById(patientId);
  const patientRole = patient && String(patient.role || '').toLowerCase();
  if (!patient || patientRole !== 'patient') {
    return res.status(404).send({ error: 'Patient not found' });
  }

  let consultation = null;
  if (consultationId) {
    consultation = await Consult.findById(consultationId);
    if (!consultation || String(consultation.user_id) !== String(patientId)) {
      return res.status(400).send({ error: 'Invalid consultationId for patient' });
    }
  }

  // Determine doctor hospital
  const doctor = await Users.findById(req.user.id);
  const hospitalId = doctor && doctor.hospital_id ? doctor.hospital_id : null;
  const hospital = hospitalId ? await Hospital.findById(hospitalId) : null;

  const [id] = await Prescription.create({
    doctor_id: req.user.id,
    patient_id: patient.id,
    hospital_id: hospitalId,
    consultation_id: consultation ? consultation.id : null,
    medicines: JSON.stringify(medicines),
    qr_code: '' // Placeholder
  });

  const qrCode = JSON.stringify({
    id,
    patient_id: patient.id,
    doctor_id: req.user.id,
    hospital_id: hospitalId,
    medicines
  });
  await knex('prescriptions').where({ id }).update({ qr_code: qrCode });

  if (consultation) {
    await Consult.markPrescribed(consultation.id, req.user.id, id, 'prescribed');
  }

  const record = await Prescription.findById(id);
  res.json({
    ...record,
    hospital_name: hospital ? hospital.name : null
  });
});

module.exports = router;