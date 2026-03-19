const knex = require('knex')(require('../db/knexfile').development);

module.exports = {
  create: p => knex('prescriptions').insert(p),
  findById: id => knex('prescriptions').where({ id }).first(),
  findByUserId: userId => knex('prescriptions').where({ patient_id: userId }),
  all: () => knex('prescriptions').select('*'),
  updateStatus: (id, status) => knex('prescriptions').where({ id }).update({ status }),
  count: () => knex('prescriptions').count('id as count').first().then(r => r.count)
};