const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('Database schema initialized successfully!');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  } finally {
    await pool.end();
  }
}

initDb();
