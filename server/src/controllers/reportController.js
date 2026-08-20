const pool = require('../config/db');

// GET /api/reports/student/:id — per-subject % and overall
const getStudentReport = async (req, res, next) => {
  try {
    const studentId = req.params.id;

    // Get student
    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Per-subject attendance
    const subjectStats = await pool.query(
      `SELECT
         sub.id as subject_id, sub.subject_code, sub.subject_name,
         COUNT(*) as total_classes,
         COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
         COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
         ROUND(
           (COUNT(*) FILTER (WHERE a.status = 'present')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
         ) as percentage
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = $1
       GROUP BY sub.id, sub.subject_code, sub.subject_name
       ORDER BY sub.subject_code`,
      [studentId]
    );

    // Overall stats
    const overallResult = await pool.query(
      `SELECT
         COUNT(*) as total_classes,
         COUNT(*) FILTER (WHERE status = 'present') as present_count,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
         ROUND(
           (COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
         ) as percentage
       FROM attendance
       WHERE student_id = $1`,
      [studentId]
    );

    res.json({
      student: studentResult.rows[0],
      subjectWise: subjectStats.rows.map((row) => ({
        ...row,
        total_classes: parseInt(row.total_classes),
        present_count: parseInt(row.present_count),
        absent_count: parseInt(row.absent_count),
        percentage: parseFloat(row.percentage) || 0,
      })),
      overall: {
        total_classes: parseInt(overallResult.rows[0].total_classes),
        present_count: parseInt(overallResult.rows[0].present_count),
        absent_count: parseInt(overallResult.rows[0].absent_count),
        percentage: parseFloat(overallResult.rows[0].percentage) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStudentReport };
