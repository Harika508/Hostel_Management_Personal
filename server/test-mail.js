require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'harikanicchanametla@gmail.com',
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((err, ok) => {
  if (err) {
    console.log('FAILED:', err.message);
  } else {
    console.log('SUCCESS: Gmail connected! Ready to send emails!');
    // Send test email
    transporter.sendMail({
      from: '"HostelOS" <harikanicchanametla@gmail.com>',
      to: 'harikanicchanametla@gmail.com',
      subject: '🔔 Test Email from HostelOS',
      html: '<h2>Email is working!</h2><p>Your payment reminder system is ready.</p>',
    }, (err, info) => {
      if (err) console.log('Send failed:', err.message);
      else console.log('Email sent successfully! Check your inbox.');
    });
  }
});