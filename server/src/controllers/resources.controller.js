const prisma = require('../db');

// ── INVENTORY ──────────────────────────────────────────────
const listInventory = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const items = await prisma.inventoryItem.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createInventory = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, category, quantity, condition, notes } = req.body;
    if (!name || !category) return res.status(400).json({ message: 'Name and category are required' });

    const item = await prisma.inventoryItem.create({
      data: {
        organizationId,
        name,
        category,
        quantity: Number(quantity) || 1,
        condition: condition || 'GOOD',
        notes: notes || null,
      }
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateInventory = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Item not found' });

    const data = { ...req.body };
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);

    const item = await prisma.inventoryItem.update({ where: { id }, data });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Item not found' });

    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── FACILITIES ──────────────────────────────────────────────
const listFacilities = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const facilities = await prisma.facility.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(facilities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createFacility = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, type, status, notes } = req.body;
    if (!name || !type) return res.status(400).json({ message: 'Name and type are required' });

    const facility = await prisma.facility.create({
      data: { organizationId, name, type, status: status || 'AVAILABLE', notes: notes || null }
    });
    res.status(201).json(facility);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateFacility = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.facility.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Facility not found' });

    const facility = await prisma.facility.update({ where: { id }, data: req.body });
    res.json(facility);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFacility = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.facility.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Facility not found' });

    await prisma.facility.delete({ where: { id } });
    res.json({ message: 'Facility deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── MAINTENANCE REQUESTS ──────────────────────────────────────────────
const listRequests = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const requests = await prisma.maintenanceRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createRequest = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { title, description, category, priority, roomNumber } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        organizationId,
        title,
        description,
        category,
        priority: priority || 'MEDIUM',
        roomNumber: roomNumber || null,
        reportedById: req.user.userId,
        reportedByRole: req.user.role,
        reportedByName: req.user.name,
      }
    });
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.maintenanceRequest.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Request not found' });

    const data = { ...req.body };
    if (data.status === 'RESOLVED' && !existing.resolvedAt) {
      data.resolvedAt = new Date();
      data.resolvedById = req.user.userId;
    }

    const request = await prisma.maintenanceRequest.update({ where: { id }, data });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.maintenanceRequest.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Request not found' });

    await prisma.maintenanceRequest.delete({ where: { id } });
    res.json({ message: 'Request deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listInventory, createInventory, updateInventory, deleteInventory,
  listFacilities, createFacility, updateFacility, deleteFacility,
  listRequests, createRequest, updateRequest, deleteRequest,
};