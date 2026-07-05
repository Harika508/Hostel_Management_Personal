const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const controller = require('../controllers/students.controller');

router.use(verifyToken);
router.get('/', controller.listStudents);
router.post('/', requireRole(['ADMIN', 'STAFF']), controller.createStudent);
router.put('/:id', requireRole(['ADMIN', 'STAFF']), controller.updateStudent);
router.delete('/:id', requireRole(['ADMIN']), controller.deleteStudent);
router.post('/:id/kyc', upload.single('kyc'), controller.uploadKyc);
router.put('/:id/kyc-status', requireRole(['ADMIN']), controller.setKycStatus);

module.exports = router;