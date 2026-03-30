const express = require('express');
const cors = require('cors');

// ✅ ENVIRONMENT FIX
const environment = process.env.NODE_ENV || 'development';
const config = require('./db/knexfile')[environment];
const knex = require('knex')(config);

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const pharmacistRoutes = require('./routes/pharmacist');
const adminRoutes = require('./routes/admin');

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ ROOT ROUTE (VERY IMPORTANT FOR RENDER)
app.get('/', (req, res) => {
    res.send('E-Health Backend Running ✅');
});

// ✅ Hospitals API
app.get('/api/hospitals', async (req, res) => {
    try {
        const hospitals = await knex('hospitals').select('id', 'name');
        res.json(hospitals);
    } catch (err) {
        console.error("Fetch Hospitals Error:", err);
        res.status(500).json({ error: "Failed to fetch hospitals" });
    }
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/pharmacists', pharmacistRoutes);
app.use('/api/admins', adminRoutes);

global.knex = knex;

// ✅ Seed hospitals
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

// ✅ PORT FIX
const PORT = process.env.PORT || 5000;

require('./db/init')().then(async () => {
    await seedHospitals();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('❌ DB init error:', err);
});