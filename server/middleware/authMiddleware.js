import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { findUserById, findUserByEmail } from '../db.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session token invalid or expired. Please sign in again.' });
    }

    // Verify user still exists in database and fetch fresh record
    const dbUser = decoded.id ? findUserById(decoded.id) : findUserByEmail(decoded.email);

    if (!dbUser) {
      return res.status(401).json({ error: 'User account not found. Please authenticate again.' });
    }

    req.user = dbUser;
    next();
  });
}
