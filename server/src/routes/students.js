const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { getAll, getById, create, update, remove } = require('../controllers/studentController');

router.use(auth);

router.get('/', getAll);
router.get('/:id', getById);

router.post(
  '/',
  [
    body('student_id').trim().notEmpty().withMessage('Student ID (roll no.) is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('course').trim().notEmpty().withMessage('Course is required'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be 1-12'),
  ],
  validate,
  create
);

router.put(
  '/:id',
  [
    body('student_id').trim().notEmpty().withMessage('Student ID (roll no.) is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('course').trim().notEmpty().withMessage('Course is required'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be 1-12'),
  ],
  validate,
  update
);

router.delete('/:id', remove);

module.exports = router;
