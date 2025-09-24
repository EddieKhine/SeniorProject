import nodemailer from 'nodemailer';

// Create reusable transporter object using Namecheap SMTP
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com', // Namecheap's SMTP server
  port: 587, // Use port 587 for TLS
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Your email password (not app password)
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

export default transporter;
