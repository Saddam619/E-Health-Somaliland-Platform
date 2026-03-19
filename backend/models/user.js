const knex = require('knex')(require('../db/knexfile').development);

module.exports = {

  // Create user
  create: async (user) => {
    const [id] = await knex('users').insert(user);
    return knex('users').where({ id }).first();
  },

  // Find by email
  findByEmail: async (email) => {
    if (!email) return null;
    return knex('users').where({ email }).first();
  },

  // Find by phone
  findByPhone: async (phone) => {
    if (!phone) return null;
    return knex('users').where({ phone }).first();
  },

  // Find by ID
  findById: async (id) => {
    return knex('users').where({ id }).first();
  },

  // Update profile
  updateProfile: async (id, profile) => {
    return knex('users').where({ id }).update({ profile });
  },

  // Update role
  updateRole: async (id, role) => {
    return knex('users').where({ id }).update({ role });
  },

  // Delete user
  delete: async (id) => {
    return knex('users').where({ id }).del();
  },

  // Get all users
  all: async () => {
    return knex('users').select('*');
  },

  // Count users
  count: async () => {
    const result = await knex('users').count('id as count').first();
    return result.count;
  }

};