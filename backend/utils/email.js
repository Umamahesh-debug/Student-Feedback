const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'vagtraining2026@gmail.com',
    pass: process.env.EMAIL_PASS || 'bpusjsiqsehnorkt'
  }
});

const sendOTPEmail = async (toEmail, userName, otp) => {
  const mailOptions = {
    from: `"Student Feedback System" <${process.env.EMAIL_USER || 'vagtraining2026@gmail.com'}>`,
    to: toEmail,
    subject: 'Your Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;
                  background: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #2563eb; margin: 0;">Email Verification</h2>
        </div>
        <p style="color: #374151; font-size: 15px;">Hi <strong>${userName}</strong>,</p>
        <p style="color: #374151; font-size: 15px;">
          Use the OTP below to verify your email address. This OTP is valid for <strong>15 minutes</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #2563eb; color: white;
                      font-size: 36px; font-weight: bold; letter-spacing: 10px;
                      padding: 18px 36px; border-radius: 10px;">
            ${otp}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center;">
          Do not share this OTP with anyone. If you did not request this, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Student Feedback System</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

const sendPasswordResetOTPEmail = async (toEmail, userName, otp) => {
  const mailOptions = {
    from: `"Student Feedback System" <${process.env.EMAIL_USER || 'vagtraining2026@gmail.com'}>`,
    to: toEmail,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;
                  background: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #dc2626; margin: 0;">Password Reset</h2>
        </div>
        <p style="color: #374151; font-size: 15px;">Hi <strong>${userName}</strong>,</p>
        <p style="color: #374151; font-size: 15px;">
          Use the OTP below to reset your password. This OTP is valid for <strong>15 minutes</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #dc2626; color: white;
                      font-size: 36px; font-weight: bold; letter-spacing: 10px;
                      padding: 18px 36px; border-radius: 10px;">
            ${otp}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center;">
          Do not share this OTP with anyone. If you did not request a password reset, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Student Feedback System</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendPasswordResetOTPEmail };
