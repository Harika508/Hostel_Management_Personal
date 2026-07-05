const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/payments.controller');

router.use(verifyToken);

router.get('/my', c.getMyPayments);          // ← student's own payments
router.get('/', c.listPayments);
router.post('/', c.createPayment);
router.put('/:id', c.updatePayment);
router.post('/remind/:id', c.remindPayment);
router.post('/razorpay/order', c.createRazorpayOrder);
router.post('/razorpay/verify', c.verifyRazorpayPayment);

module.exports = router;