const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getMealPlan, updateMealPlan, weeklySummary } = require('../controllers/mealplan.controller');

router.use(verifyToken);
router.get('/summary', weeklySummary);
router.get('/:studentId', getMealPlan);
router.put('/:studentId', updateMealPlan);

module.exports = router;