const { verify } = require('./jwt');

module.exports = (roles = []) => (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send({ error: 'No token' });
  try {
    const payload = verify(auth.split(' ')[1]);
    req.user = payload;

    if (roles.length) {
      const allowed = roles.map(r => String(r).toLowerCase());
      const userRole = String(payload.role || '').toLowerCase();
      if (!allowed.includes(userRole)) {
        return res.status(403).send({ error: 'Forbidden' });
      }
    }

    next();
  } catch (e) {
    res.status(401).send({ error: 'Invalid token' });
  }
};