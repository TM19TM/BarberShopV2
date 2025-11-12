// -_-_-_- /config/nodemailer.js -_-_-_-
// Exporta apenas o 'transporter' do Nodemailer

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

module.exports = transporter;