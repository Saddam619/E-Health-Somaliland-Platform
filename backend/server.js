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

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/pharmacists', pharmacistRoutes);
app.use('/api/admins', adminRoutes);

// Make knex available globally or in routes
global.knex = knex;

require('./db/init')().then(() => {
    app.listen(5000, () => console.log('Server running on http://localhost:5000'));
}).catch(err => console.error('DB init error:', err));