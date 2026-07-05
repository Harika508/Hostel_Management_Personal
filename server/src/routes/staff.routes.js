const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const controller = require('../controllers/staff.controller');

router.use(verifyToken);

// /me MUST be before /:id routes
router.get('/me', controller.getMyProfile);
router.get('/default-permissions', (req, res) => {
  res.json(controller.DEFAULT_PERMISSIONS);
});

router.get('/', controller.listStaff);
router.post('/', requireRole(['ADMIN']), controller.createStaff);
router.put('/:id', requireRole(['ADMIN']), controller.updateStaff);
router.put('/:id/salary', requireRole(['ADMIN']), controller.paySalary);
router.put('/:id/payment-details', controller.updatePaymentDetails);
router.put('/:id/permissions', requireRole(['ADMIN']), controller.updatePermissions);
router.delete('/:id', requireRole(['ADMIN']), controller.deleteStaff);

module.exports = router;