const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'secret123';

module.exports = {
  sign: payload => jwt.sign(payload, SECRET, { expiresIn: '8h' }),
  verify: token => jwt.verify(token, SECRET)
};