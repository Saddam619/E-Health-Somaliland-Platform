const knex = require('knex')(require('../db/knexfile').development);

module.exports = {
  create: p => knex('pharmacies').insert(p),
  findById: id => knex('pharmacies').where({ id }).first(),
  all: () => knex('pharmacies').select('*'),
  licensed: () => knex('pharmacies').where({ is_licensed: true }).select('*'),
  update: (id, data) => knex('pharmacies').where({ id }).update(data),
  delete: id => knex('pharmacies').where({ id }).del()
};