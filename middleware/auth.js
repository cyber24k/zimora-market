const jwt = require('jsonwebtoken');

module.exports = function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
};
