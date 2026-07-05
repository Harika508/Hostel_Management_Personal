const prisma = require('../db');

const listStudents = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { kycStatus, name } = req.query;
    const where = { organizationId };
    if (kycStatus) where.kycStatus = kycStatus;
    if (name) where.name = { contains: name, mode: 'insensitive' };

    const students = await prisma.student.findMany({
      where,
      include: {
        bed: { include: { room: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name, email, phone, guardianName, guardianPhone,
      checkInDate, checkOutDate, bedId, kycStatus,
      mealBreakfast, mealLunch, mealDinner
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if bed is already occupied
    if (bedId) {
      const bed = await prisma.bed.findUnique({ where: { id: Number(bedId) } });
      if (bed && bed.status === 'OCCUPIED') {
        return res.status(400).json({ message: 'This bed is already occupied' });
      }
    }

    const student = await prisma.student.create({
      data: {
        organizationId,
        name,
        email,
        phone: phone || null,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
        checkInDate: checkInDate ? new Date(checkInDate) : null,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
        bedId: bedId ? Number(bedId) : null,
        kycStatus: kycStatus || 'PENDING',
        mealBreakfast: mealBreakfast || false,
        mealLunch: mealLunch || false,
        mealDinner: mealDinner || false,
      },
      include: { bed: { include: { room: true } } },
    });

    // Update bed status to OCCUPIED
    if (bedId) {
      await prisma.bed.update({
        where: { id: Number(bedId) },
        data: { status: 'OCCUPIED' }
      });
    }

    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const existing = await prisma.student.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    const {
      name, email, phone, guardianName, guardianPhone,
      checkInDate, checkOutDate, bedId, kycStatus,
      mealBreakfast, mealLunch, mealDinner, idType,
    } = req.body;

    // If bed is changing, free old bed and check new bed
    const newBedId = bedId ? Number(bedId) : null;
    if (newBedId !== existing.bedId) {
      // Free old bed
      if (existing.bedId) {
        await prisma.bed.update({
          where: { id: existing.bedId },
          data: { status: 'VACANT' }
        });
      }
      // Occupy new bed
      if (newBedId) {
        const bed = await prisma.bed.findUnique({ where: { id: newBedId } });
        if (bed && bed.status === 'OCCUPIED') {
          return res.status(400).json({ message: 'This bed is already occupied' });
        }
        await prisma.bed.update({
          where: { id: newBedId },
          data: { status: 'OCCUPIED' }
        });
      }
    }

    // Build clean data object with only known fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (guardianName !== undefined) updateData.guardianName = guardianName || null;
    if (guardianPhone !== undefined) updateData.guardianPhone = guardianPhone || null;
    if (checkInDate !== undefined) updateData.checkInDate = checkInDate ? new Date(checkInDate) : null;
    if (checkOutDate !== undefined) updateData.checkOutDate = checkOutDate ? new Date(checkOutDate) : null;
    if (bedId !== undefined) updateData.bedId = newBedId;
    if (kycStatus !== undefined) updateData.kycStatus = kycStatus;
    if (mealBreakfast !== undefined) updateData.mealBreakfast = mealBreakfast;
    if (mealLunch !== undefined) updateData.mealLunch = mealLunch;
    if (mealDinner !== undefined) updateData.mealDinner = mealDinner;

    // Only add idType if it exists in schema
    try {
      if (idType !== undefined) updateData.idType = idType || null;
    } catch {}

const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: { bed: { include: { room: true } } },
    });

    // ✅ Auto-sync email to linked User account if it changed
    if (email !== undefined && email !== existing.email && existing.userId) {
      try {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { email },
        });
      } catch (syncErr) {
        console.error('Failed to sync email to User account:', syncErr.message);
      }
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const existing = await prisma.student.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    // Free up the bed
    if (existing.bedId) {
      await prisma.bed.update({
        where: { id: existing.bedId },
        data: { status: 'VACANT' }
      });
    }

    await prisma.student.delete({ where: { id } });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadKyc = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const existing = await prisma.student.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const url = `/uploads/kyc/${req.file.filename}`;
    const student = await prisma.student.update({
      where: { id },
      data: { kycDocumentUrl: url, kycStatus: 'PENDING' }
    });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const setKycStatus = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const existing = await prisma.student.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    const { status } = req.body;
    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const student = await prisma.student.update({
      where: { id },
      data: { kycStatus: status }
    });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listStudents, createStudent, updateStudent, deleteStudent, uploadKyc, setKycStatus };