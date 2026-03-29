const knex = require('knex')(require('../db/knexfile').development);

module.exports = {
  // Insert the prescription and return the new ID
  create: p => knex('prescriptions').insert(p),
  
  // Find a specific prescription by its ID
  findById: id => knex('prescriptions').where({ id }).first(),
  
  // Get all prescriptions for a specific patient
  findByUserId: userId => knex('prescriptions').where({ patient_id: userId }),
  
  // List every prescription in the system
  all: () => knex('prescriptions').select('*'),
  
  // Update only the status (e.g., 'pending' to 'verified')
  updateStatus: (id, status) => knex('prescriptions').where({ id }).update({ status }),
  
  // ✅ NEW: Update any field (used for saving the QR code image after creation)
  update: (id, data) => knex('prescriptions').where({ id }).update(data),
  
  // Count total prescriptions for dashboard stats
  count: () => knex('prescriptions').count('id as count').first().then(r => r.count)
};