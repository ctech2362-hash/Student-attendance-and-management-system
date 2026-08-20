const pool = require('../config/db');

// GET /api/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [studentsCount, subjectsCount, todayAttendance] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM students'),
      pool.query('SELECT COUNT(*) as count FROM subjects'),
      pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'present') as present,
           COUNT(*) FILTER (WHERE status = 'absent') as absent
         FROM attendance WHERE date = $1`,
        [today]
      ),
    ]);

    res.json({
      totalStudents: parseInt(studentsCount.rows[0].count),
      totalSubjects: parseInt(subjectsCount.rows[0].count),
      todayTotal: parseInt(todayAttendance.rows[0].total),
      todayPresent: parseInt(todayAttendance.rows[0].present),
      todayAbsent: parseInt(todayAttendance.rows[0].absent),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
