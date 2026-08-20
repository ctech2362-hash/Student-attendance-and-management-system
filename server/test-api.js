const pool = require('./src/config/db');

async function test() {
  console.log('Testing DB operations...');

  // Test insert with ON CONFLICT & RETURNING
  const r1 = await pool.query(
    'INSERT INTO attendance (student_id, subject_id, date, status, marked_by) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (student_id, subject_id, date) DO UPDATE SET status = $4, marked_by = $5 RETURNING *',
    [1, 1, '2026-08-20', 'present', 1]
  );
  console.log('Insert/Upsert Attendance Result:', r1.rows);

  // Test query with FILTER / CASE
  const r2 = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'present') as present,
       COUNT(*) FILTER (WHERE status = 'absent') as absent
     FROM attendance WHERE date = $1`,
    ['2026-08-20']
  );
  console.log('Stats Result:', r2.rows);

  // Test report query
  const r3 = await pool.query(
    `SELECT
       sub.id as subject_id, sub.subject_code, sub.subject_name,
       COUNT(*) as total_classes,
       COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
       COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
       ROUND((COUNT(*) FILTER (WHERE a.status = 'present')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as percentage
     FROM attendance a
     JOIN subjects sub ON a.subject_id = sub.id
     WHERE a.student_id = $1
     GROUP BY sub.id, sub.subject_code, sub.subject_name
     ORDER BY sub.subject_code`,
    [1]
  );
  console.log('Subject-wise Report Result:', r3.rows);
}

test().catch(console.error);
