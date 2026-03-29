const express = require('express');
const cors = require('cors');
const knex = require('knex')(require('./db/knexfile').development);
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const pharmacistRoutes = require('./routes/pharmacist');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// ✅ ROUTE FOR REGISTRATION DROPDOWN
// ==========================================
app.get('/api/hospitals', async (req, res) => {
    try {
        const hospitals = await knex('hospitals').select('id', 'name');
        res.json(hospitals);
    } catch (err) {
        console.error("Fetch Hospitals Error:", err);
        res.status(500).json({ error: "Failed to fetch hospitals" });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/pharmacists', pharmacistRoutes);
app.use('/api/admins', adminRoutes);

global.knex = knex;

// ==========================================
// ✅ SEED HOSPITALS (Includes Required Location)
// ==========================================
async function seedHospitals() {
    const list = [
        { name: 'Hargeisa General Hospital', location: 'Hargeisa' },
        { name: 'Manhal Hospital', location: 'Hargeisa' },
        { name: 'Gargar Hospital', location: 'Hargeisa' },
        { name: 'Edna Adan Hospital', location: 'Hargeisa' }
    ];
    
    try {
        for (const h of list) {
            const exists = await knex('hospitals').where({ name: h.name }).first();
            if (!exists) {
                await knex('hospitals').insert(h);
                console.log(`✅ Hospital Inserted: ${h.name}`);
            }
        }
    } catch (err) {
        console.error("❌ Error seeding hospitals:", err.message);
    }
}

// ==========================================
// ✅ INITIALIZE DATABASE AND START SERVER
// ==========================================
require('./db/init')().then(async () => {
    await seedHospitals(); // Runs the seed function safely now
    app.listen(5000, () => {
        console.log('-----------------------------------------');
        console.log('🚀 Server running on http://localhost:5000');
        console.log('-----------------------------------------');
    });
}).catch(err => {
    console.error('❌ DB init error:', err);
});