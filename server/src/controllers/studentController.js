const pool = require('../config/db');

// GET /api/students — list with optional search/filter
const getAll = async (req, res, next) => {
  try {
    const { search, course, semester } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (name ILIKE $${idx} OR student_id ILIKE $${idx} OR email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (course) {
      query += ` AND course = $${idx}`;
      params.push(course);
      idx++;
    }
    if (semester) {
      query += ` AND semester = $${idx}`;
      params.push(parseInt(semester));
      idx++;
    }

    query += ' ORDER BY student_id ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/students/:id
const getById = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/students
const create = async (req, res, next) => {
  try {
    const { student_id, name, email, course, semester } = req.body;
    const result = await pool.query(
      `INSERT INTO students (student_id, name, email, course, semester)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [student_id, name, email, course, semester]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/students/:id
const update = async (req, res, next) => {
  try {
    const { student_id, name, email, course, semester } = req.body;
    const result = await pool.query(
      `UPDATE students SET student_id=$1, name=$2, email=$3, course=$4, semester=$5
       WHERE id=$6 RETURNING *`,
      [student_id, name, email, course, semester, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/students/:id
const remove = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
