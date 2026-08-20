const pool = require('../config/db');

// POST /api/attendance/mark — bulk mark attendance
const markBulk = async (req, res, next) => {
  try {
    const { subject_id, date, records } = req.body;
    // records: [{ student_id: 1, status: 'present' }, ...]
    const adminId = req.admin.id;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No attendance records provided.' });
    }

    const results = [];
    for (const record of records) {
      const result = await pool.query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, subject_id, date)
         DO UPDATE SET status = $4, marked_by = $5
         RETURNING *`,
        [record.student_id, subject_id, date, record.status, adminId]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json({
      message: `Attendance marked for ${results.length} students`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/attendance/:id — update a single record
const updateRecord = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE attendance SET status = $1, marked_by = $2 WHERE id = $3 RETURNING *`,
      [status, req.admin.id, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/history?subject_id=&date_from=&date_to=
const getHistory = async (req, res, next) => {
  try {
    const { subject_id, date_from, date_to } = req.query;
    let query = `
      SELECT a.*, s.student_id AS roll_no, s.name AS student_name,
             sub.subject_code, sub.subject_name,
             adm.username AS marked_by_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      JOIN admins adm ON a.marked_by = adm.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (subject_id) {
      query += ` AND a.subject_id = $${idx}`;
      params.push(parseInt(subject_id));
      idx++;
    }
    if (date_from) {
      query += ` AND a.date >= $${idx}`;
      params.push(date_from);
      idx++;
    }
    if (date_to) {
      query += ` AND a.date <= $${idx}`;
      params.push(date_to);
      idx++;
    }

    query += ' ORDER BY a.date DESC, s.student_id ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/student/:studentId — full history + percentage
const getStudentAttendance = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;

    // Get student info
    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get attendance records
    const records = await pool.query(
      `SELECT a.*, sub.subject_code, sub.subject_name
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = $1
       ORDER BY a.date DESC`,
      [studentId]
    );

    // Calculate percentage
    const total = records.rows.length;
    const present = records.rows.filter((r) => r.status === 'present').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      student: studentResult.rows[0],
      records: records.rows,
      stats: { total, present, absent: total - present, percentage: parseFloat(percentage) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { markBulk, updateRecord, getHistory, getStudentAttendance };
