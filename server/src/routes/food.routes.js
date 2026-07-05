const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const controller = require('../controllers/food.controller');

router.use(verifyToken);
router.get('/summary', controller.summary);
router.get('/', controller.listFood);
router.get('/:studentId', controller.getStudentFood);
router.put('/:studentId', controller.updateMeal);

module.exports = router;