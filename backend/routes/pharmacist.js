const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Hospital = require('../models/hospital');
const router = express.Router();

router.use(auth(['pharmacist']));

// ✅ GET /api/pharmacists/prescriptions
router.get('/prescriptions', async (req, res) => {
    try {
        const prescriptions = await Prescription.all();
        // Only return those not yet verified
        res.send(prescriptions.filter(p => p.status === 'Prescribed'));
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// ✅ POST /api/pharmacists/verify
router.post('/verify', async (req, res) => {
    const { id, qr_code } = req.body;
    let rxId = id;

    // Handle scanned QR data if passed as a string
    if (!rxId && qr_code) {
        try {
            const parsed = typeof qr_code === 'string' ? JSON.parse(qr_code) : qr_code;
            rxId = parsed.id;
        } catch (e) {
            return res.status(400).send({ error: 'Invalid qr_code payload' });
        }
    }

    if (!rxId) return res.status(400).send({ error: 'Prescription ID is required' });

    try {
        const p = await Prescription.findById(rxId);
        
        if (!p) {
            return res.status(404).send({ error: 'Prescription not found in database.' });
        }

        if (p.status === 'Verified') {
            return res.status(400).send({ error: 'This prescription has already been verified and issued.' });
        }

        // ✅ Update status to 'Verified'
        await Prescription.updateStatus(rxId, 'Verified');

        const doctor = p.doctor_id ? await Users.findById(p.doctor_id) : null;
        const hospital = p.hospital_id ? await Hospital.findById(p.hospital_id) : null;

        res.json({
            valid: true,
            message: "Successfully verified",
            prescription: {
                ...p,
                status: 'Verified',
                doctor_name: doctor ? doctor.name : null,
                hospital_name: hospital ? hospital.name : null
            }
        });
    } catch (err) {
        console.error("Verification DB Error:", err);
        res.status(500).send({ error: "Internal server error during verification" });
    }
});

module.exports = router;