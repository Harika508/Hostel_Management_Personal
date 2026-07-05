const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendPaymentReminder = async ({ to, studentName, amount, dueDate, type, daysBefore }) => {
  const isOverdue = type === 'overdue';

  const subject = isOverdue
    ? `⚠️ Payment Overdue — ₹${amount.toLocaleString()} due today`
    : `🔔 Payment Reminder — ₹${amount.toLocaleString()} due in ${daysBefore || 2} day${daysBefore === 1 ? '' : 's'}`;

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;
                border:1px solid #e4e0d8;border-radius:12px;overflow:hidden;">
      <div style="background:${isOverdue ? '#dc2626' : '#1a56db'};padding:24px;">
        <span style="color:white;font-weight:600;font-size:16px;">HostelOS</span>
      </div>
      <div style="padding:28px;background:#ffffff;">
        <h2 style="margin:0 0 8px;font-size:18px;color:#0f0f0f;">
          ${isOverdue ? '⚠️ Payment is Due Today' : '🔔 Payment Reminder'}
        </h2>
        <p style="color:#4a4a4a;font-size:14px;margin:0 0 20px;">
          Dear <strong>${studentName}</strong>,
          ${isOverdue
            ? ' your hostel payment is due <strong>today</strong>. Please pay immediately.'
            : ` your hostel payment is due in <strong>${daysBefore || 2} day${daysBefore === 1 ? '' : 's'}</strong>. Please arrange payment soon.`}
        </p>
        <div style="background:#f5f3ef;border-radius:10px;padding:16px;margin-bottom:20px;">
          <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:6px;">Amount Due</div>
          <div style="font-size:28px;font-weight:700;color:#0f0f0f;font-family:monospace;">
            ₹${amount.toLocaleString()}
          </div>
          <div style="font-size:12px;color:#888;margin-top:4px;">
            Due Date: ${new Date(dueDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </div>
        </div>
        <p style="font-size:12px;color:#888;margin:0;">
          Contact hostel admin if you have already made the payment.
        </p>
      </div>
      <div style="padding:16px 28px;background:#f9f8f6;border-top:1px solid #e4e0d8;">
        <p style="margin:0;font-size:11px;color:#888;">
          Automated reminder from HostelOS
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"HostelOS" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const ROLE_LABELS = {
  STUDENT: 'Tenant',
  STAFF: 'Staff',
  ADMIN: 'Admin',
};

const sendInviteEmail = async ({ to, name, inviteLink, role }) => {
  const displayRole = ROLE_LABELS[role] || role;
  await transporter.sendMail({
    from: `"HostelOS" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Your HostelOS Login Invitation',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1a56db;margin-bottom:4px;">Welcome to HostelOS</h2>
        <p style="color:#6b7280;font-size:14px;">Hi ${name},</p>
        <p style="color:#374151;font-size:14px;">Your admin has approved your login as <strong>${displayRole}</strong>. Click the button below to activate your account and access your dashboard.</p>
        <a href="${inviteLink}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#1a56db;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Activate My Account</a>
        <p style="color:#9ca3af;font-size:12px;">You will also need your <strong>Hostel Code</strong> to activate your account. Ask your admin if you don't have it.</p>
        <p style="color:#9ca3af;font-size:12px;">This link expires in 7 days.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async ({ to, name, resetLink, role }) => {
  const displayRole = ROLE_LABELS[role] || role;
  await transporter.sendMail({
    from: `"HostelOS" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Reset Your HostelOS Password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1a56db;margin-bottom:4px;">Reset Your Password</h2>
        <p style="color:#6b7280;font-size:14px;">Hi ${name},</p>
        <p style="color:#374151;font-size:14px;">We received a request to reset your <strong>${displayRole}</strong> account password. Click the button below to set a new password and access your dashboard.</p>
        <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#1a56db;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reset My Password</a>
        <p style="color:#9ca3af;font-size:12px;">You will also need your <strong>Hostel Code</strong> to reset your password. Ask your admin if you don't have it.</p>
        <p style="color:#9ca3af;font-size:12px;">If you didn't request this, you can safely ignore this email. This link expires in 7 days.</p>
      </div>
    `,
  });
};

module.exports = { sendPaymentReminder, sendInviteEmail, sendPasswordResetEmail };