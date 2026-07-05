const prisma = require('../db');

const listRooms = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const rooms = await prisma.room.findMany({
      where: { organizationId },
      include: {
        beds: {
          include: {
            student: {
              select: {
                name: true,
                email: true,
                phone: true,
                checkInDate: true,
                checkOutDate: true,
                kycStatus: true,
              }
            }
          }
        }
      },
      orderBy: { floor: 'asc' }
    });
    const withCounts = rooms.map(r => ({
      ...r,
      occupiedBeds: r.beds.filter(b => b.status === 'OCCUPIED').length,
      vacantBeds: r.beds.filter(b => b.status === 'VACANT').length,
      leavingSoon: r.beds.filter(b => b.status === 'LEAVING_SOON').length,
    }));
    res.json(withCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createRoom = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { roomNumber, name, floor, totalBeds } = req.body;

    if (!roomNumber || !name || !floor || !totalBeds) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const room = await prisma.room.create({
      data: {
        organizationId,
        roomNumber,
        name,
        floor: Number(floor),
        totalBeds: Number(totalBeds),
        beds: {
          create: Array.from({ length: Number(totalBeds) }, (_, i) => ({
            bedLabel: `${roomNumber}-B${i + 1}`,
            status: 'VACANT',
          })),
        },
      },
      include: {
        beds: {
          include: {
            student: {
              select: {
                name: true,
                email: true,
                phone: true,
                checkInDate: true,
                checkOutDate: true,
                kycStatus: true,
              }
            }
          }
        }
      },
    });
    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateRoom = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const existing = await prisma.room.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Room not found' });

    const { roomNumber, name, floor, totalBeds, status } = req.body;
    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(roomNumber && { roomNumber }),
        ...(name && { name }),
        ...(floor && { floor: Number(floor) }),
        ...(totalBeds && { totalBeds: Number(totalBeds) }),
        ...(status && { status }),
      },
      include: {
        beds: {
          include: {
            student: {
              select: {
                name: true,
                email: true,
                phone: true,
                checkInDate: true,
                checkOutDate: true,
                kycStatus: true,
              }
            }
          }
        }
      },
    });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);

    const existing = await prisma.room.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Room not found' });

    await prisma.bed.deleteMany({ where: { roomId: id } });
    await prisma.room.delete({ where: { id } });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const stats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const rooms = await prisma.room.findMany({
      where: { organizationId },
      include: { beds: true }
    });
    const totalBeds = rooms.reduce((acc, r) => acc + r.totalBeds, 0);
    const occupied = rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'OCCUPIED').length, 0);
    const vacant = rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'VACANT').length, 0);
    const leavingSoon = rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'LEAVING_SOON').length, 0);
    res.json({ totalRooms: rooms.length, totalBeds, occupied, vacant, leavingSoon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listRooms, createRoom, updateRoom, deleteRoom, stats };