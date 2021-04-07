const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Anurag Singh <${process.env.EMAIL_FROM}>`;
  }
  // Creating a Transport

  newTransport() {
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }

    // Config for sendGrid
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // Sending the actual Email
  async send(template, subject) {
    // Render the HTML File
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // Defining the mail options

    const mailOptions = {
      from: `Anurag Singh <${process.env.EMAIL_FROM}>`,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // Sending the actual Email to user

    await this.newTransport().sendMail(mailOptions);
  }

  //Sending the welcome Email
  async sendWelcome() {
    if (process.env.NODE_ENV === 'production ') return;
    await this.send('welcome', 'Welcome to the Natours family');
  }
  async sendPasswordToken() {
    if (process.env.NODE_ENV === 'production ') return;
    await this.send('forgetPassword', 'Password reset token');
  }
};
