const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { createFeedback, getMyFeedbacks, getAllFeedbacks, updateFeedbackStatus } = require('../controllers/feedback.controller');

router.use(verifyToken);
router.post('/', createFeedback);
router.get('/my', getMyFeedbacks);
router.get('/', requireRole(['ADMIN', 'STAFF']), getAllFeedbacks);
router.put('/:id/status', requireRole(['ADMIN', 'STAFF']), updateFeedbackStatus);

module.exports = router;