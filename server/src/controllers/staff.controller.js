const prisma = require('../db');

// Default pages per staff role
const DEFAULT_PERMISSIONS = {
  Warden:   ['dashboard','rooms','students','access','feedback'],
  Cook:     ['dashboard','food'],
  Security: ['dashboard','access'],
  Cleaner:  ['dashboard','rooms'],
  Manager:  ['dashboard','rooms','students','payments','food','staff','access','feedback'],
  Other:    ['dashboard'],
};

const listStaff = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const staff = await prisma.staff.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createStaff = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, email, role, phone, monthlySalary } = req.body;
    if (!name || !email || !role || !monthlySalary)
      return res.status(400).json({ message: 'Name, email, role and salary are required' });
    const staff = await prisma.staff.create({
      data: {
        organizationId, name, email, role,
        phone: phone || null,
        monthlySalary: parseFloat(monthlySalary),
        salaryStatus: 'UNPAID',
      }
    });
    res.status(201).json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const updateStaff = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.staff.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Staff not found' });
    const data = { ...req.body };
    if (data.monthlySalary) data.monthlySalary = parseFloat(data.monthlySalary);
    // permissions comes as array from frontend, store as JSON string
    if (data.permissions && Array.isArray(data.permissions)) {
      data.permissions = JSON.stringify(data.permissions);
    }
const staff = await prisma.staff.update({ where: { id }, data });

    console.log('--- STAFF UPDATE DEBUG ---');
    console.log('existing.email:', existing.email);
    console.log('data.email:', data.email);
    console.log('existing.userId:', existing.userId);
    console.log('--- END DEBUG ---');

    // ✅ Auto-sync email to linked User account if it changed
    if (data.email !== undefined && data.email !== existing.email && existing.userId) {
      try {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { email: data.email },
        });
      } catch (syncErr) {
        console.error('Failed to sync email to User account:', syncErr.message);
      }
    }

    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePaymentDetails = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { upiId, upiPhone, paymentMethod } = req.body;
    const staff = await prisma.staff.update({
      where: { id },
      data: { upiId: upiId || null, upiPhone: upiPhone || null, paymentMethod: paymentMethod || null }
    });
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePermissions = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.staff.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Staff not found' });
    const { permissions } = req.body;
    const staff = await prisma.staff.update({
      where: { id },
      data: { permissions: JSON.stringify(permissions) }
    });
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.staff.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Staff not found' });
    await prisma.staff.delete({ where: { id } });
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const paySalary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.id);
    const existing = await prisma.staff.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Staff not found' });
    const { txnRef } = req.body;
    const staff = await prisma.staff.update({
      where: { id },
      data: { salaryStatus: 'PAID', salaryPaidDate: new Date(), ...(txnRef && { txnRef }) }
    });
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const staff = await prisma.staff.findFirst({ where: { userId } });
    if (!staff) return res.status(404).json({ message: 'Staff profile not found' });

    // Return permissions — use custom if set, else default by role
    let permissions = DEFAULT_PERMISSIONS[staff.role] || ['dashboard'];
    if (staff.permissions) {
      try { permissions = JSON.parse(staff.permissions); } catch {}
    }

    res.json({ ...staff, resolvedPermissions: permissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listStaff, createStaff, updateStaff, updatePaymentDetails,
  updatePermissions, getMyProfile, deleteStaff, paySalary,
  DEFAULT_PERMISSIONS,
};