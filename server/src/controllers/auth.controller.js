const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ── Register new hostel + admin ──
const register = async (req, res) => {
  try {
    const { hostelName, city, address, adminName, email, password } = req.body;
    if (!hostelName || !email || !password || !adminName)
      return res.status(400).json({ message: 'All fields are required' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: 'Email already registered' });

    const hostelCode = hostelName.toUpperCase().replace(/\s+/g, '').slice(0, 8) + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: hostelName, city: city || '', address: address || '', hostelCode, adminEmail: email },
      });
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          name: adminName,
          email,
          passwordHash,
          role: 'ADMIN',
          loginApproved: true,
        },
      });
      await tx.featureFlag.createMany({
        data: [
          { organizationId: organization.id, flagName: 'payments_enabled', isEnabled: true },
          { organizationId: organization.id, flagName: 'food_module_enabled', isEnabled: true },
          { organizationId: organization.id, flagName: 'staff_management_enabled', isEnabled: true },
          { organizationId: organization.id, flagName: 'access_control_enabled', isEnabled: true },
        ],
      });
      return { organization, user };
    });

    const token = jwt.sign(
      { userId: result.user.id, organizationId: result.organization.id, role: result.user.role, name: result.user.name, hostelName: result.organization.name, studentId: null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Hostel registered successfully!',
      token,
      user: {
        id: result.user.id, name: result.user.name, email: result.user.email,
        role: result.user.role, hostelName: result.organization.name,
        hostelCode: result.organization.hostelCode,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Login ──
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.role !== 'ADMIN' && !user.loginApproved)
      return res.status(403).json({ message: 'Your login has not been approved yet. Please contact the admin.' });

    if (!user.passwordHash || user.passwordHash === '')
      return res.status(403).json({ message: 'Please set your password using the invite link sent by admin.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    let studentId = null;
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { organizationId: user.organizationId, OR: [{ userId: user.id }, { email }] },
      });
      studentId = student?.id || null;
      if (student && !student.userId) {
        await prisma.student.update({ where: { id: student.id }, data: { userId: user.id } });
      }
    }

    // ✅ Get staff permissions if STAFF role — also auto-link Staff.userId if missing
    let staffPermissions = null;
    let staffRole = null;
    if (user.role === 'STAFF') {
      let staffRecord = await prisma.staff.findFirst({
        where: { organizationId: user.organizationId, OR: [{ userId: user.id }, { email }] },
      });

      // Auto-link staff record to this user if not already linked
      if (staffRecord && !staffRecord.userId) {
        staffRecord = await prisma.staff.update({
          where: { id: staffRecord.id },
          data: { userId: user.id },
        });
      }

      if (staffRecord) {
        staffRole = staffRecord.role;
      const DEFAULT_PERMISSIONS = {
  Warden:   ['dashboard','rooms','students','access','feedback','resources'],
  Cook:     ['dashboard','food','resources'],
  Security: ['dashboard','access','resources'],
  Cleaner:  ['dashboard','rooms','resources'],
  Manager:  ['dashboard','rooms','students','payments','food','staff','access','feedback','resources'],
  Other:    ['dashboard','resources'],
};
        if (staffRecord.permissions) {
          try { staffPermissions = JSON.parse(staffRecord.permissions); } catch {}
        }
        if (!staffPermissions) staffPermissions = DEFAULT_PERMISSIONS[staffRecord.role] || ['dashboard'];
      }
    }

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organizationId, role: user.role, name: user.name, hostelName: user.organization.name, studentId, staffPermissions, staffRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        hostelName: user.organization.name, hostelCode: user.organization.hostelCode,
        studentId, staffPermissions, staffRole,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get current user ──
const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

let studentId = null;
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { organizationId: user.organizationId, OR: [{ userId: user.id }, { email: user.email }] },
      });
      studentId = student?.id || null;
    }

    let staffRole = null;
    let staffPermissions = null;
    if (user.role === 'STAFF') {
      const staffRecord = await prisma.staff.findFirst({
        where: { organizationId: user.organizationId, OR: [{ userId: user.id }, { email: user.email }] },
      });
      if (staffRecord) {
        staffRole = staffRecord.role;
        if (staffRecord.permissions) {
          try { staffPermissions = JSON.parse(staffRecord.permissions); } catch {}
        }
      }
    }

    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      hostelName: user.organization.name, hostelCode: user.organization.hostelCode,
      studentId, staffRole, staffPermissions,
      organization: {
    gstin: user.organization.gstin,
    pan: user.organization.pan,
    bankName: user.organization.bankName,
    bankAccount: user.organization.bankAccount,
    bankIfsc: user.organization.bankIfsc,
    bankBranch: user.organization.bankBranch,
    address: user.organization.address,
    city: user.organization.city,
    reminderDaysBefore: user.organization.reminderDaysBefore,
  }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Approve login — creates User record + invite token (Admin only) ──
