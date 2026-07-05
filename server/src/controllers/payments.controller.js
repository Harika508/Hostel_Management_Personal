const prisma = require('../db');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendPaymentReminder } = require('../utils/mailer');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const listPayments = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status } = req.query;

    const where = {
      student: { organizationId }
    };
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
const createPayment = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { studentId, amount, paidAmount, dueDate, gstAmount, tdsAmount, txnRef, status } = req.body;

    if (!studentId || !amount || !dueDate) {
      return res.status(400).json({ message: 'studentId, amount and dueDate are required' });
    }

    const student = await prisma.student.findFirst({
      where: { id: Number(studentId), organizationId }
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const baseAmount = parseFloat(amount);
    const paid = parseFloat(paidAmount) || 0;
    const gst = parseFloat(gstAmount) || 0;
    const tds = parseFloat(tdsAmount) || 0;

    // Use admin's manually selected status
    let finalStatus = status || 'UNPAID';
    let finalPaid = paid;
    let paidDate = null;

    if (finalStatus === 'PAID') {
      // If marked PAID but no paidAmount entered, set it to full amount
      finalPaid = paid > 0 ? paid : baseAmount;
      paidDate = new Date();
    } else if (finalStatus === 'UNPAID') {
      finalPaid = 0;
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: Number(studentId),
        amount: baseAmount,
        paidAmount: finalPaid,
        gstAmount: gst,
        tdsAmount: tds,
        txnRef: txnRef || null,
        dueDate: new Date(dueDate),
        status: finalStatus,
        paidDate,
      },
      include: { student: true },
    });
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const existing = await prisma.payment.findFirst({
      where: { id, student: { organizationId } }
    });
    if (!existing) return res.status(404).json({ message: 'Payment not found' });

    const data = { ...req.body };
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.paidDate) data.paidDate = new Date(data.paidDate);
    if (data.amount !== undefined) data.amount = parseFloat(data.amount);
    if (data.paidAmount !== undefined) data.paidAmount = parseFloat(data.paidAmount);
    if (data.gstAmount !== undefined) data.gstAmount = parseFloat(data.gstAmount);
    if (data.tdsAmount !== undefined) data.tdsAmount = parseFloat(data.tdsAmount);

    // Use admin's manually selected status — don't auto-override
    if (data.status === 'PAID' && !existing.paidDate && !data.paidDate) {
      data.paidDate = new Date();
      // Set paidAmount to full amount if not specified
      if (!data.paidAmount || data.paidAmount === 0) {
        data.paidAmount = data.amount ?? existing.amount;
      }
    } else if (data.status === 'UNPAID') {
      data.paidAmount = 0;
      data.paidDate = null;
    }

    const payment = await prisma.payment.update({
      where: { id },
      data,
      include: { student: true },
    });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const options = { amount: Math.round(amount * 100), currency, receipt };
    const order = await instance.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    if (generated === razorpay_signature) return res.json({ valid: true });
    return res.status(400).json({ valid: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const remindPayment = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const payment = await prisma.payment.findFirst({
      where: { id, student: { organizationId } },
      include: { student: true }
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    console.log('--- REMIND DEBUG ---');
    console.log('Sending to:', payment.student.email);
    console.log('Student name:', payment.student.name);

    const result = await sendPaymentReminder({
      to: payment.student.email,
      studentName: payment.student.name,
      amount: payment.amount - payment.paidAmount,
      dueDate: payment.dueDate,
      type: 'reminder',
    });

    console.log('Mailer result:', result);
    console.log('--- END DEBUG ---');

    res.json({ message: 'Reminder sent' });
  } catch (err) {
    console.error('REMIND ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.userId;

    let student = await prisma.student.findFirst({
      where: { userId },
      include: { bed: { include: { room: true } } }
    });

    if (!student) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        student = await prisma.student.findFirst({
          where: { email: user.email, organizationId: req.user.organizationId },
          include: { bed: { include: { room: true } } }
        });
        if (student) {
          await prisma.student.update({ where: { id: student.id }, data: { userId } });
        }
      }
    }

    if (!student) return res.json({ payments: [], student: null });

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
      select: {
        id: true, amount: true, paidAmount: true, gstAmount: true,
        tdsAmount: true, dueDate: true, paidDate: true, status: true,
        txnRef: true, studentId: true,
        student: { include: { bed: { include: { room: true } } } }
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ payments, student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = {
  listPayments, createPayment, updatePayment,
  createRazorpayOrder, verifyRazorpayPayment,
  remindPayment, getMyPayments,
};