const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database.sqlite')
    },
    useNullAsDefault: true
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database.sqlite')
    },
    useNullAsDefault: true
  }
};