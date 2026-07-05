const prisma = require('../db');

const listAccess = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const logs = await prisma.accessLog.findMany({
      where: { student: { organizationId } },
      include: {
        student: {
          include: { bed: { include: { room: true } } }
        }
      },
      orderBy: { accessTime: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAccess = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { studentId, nfcCardId, accessType } = req.body;

    if (!studentId || !nfcCardId) {
      return res.status(400).json({ message: 'studentId and nfcCardId are required' });
    }

    // Verify student belongs to this organization
    const student = await prisma.student.findFirst({
      where: { id: Number(studentId), organizationId }
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const log = await prisma.accessLog.create({
      data: {
        studentId: Number(studentId),
        nfcCardId,
        accessType: accessType || 'ENTRY',
        status: 'ACTIVE',
      },
      include: { student: true }
    });
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getStudentLogs = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const studentId = Number(req.params.studentId);

    // Verify student belongs to this organization
    const student = await prisma.student.findFirst({
      where: { id: studentId, organizationId }
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const logs = await prisma.accessLog.findMany({
      where: { studentId },
      orderBy: { accessTime: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listAccess, createAccess, getStudentLogs };