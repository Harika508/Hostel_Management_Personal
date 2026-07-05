require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const resourcesRoutes = require('./routes/resources.routes');
const authRoutes = require('./routes/auth.routes');
const roomsRoutes = require('./routes/rooms.routes');
const studentsRoutes = require('./routes/students.routes');
const paymentsRoutes = require('./routes/payments.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const foodRoutes = require('./routes/food.routes');
const staffRoutes = require('./routes/staff.routes');
const accessRoutes = require('./routes/access.routes');
const mealplanRoutes = require('./routes/mealplan.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/api/resources', resourcesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/mealplan', mealplanRoutes);
app.use('/api/feedback', feedbackRoutes);
// Test reminder email route
app.get('/test-reminder', async (req, res) => {
  try {
    const { sendPaymentReminder } = require('./utils/mailer');
    await sendPaymentReminder({
      to: process.env.MAIL_USER,
      studentName: 'Test Student',
      amount: 8500,
      dueDate: new Date(),
      type: 'reminder',
    });
    res.json({ message: 'Test email sent! Check your inbox.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  try {
    const { startReminderScheduler } = require('./utils/reminderScheduler');
    startReminderScheduler();
  } catch (err) {
    console.error('Scheduler failed to start:', err.message);
  }
});

module.exports = app;