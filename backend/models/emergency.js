const knex = require('knex')(require('../db/knexfile').development);

module.exports = {
  create: e => knex('emergencies').insert(e),
  findById: id => knex('emergencies').where({ id }).first(),
  all: () => knex('emergencies').select('*'),
  updateStatus: (id, status) => knex('emergencies').where({ id }).update({ status }),
  count: () => knex('emergencies').count('id as count').first().then(r => r.count)
};