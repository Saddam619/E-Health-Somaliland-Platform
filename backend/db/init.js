const knex = require('knex')(require('./knexfile').development);

async function migrate() {
  // Drop and recreate tables for simplicity in dev
  const tables = ['users', 'consultations', 'emergencies', 'prescriptions', 'hospitals', 'pharmacies'];
  for (const table of tables.reverse()) {
    const exists = await knex.schema.hasTable(table);
    if (exists) {
      await knex.schema.dropTable(table);
    }
  }

  await knex.schema.createTable('users', tbl => {
    tbl.increments('id');
    tbl.string('name');
    tbl.string('email').unique().notNullable();
    tbl.string('phone');
    tbl.string('password').notNullable();
    tbl.string('role').notNullable();
    tbl.integer('hospital_id').nullable();
    tbl.json('profile').defaultTo('{}');
    tbl.timestamp('created_at').defaultTo(knex.fn.now());
    tbl.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('consultations', tbl => {
    tbl.increments('id');
    tbl.integer('user_id').references('id').inTable('users');
    tbl.string('name');
    tbl.integer('age');
    tbl.string('phone');
    tbl.string('location');
    tbl.string('address');
    tbl.text('symptoms');
    tbl.text('explanation');
    tbl.integer('served_by_doctor_id').nullable().references('id').inTable('users');
    tbl.integer('prescription_id').nullable().references('id').inTable('prescriptions');
    tbl.timestamp('created_at').defaultTo(knex.fn.now());
    tbl.string('status').defaultTo('pending');
  });

  // --- FIXED EMERGENCIES TABLE ---
  await knex.schema.createTable('emergencies', tbl => {
    tbl.increments('id');
    tbl.integer('user_id').references('id').inTable('users');
    tbl.string('name');
    tbl.integer('age');
    tbl.string('phone'); // <--- ADDED THIS MISSING COLUMN
    tbl.string('location');
    tbl.string('address');
    tbl.string('emergency_type'); // Matches routes/patient.js
    tbl.text('description');
    tbl.string('nearest_hospital');
    tbl.timestamp('created_at').defaultTo(knex.fn.now());
    tbl.string('status').defaultTo('requested');
  });

  await knex.schema.createTable('prescriptions', tbl => {
    tbl.increments('id');
    tbl.integer('doctor_id').references('id').inTable('users');
    tbl.integer('patient_id').references('id').inTable('users');
    tbl.integer('hospital_id').nullable().references('id').inTable('hospitals');
    tbl.integer('consultation_id').nullable().references('id').inTable('consultations');
    tbl.json('medicines');
    tbl.string('qr_code');
    tbl.string('status').defaultTo('Prescribed');
    tbl.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('hospitals', tbl => {
    tbl.increments('id');
    tbl.string('name').notNullable();
    tbl.string('location').notNullable();
    tbl.string('ambulance_contact').defaultTo('');
    tbl.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('pharmacies', tbl => {
    tbl.increments('id');
    tbl.string('name').notNullable();
    tbl.string('location').notNullable();
    tbl.boolean('is_licensed').defaultTo(true);
    tbl.timestamp('created_at').defaultTo(knex.fn.now());
  });

  console.log('Migrations complete');

  const bcrypt = require('bcryptjs');
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password', saltRounds);

  // Note: Using lowercase roles (patient, doctor, etc) to match auth middleware
  await knex('users').insert([
    { name: 'Patient One', email: 'patient@example.com', phone: '1234567890', password: hashedPassword, role: 'patient' },
    { name: 'Doctor One', email: 'doctor@example.com', password: hashedPassword, role: 'doctor', hospital_id: 1 },
    { name: 'Pharmacist One', email: 'pharmacist@example.com', password: hashedPassword, role: 'pharmacist' },
    { name: 'Admin One', email: 'admin@example.com', password: hashedPassword, role: 'admin' },
  ]);

  await knex('hospitals').insert([
    { name: 'Hargeisa General Hospital', location: '9.5624,44.0770', ambulance_contact: '+252-63-0000001' },
    { name: 'Berbera Hospital', location: '10.4396,45.0143', ambulance_contact: '+252-63-0000002' }
  ]);

  await knex('pharmacies').insert([
    { name: 'Central Pharmacy', location: '9.5624,44.0770', is_licensed: true },
    { name: 'Downtown Pharmacy', location: '9.5600,44.0800', is_licensed: true }
  ]);

  console.log('Sample data inserted');
}

module.exports = migrate;