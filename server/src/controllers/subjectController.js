const pool = require('../config/db');

// GET /api/subjects
const getAll = async (req, res, next) => {
  try {
    const { semester } = req.query;
    let query = 'SELECT * FROM subjects';
    const params = [];

    if (semester) {
      query += ' WHERE semester = $1';
      params.push(parseInt(semester));
    }

    query += ' ORDER BY subject_code ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/subjects
const create = async (req, res, next) => {
  try {
    const { subject_code, subject_name, semester } = req.body;
    const result = await pool.query(
      `INSERT INTO subjects (subject_code, subject_name, semester)
       VALUES ($1, $2, $3) RETURNING *`,
      [subject_code, subject_name, semester]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/subjects/:id
const update = async (req, res, next) => {
  try {
    const { subject_code, subject_name, semester } = req.body;
    const result = await pool.query(
      `UPDATE subjects SET subject_code=$1, subject_name=$2, semester=$3
       WHERE id=$4 RETURNING *`,
      [subject_code, subject_name, semester, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/subjects/:id
const remove = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM subjects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
