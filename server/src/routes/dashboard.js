const router = require('express').Router();
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');

router.use(auth);
router.get('/stats', getStats);

module.exports = router;
