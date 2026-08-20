const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let pool;

// Check if PostgreSQL is explicitly forced or if we should use SQLite directly
const isSqlite = process.env.DB_TYPE === 'sqlite' || !process.env.DB_HOST || process.env.DB_TYPE !== 'postgres';

if (!isSqlite) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'student_attendance_db',
      connectionTimeoutMillis: 2000,
    });
    console.log('Using PostgreSQL database connection');
  } catch (err) {
    console.warn('PostgreSQL pool creation failed, falling back to SQLite');
    pool = null;
  }
}

if (!pool) {
  // Use Embedded SQLite — Zero configuration needed!
  const Database = require('better-sqlite3');
  const dbDir = path.join(__dirname, '../db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'attendance.sqlite');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  console.log(`\n======================================================`);
  console.log(`📦 Running in ZERO-CONFIG Embedded Database mode (SQLite)`);
  console.log(`📁 Database saved at: ${dbPath}`);
  console.log(`======================================================\n`);

  // Initialize SQLite Tables automatically
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      course TEXT NOT NULL,
      semester INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_code TEXT NOT NULL UNIQUE,
      subject_name TEXT NOT NULL,
      semester INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
      marked_by INTEGER NOT NULL REFERENCES admins(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (student_id, subject_id, date)
    );
  `);

  // Seed default admin if table is empty
  const adminCount = sqlite.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (adminCount.count === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    sqlite.prepare('INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)').run(
      'admin',
      'admin@school.com',
      passwordHash
    );
    console.log('✅ Default admin seeded: admin / admin123');

    // Seed initial students
    const insertStudent = sqlite.prepare('INSERT OR IGNORE INTO students (student_id, name, email, course, semester) VALUES (?, ?, ?, ?, ?)');
    const students = [
      ['STU001', 'Aman Sharma', 'aman@school.com', 'Computer Science', 4],
      ['STU002', 'Priya Patel', 'priya@school.com', 'Computer Science', 4],
      ['STU003', 'Rahul Kumar', 'rahul@school.com', 'Electronics', 3],
      ['STU004', 'Sneha Gupta', 'sneha@school.com', 'Mechanical', 5],
      ['STU005', 'Vikram Singh', 'vikram@school.com', 'Computer Science', 4],
      ['STU006', 'Anjali Verma', 'anjali@school.com', 'Electronics', 3],
      ['STU007', 'Karan Mehta', 'karan@school.com', 'Civil', 6],
      ['STU008', 'Neha Joshi', 'neha@school.com', 'Computer Science', 4],
      ['STU009', 'Arjun Reddy', 'arjun@school.com', 'Mechanical', 5],
      ['STU010', 'Divya Nair', 'divya@school.com', 'Electronics', 3],
    ];
    for (const s of students) {
      insertStudent.run(...s);
    }

    // Seed initial subjects
    const insertSubject = sqlite.prepare('INSERT OR IGNORE INTO subjects (subject_code, subject_name, semester) VALUES (?, ?, ?)');
    const subjects = [
      ['CS401', 'Data Structures', 4],
      ['CS402', 'Operating Systems', 4],
      ['CS403', 'Database Management', 4],
      ['EC301', 'Digital Electronics', 3],
      ['EC302', 'Signal Processing', 3],
      ['ME501', 'Thermodynamics', 5],
      ['CE601', 'Structural Analysis', 6],
    ];
    for (const sub of subjects) {
      insertSubject.run(...sub);
    }
    console.log('✅ Sample students and subjects seeded successfully');
  }

  // Universal query wrapper for SQLite matching pg Pool interface
  pool = {
    async query(text, params = []) {
      // 1. Map PostgreSQL $1, $2 to SQLite ? while expanding repeated parameter indices
      const mappedParams = [];
      let sql = text.replace(/\$(\d+)/g, (match, num) => {
        const index = parseInt(num, 10) - 1;
        mappedParams.push(params[index]);
        return '?';
      });

      // 2. Transform ILIKE to LIKE (SQLite LIKE is case-insensitive for ASCII)
      sql = sql.replace(/ILIKE/gi, 'LIKE');

      // 3. Transform PostgreSQL FILTER (WHERE condition) to SQLite CASE WHEN
      // Example: COUNT(*) FILTER (WHERE status = 'present') -> COUNT(CASE WHEN status = 'present' THEN 1 END)
      sql = sql.replace(
        /COUNT\(\*\)\s+FILTER\s*\(\s*WHERE\s+([^)]+)\)/gi,
        'COUNT(CASE WHEN $1 THEN 1 END)'
      );

      // 4. Transform ROUND((COUNT(...) ::DECIMAL / ...) * 100, 2)
      sql = sql.replace(/::DECIMAL/gi, '');

      // Check if it is a SELECT query
      const trimmed = sql.trim();
      const isSelect = /^SELECT/i.test(trimmed);

      try {
        if (isSelect) {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...mappedParams);
          return { rows, rowCount: rows.length };
        } else {
          // Handle INSERT / UPDATE / DELETE with RETURNING or without
          const hasReturning = /RETURNING\s+(.+)$/i.test(trimmed);
          let cleanSql = trimmed;

          if (hasReturning) {
            // SQLite 3.35+ supports RETURNING natively
            try {
              const stmt = sqlite.prepare(trimmed);
              const rows = stmt.all(...mappedParams);
              return { rows, rowCount: rows.length };
            } catch (err) {
              // Fallback if RETURNING clause isn't supported for that statement
              cleanSql = trimmed.replace(/RETURNING\s+.+$/i, '').trim();
            }
          }

          const stmt = sqlite.prepare(cleanSql);
          const info = stmt.run(...mappedParams);

          let rows = [];
          if (hasReturning && info.lastInsertRowid) {
            const tableMatch = cleanSql.match(/INTO\s+([a-zA-Z0-9_]+)/i) || cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
            if (tableMatch) {
              const tableName = tableMatch[1];
              const row = sqlite.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`).get(info.lastInsertRowid);
              if (row) rows = [row];
            }
          }

          return { rows, rowCount: info.changes };
        }
      } catch (err) {
        console.error('SQL Execution Error:', err.message, '\nQuery:', sql, '\nParams:', mappedParams);
        throw err;
      }
    },
    async end() {
      sqlite.close();
    },
  };
}

module.exports = pool;
