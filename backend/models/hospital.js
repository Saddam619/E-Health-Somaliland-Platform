const knex = require('knex')(require('../db/knexfile').development);

module.exports = {
  create: h => knex('hospitals').insert(h),
  findById: id => knex('hospitals').where({ id }).first(),
  all: () => knex('hospitals').select('*'),
  update: (id, data) => knex('hospitals').where({ id }).update(data),
  delete: id => knex('hospitals').where({ id }).del()
};