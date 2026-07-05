const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendPaymentReminder } = require('./mailer');

const prisma = new PrismaClient();

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const runReminderCheck = async () => {
  console.log('Running payment reminder check...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const organizations = await prisma.organization.findMany();

    let reminderCount = 0;
    let overdueCount = 0;

    for (const org of organizations) {
      const daysBefore = org.reminderDaysBefore ?? 3;

      // Window for "X days before due date"
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const targetStart = new Date(targetDate);
      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);

      // Upcoming reminders — X days before due date
      const upcomingPayments = await prisma.payment.findMany({
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: { gte: targetStart, lte: targetEnd },
          student: { organizationId: org.id },
        },
        include: { student: true },
      });

      for (const payment of upcomingPayments) {
        if (payment.lastReminderSent && isSameDay(new Date(payment.lastReminderSent), today)) continue;
        if (!payment.student?.email) continue;
        try {
          await sendPaymentReminder({
            to: payment.student.email,
            studentName: payment.student.name,
            amount: payment.amount - payment.paidAmount,
            dueDate: payment.dueDate,
            type: 'reminder',
            daysBefore,
          });
          await prisma.payment.update({
            where: { id: payment.id },
            data: { lastReminderSent: new Date() },
          });
          reminderCount++;
          console.log(`Reminder (${daysBefore}d) sent to ${payment.student.email}`);
        } catch (err) {
          console.error('Failed:', err.message);
        }
      }

      // Overdue alerts — due today
      const overduePayments = await prisma.payment.findMany({
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: { gte: today, lte: new Date(today.getTime() + 86400000 - 1) },
          student: { organizationId: org.id },
        },
        include: { student: true },
      });

      for (const payment of overduePayments) {
        if (payment.lastReminderSent && isSameDay(new Date(payment.lastReminderSent), today)) continue;
        if (!payment.student?.email) continue;
        try {
          await sendPaymentReminder({
            to: payment.student.email,
            studentName: payment.student.name,
            amount: payment.amount - payment.paidAmount,
            dueDate: payment.dueDate,
            type: 'overdue',
          });
          await prisma.payment.update({
            where: { id: payment.id },
            data: { lastReminderSent: new Date() },
          });
          overdueCount++;
          console.log(`Overdue alert sent to ${payment.student.email}`);
        } catch (err) {
          console.error('Failed:', err.message);
        }
      }
    }

    console.log(`Done. ${reminderCount} reminders + ${overdueCount} overdue alerts sent.`);
  } catch (err) {
    console.error('Scheduler error:', err.message);
  }
};

const startReminderScheduler = () => {
  cron.schedule('0 9 * * *', runReminderCheck);
  console.log('Payment reminder scheduler started — runs daily at 9:00 AM');
};

module.exports = { startReminderScheduler, runReminderCheck };