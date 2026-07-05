const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const controller = require('../controllers/access.controller');

router.use(verifyToken);
router.get('/', controller.listAccess);
router.post('/', controller.createAccess);
router.get('/:studentId', controller.getStudentLogs);

module.exports = router;