const prisma = require('../db');

// Tenant submits feedback
const createFeedback = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { category, rating, message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const student = await prisma.student.findFirst({
      where: { organizationId, email: req.user.email || '' }
    });

    // Use studentId from token if available
    const studentId = req.user.studentId;
    if (!studentId) return res.status(400).json({ message: 'Student profile not found' });

    const feedback = await prisma.feedback.create({
      data: {
        studentId,
        category: category || 'GENERAL',
        rating: Number(rating),
        message: message.trim(),
        status: 'UNREAD',
      },
      include: { student: { select: { name: true, email: true } } }
    });

    res.status(201).json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get my feedbacks (tenant)
const getMyFeedbacks = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) return res.status(400).json({ message: 'Student profile not found' });

    const feedbacks = await prisma.feedback.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin — get all feedbacks for their organization
const getAllFeedbacks = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { category, status } = req.query;

    const students = await prisma.student.findMany({
      where: { organizationId },
      select: { id: true }
    });
    const studentIds = students.map(s => s.id);

    const where = { studentId: { in: studentIds } };
    if (category) where.category = category;
    if (status)   where.status   = status;

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: { student: { select: { name: true, email: true, bed: { include: { room: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin — update feedback status
const updateFeedbackStatus = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!['UNREAD','READ','RESOLVED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify feedback belongs to this org
    const feedback = await prisma.feedback.findFirst({
      where: { id, student: { organizationId } }
    });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    const updated = await prisma.feedback.update({
      where: { id },
      data: { status },
      include: { student: { select: { name: true } } }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createFeedback, getMyFeedbacks, getAllFeedbacks, updateFeedbackStatus };