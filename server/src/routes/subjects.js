const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { getAll, create, update, remove } = require('../controllers/subjectController');

router.use(auth);

router.get('/', getAll);

router.post(
  '/',
  [
    body('subject_code').trim().notEmpty().withMessage('Subject code is required'),
    body('subject_name').trim().notEmpty().withMessage('Subject name is required'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be 1-12'),
  ],
  validate,
  create
);

router.put(
  '/:id',
  [
    body('subject_code').trim().notEmpty().withMessage('Subject code is required'),
    body('subject_name').trim().notEmpty().withMessage('Subject name is required'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be 1-12'),
  ],
  validate,
  update
);

router.delete('/:id', remove);

module.exports = router;
