const bcrypt = require('bcryptjs');
const path = require('path');
const pool = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  try {
    // Create default admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO admins (username, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', 'admin@school.com', hashedPassword]
    );
    console.log('Default admin created: username=admin, password=admin123');

    // Sample students
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
      await pool.query(
        `INSERT INTO students (student_id, name, email, course, semester)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id) DO NOTHING`,
        s
      );
    }
    console.log('Sample students created');

    // Sample subjects
    const subjects = [
      ['CS401', 'Data Structures', 4],
      ['CS402', 'Operating Systems', 4],
      ['CS403', 'Database Management', 4],
      ['EC301', 'Digital Electronics', 3],
      ['EC302', 'Signal Processing', 3],
      ['ME501', 'Thermodynamics', 5],
      ['CE601', 'Structural Analysis', 6],
    ];

    for (const s of subjects) {
      await pool.query(
        `INSERT INTO subjects (subject_code, subject_name, semester)
         VALUES ($1, $2, $3)
         ON CONFLICT (subject_code) DO NOTHING`,
        s
      );
    }
    console.log('Sample subjects created');

    console.log('\nSeed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
