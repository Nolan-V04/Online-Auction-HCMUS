import nodemailer from 'nodemailer';

// Tạo transporter cho Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Gửi email OTP
export async function sendOtpEmail(toEmail, otpCode, recipientName) {
  try {
    const mailOptions = {
      from: {
        name: 'Online Auction HCMUS',
        address: process.env.EMAIL_USER
      },
      to: toEmail,
      subject: 'Mã OTP xác thực đăng ký tài khoản',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .otp-box { background: white; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .warning { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Online Auction HCMUS</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${recipientName}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Online Auction HCMUS</strong>!</p>
              <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP dưới đây:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
              </div>
              
              <p><span class="warning">⚠️ Lưu ý:</span></p>
              <ul>
                <li>Mã OTP có hiệu lực trong <strong>10 phút</strong></li>
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này</li>
              </ul>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              <p>&copy; 2025 Online Auction HCMUS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
