const express = require('express');
const auth = require('../utils/authMiddleware');
const Prescription = require('../models/prescription');
const Users = require('../models/user');
const Hospital = require('../models/hospital');

const router = express.Router();

router.use(auth(['pharmacist']));

// GET ALL UNVERIFIED PRESCRIPTIONS
router.get('/prescriptions', async (req, res) => {
    try {
        const prescriptions = await Prescription.all();
        res.json(prescriptions.filter(p => p.status !== 'Verified'));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// VERIFY PRESCRIPTION
router.post('/verify', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ valid: false, error: 'Prescription ID is required' });
    }

    try {
        const p = await Prescription.findById(id);

        if (!p) {
            return res.status(404).json({ valid: false, error: 'Prescription not found' });
        }

        if (p.status === 'Verified') {
            return res.json({ valid: false, error: 'Already verified' });
        }

        await Prescription.updateStatus(id, 'Verified');

        const doctor = p.doctor_id ? await Users.findById(p.doctor_id) : null;
        const hospital = p.hospital_id ? await Hospital.findById(p.hospital_id) : null;

        res.json({
            valid: true,
            message: "✅ Prescription verified successfully!",
            prescription: {
                ...p,
                status: 'Verified',
                doctor_name: doctor ? doctor.name : null,
                hospital_name: hospital ? hospital.name : null
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ valid: false, error: "Server error during verification" });
    }
});

module.exports = router;