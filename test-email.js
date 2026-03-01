require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- SMTP Connection Test ---');
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass:', process.env.SMTP_PASS ? '********' : 'NOT SET');

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('Connection is OK!');

        console.log('Sending test mail to admin...');
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: "logical.thinkids@gmail.com",
            subject: "SMTP Test Mail",
            text: "This is a test mail from the reservation system."
        });
        console.log('Test mail sent successfully!');
    } catch (error) {
        console.error('SMTP Error:', error);
    }
}

testEmail();
