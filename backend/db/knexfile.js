module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/database.sqlite'
    },
    useNullAsDefault: true
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './db/database.sqlite'
    },
    useNullAsDefault: true
  }
};