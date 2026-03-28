const knex = require('knex')(require('../db/knexfile').development);

module.exports = {
  // Added a slight delay/check to ensure data is handled correctly
  create: async (e) => {
    try {
      return await knex('emergencies').insert(e);
    } catch (error) {
      console.error("❌ DATABASE INSERT ERROR:", error.message);
      throw error; // This will be caught by the 500 error block in your route
    }
  },
  
  findById: id => knex('emergencies').where({ id }).first(),
  
  all: () => knex('emergencies').select('*').orderBy('created_at', 'desc'),
  
  updateStatus: (id, status) => knex('emergencies').where({ id }).update({ status }),
  
  count: () => knex('emergencies').count('id as count').first().then(r => r.count)
};