const approveUser = async (req, res) => {
  try {
    const { type, id } = req.params;
    const organizationId = req.user.organizationId;

    let record;
    if (type === 'student') {
      record = await prisma.student.findFirst({ where: { id: Number(id), organizationId } });
    } else {
      record = await prisma.staff.findFirst({ where: { id: Number(id), organizationId } });
    }
    if (!record) return res.status(404).json({ message: `${type} not found` });
    if (!record.email) return res.status(400).json({ message: 'This person has no email. Please add an email first.' });

   const role = type === 'student' ? 'STUDENT' : 'STAFF';
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // For tenants only — generate a permanent access token (no expiry, replaces password)
    let accessToken;
    if (type === 'student') {
      accessToken = crypto.randomBytes(24).toString('hex');
    }

    let user = await prisma.user.findUnique({ where: { email: record.email } });

    if (user) {
      const updateData = { loginApproved: true, inviteToken, inviteExpiry };
      if (type === 'student' && !user.accessToken) {
        updateData.accessToken = accessToken;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      user = await prisma.user.create({
        data: {
          organizationId,
          name: record.name,
          email: record.email,
          passwordHash: '',
          role,
          loginApproved: true,
          inviteToken,
          inviteExpiry,
          ...(type === 'student' ? { accessToken } : {}),
        },
      });
    }

    // ✅ ALWAYS re-link the record's userId — whether user was just created or already existed
    if (type === 'student') {
      await prisma.student.update({ where: { id: record.id }, data: { userId: user.id } });
    } else {
      await prisma.staff.update({ where: { id: record.id }, data: { userId: user.id } });
    }

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password?token=${inviteToken}`;
    try {
      const { sendInviteEmail } = require('../utils/mailer');
      await sendInviteEmail({ to: record.email, name: record.name, inviteLink, role });
    } catch (mailErr) {
      console.error('Email send failed (non-blocking):', mailErr.message);
    }

    res.json({
      message: 'Login approved! Invite link generated.',
      inviteLink,
      email: record.email,
    });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Disapprove login (Admin only) ──
const disapproveUser = async (req, res) => {
  try {
    const { type, id } = req.params;
    const organizationId = req.user.organizationId;

    let record;
    if (type === 'student') {
      record = await prisma.student.findFirst({ where: { id: Number(id), organizationId } });
    } else {
      record = await prisma.staff.findFirst({ where: { id: Number(id), organizationId } });
    }
    if (!record) return res.status(404).json({ message: `${type} not found` });
    if (!record.email) return res.status(400).json({ message: 'No email associated' });

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) return res.status(404).json({ message: 'No login account found for this person' });

    await prisma.user.update({
      where: { id: user.id },
      data: { loginApproved: false, inviteToken: null, inviteExpiry: null },
    });

    if (type === 'student') {
      await prisma.student.update({ where: { id: record.id }, data: { userId: null } });
    } else {
      await prisma.staff.update({ where: { id: record.id }, data: { userId: null } });
    }

    res.json({ message: 'Login disapproved. This person can no longer log in.' });
  } catch (err) {
    console.error('Disapprove error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Set password from invite (public route — no auth needed) ──
const setPassword = async (req, res) => {
  try {
    const { token, hostelCode, password } = req.body;
    if (!token || !hostelCode || !password)
      return res.status(400).json({ message: 'Token, hostel code and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      include: { organization: true },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired invite link' });
    if (user.inviteExpiry && user.inviteExpiry < new Date())
      return res.status(400).json({ message: 'Invite link has expired. Ask admin to resend.' });
    if (!user.loginApproved)
      return res.status(403).json({ message: 'Your login has been disapproved by admin.' });

    if (user.organization.hostelCode.toUpperCase() !== hostelCode.toUpperCase())
      return res.status(400).json({ message: 'Incorrect hostel code. Please check with your admin.' });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, inviteToken: null, inviteExpiry: null },
    });

    // ✅ Auto-login: build the same token/user payload as login()
    let studentId = null;
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { organizationId: user.organizationId, OR: [{ userId: user.id }, { email: user.email }] },
      });
      studentId = student?.id || null;
      if (student && !student.userId) {
        await prisma.student.update({ where: { id: student.id }, data: { userId: user.id } });
      }
    }

    let staffPermissions = null;
    let staffRole = null;
    if (user.role === 'STAFF') {
      let staffRecord = await prisma.staff.findFirst({
        where: { organizationId: user.organizationId, OR: [{ userId: user.id }, { email: user.email }] },
      });
      if (staffRecord && !staffRecord.userId) {
        staffRecord = await prisma.staff.update({ where: { id: staffRecord.id }, data: { userId: user.id } });
      }
      if (staffRecord) {
        staffRole = staffRecord.role;
        const DEFAULT_PERMISSIONS = {
          Warden:   ['dashboard','rooms','students','access','feedback','resources'],
          Cook:     ['dashboard','food','resources'],
          Security: ['dashboard','access','resources'],
          Cleaner:  ['dashboard','rooms','resources'],
          Manager:  ['dashboard','rooms','students','payments','food','staff','access','feedback','resources'],
          Other:    ['dashboard','resources'],
        };
        if (staffRecord.permissions) {
          try { staffPermissions = JSON.parse(staffRecord.permissions); } catch {}
        }
        if (!staffPermissions) staffPermissions = DEFAULT_PERMISSIONS[staffRecord.role] || ['dashboard'];
      }
    }

    const loginToken = jwt.sign(
      { userId: user.id, organizationId: user.organizationId, role: user.role, name: user.name, hostelName: user.organization.name, studentId, staffPermissions, staffRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Password set successfully!',
      token: loginToken,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        hostelName: user.organization.name, hostelCode: user.organization.hostelCode,
        studentId, staffPermissions, staffRole,
      },
    });
  } catch (err) {
    console.error('Set password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get all users in organization (Admin only) ──
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.user.organizationId },
      select: { id: true, name: true, email: true, role: true, loginApproved: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
// ── Tenant permanent access — no password, just the link (public route) ──
const tenantAccess = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Access token is required' });

    const user = await prisma.user.findUnique({
      where: { accessToken: token },
      include: { organization: true },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired access link' });
    if (!user.loginApproved)
      return res.status(403).json({ message: 'Your access has been disapproved by admin. Contact your hostel admin.' });

    let studentId = null;
    const student = await prisma.student.findFirst({
      where: { organizationId: user.organizationId, OR: [{ userId: user.id }, { email: user.email }] },
    });
    studentId = student?.id || null;
    if (student && !student.userId) {
      await prisma.student.update({ where: { id: student.id }, data: { userId: user.id } });
    }

    const jwtToken = jwt.sign(
      { userId: user.id, organizationId: user.organizationId, role: user.role, name: user.name, hostelName: user.organization.name, studentId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        hostelName: user.organization.name, hostelCode: user.organization.hostelCode,
        studentId,
      },
    });
  } catch (err) {
    console.error('Tenant access error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { gstin, pan, bankName, bankAccount, bankIfsc, bankBranch, address, city, reminderDaysBefore } = req.body;
    const data = { gstin, pan, bankName, bankAccount, bankIfsc, bankBranch, address, city };
    if (reminderDaysBefore !== undefined) {
      data.reminderDaysBefore = parseInt(reminderDaysBefore) || 3;
    }
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data,
    });
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });
    // Don't reveal whether the email exists — always respond the same way
    if (!user || !user.loginApproved) {
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { inviteToken, inviteExpiry } });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password?token=${inviteToken}`;

    try {
      const { sendPasswordResetEmail } = require('../utils/mailer');
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetLink, role: user.role });
    } catch (mailErr) {
      console.error('Reset email send failed (non-blocking):', mailErr.message);
    }

    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, me, approveUser, disapproveUser, setPassword, forgotPassword, getUsers, updateOrganization };