const router = require('express').Router();
const auth = require('../middleware/auth');
const { getStudentReport } = require('../controllers/reportController');

router.use(auth);
router.get('/student/:id', getStudentReport);

module.exports = router;
