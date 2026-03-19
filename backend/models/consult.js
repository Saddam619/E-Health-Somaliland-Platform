const knex = require('knex')(require('../db/knexfile').development);

module.exports = {
  // Create a new consultation
  create: c => knex('consultations').insert(c),

  // Find consultations for a specific patient
  findByUserId: user_id =>
    knex('consultations')
      .where({ user_id })
      .orderBy('id', 'desc'),

  // All pending consultations (for doctors)
  findPending: () =>
    knex('consultations')
      .where({ status: 'pending' })
      .orderBy('created_at', 'asc'),

  // Pending consultations with patient info (doctor dashboard)
  findPendingWithPatient: () =>
    knex('consultations as c')
      .leftJoin('users as u', 'u.id', 'c.user_id')
      .where('c.status', 'pending')
      .select(
        'c.id',
        'c.user_id',
        'c.name',
        'c.age',
        'c.phone',
        'c.location',
        'c.address',
        'c.symptoms',
        'c.explanation',
        'c.status',
        'c.created_at',
        'u.email as patient_email',
        'u.phone as patient_account_phone'
      )
      .orderBy('c.created_at', 'asc'),

  // Update status for a consultation
  updateStatus: (id, status) =>
    knex('consultations')
      .where({ id })
      .update({ status }),

  // Attach service/prescription metadata
  markServed: (id, doctorId, status = 'served') =>
    knex('consultations')
      .where({ id })
      .update({ status, served_by_doctor_id: doctorId }),

  markPrescribed: (id, doctorId, prescriptionId, status = 'prescribed') =>
    knex('consultations')
      .where({ id })
      .update({
        status,
        served_by_doctor_id: doctorId,
        prescription_id: prescriptionId
      }),

  findById: id => knex('consultations').where({ id }).first(),

  // Count consultations (for admin reports)
  count: () =>
    knex('consultations')
      .count('id as count')
      .first()
      .then(r => r.count)
};