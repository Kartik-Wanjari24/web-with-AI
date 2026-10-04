import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists inside server/data
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'adaptiveshield.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    role TEXT NOT NULL DEFAULT 'SecOps Analyst',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    login_count INTEGER DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

/**
 * Find user by email
 */
export function findUserByEmail(email) {
  const stmt = db.prepare('SELECT id, email, role, created_at, last_login_at, login_count FROM users WHERE email = ?');
  return stmt.get(email.trim().toLowerCase());
}

/**
 * Find user by ID
 */
export function findUserById(id) {
  const stmt = db.prepare('SELECT id, email, role, created_at, last_login_at, login_count FROM users WHERE id = ?');
  return stmt.get(id);
}

/**
 * Find or create user upon successful OTP verification.
 * - If user exists: update last_login_at and increment login_count.
 * - If user is new: insert with email, role ('SecOps Analyst'), and timestamps.
 */
export function findOrCreateUser(email, role = 'SecOps Analyst') {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = findUserByEmail(normalizedEmail);

  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1
      WHERE id = ?
    `);
    updateStmt.run(existing.id);

    return {
      isNewUser: false,
      user: findUserById(existing.id)
    };
  }

  // Create new user
  const insertStmt = db.prepare(`
    INSERT INTO users (email, role, created_at, last_login_at, login_count)
    VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
  `);
  const info = insertStmt.run(normalizedEmail, role);

  return {
    isNewUser: true,
    user: findUserById(info.lastInsertRowid)
  };
}

export default db;
