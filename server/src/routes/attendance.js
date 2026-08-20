const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { markBulk, updateRecord, getHistory, getStudentAttendance } = require('../controllers/attendanceController');

router.use(auth);

router.post(
  '/mark',
  [
    body('subject_id').isInt().withMessage('Subject ID is required'),
    body('date').isDate().withMessage('Valid date is required'),
    body('records').isArray({ min: 1 }).withMessage('At least one attendance record is required'),
    body('records.*.student_id').isInt().withMessage('Student ID is required'),
    body('records.*.status').isIn(['present', 'absent']).withMessage('Status must be present or absent'),
  ],
  validate,
  markBulk
);

router.put(
  '/:id',
  [body('status').isIn(['present', 'absent']).withMessage('Status must be present or absent')],
  validate,
  updateRecord
);

router.get('/history', getHistory);
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
