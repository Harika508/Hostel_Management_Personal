const express = require('express');
const router = express.Router();
const { register, login, me, approveUser, disapproveUser, setPassword, forgotPassword, getUsers, updateOrganization } = require('../controllers/auth.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { runReminderCheck } = require('../utils/reminderScheduler');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/set-password', setPassword);
router.post('/forgot-password', forgotPassword);
router.post('/approve/:type/:id', verifyToken, requireRole(['ADMIN']), approveUser);
router.post('/disapprove/:type/:id', verifyToken, requireRole(['ADMIN']), disapproveUser);
router.get('/users', verifyToken, requireRole(['ADMIN']), getUsers);
router.put('/organization', verifyToken, requireRole(['ADMIN']), updateOrganization);

// Manual trigger for testing — runs the same logic as the 9 AM cron job
router.post('/test-reminders', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    await runReminderCheck();
    res.json({ message: 'Reminder check completed. Check server console for details.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to run reminder check', error: err.message });
  }
});

module.exports = router;