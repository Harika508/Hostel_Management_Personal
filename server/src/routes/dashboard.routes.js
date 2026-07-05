const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const controller = require('../controllers/dashboard.controller');

router.use(verifyToken);
router.get('/stats', controller.stats);

module.exports = router;