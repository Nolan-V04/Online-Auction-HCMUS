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

// Send email notification for new product question
export async function sendQuestionNotificationEmail(sellerEmail, sellerName, productName, productId, askerName, question) {
  try {
    const productLink = `http://localhost:5173/products/detail/${productId}`;
    
    const mailOptions = {
      from: {
        name: 'Online Auction HCMUS',
        address: process.env.EMAIL_USER
      },
      to: sellerEmail,
      subject: `Câu hỏi mới về sản phẩm: ${productName}`,
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
            .question-box { background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❓ Câu hỏi mới từ người mua</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${sellerName}</strong>,</p>
              <p>Bạn có một câu hỏi mới về sản phẩm <strong>${productName}</strong></p>
              
              <div class="question-box">
                <p><strong>Người hỏi:</strong> ${askerName}</p>
                <p><strong>Câu hỏi:</strong></p>
                <p>${question}</p>
              </div>
              
              <p>Hãy trả lời câu hỏi này để tăng độ tin cậy và thu hút thêm người mua!</p>
              
              <div style="text-align: center;">
                <a href="${productLink}" class="button">Xem chi tiết & Trả lời</a>
              </div>
              
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Hoặc truy cập link: <a href="${productLink}">${productLink}</a>
              </p>
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
    console.log('Question notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending question notification email:', error);
    return { success: false, error: error.message };
  }
}

// Send email notification for bid permission request
export async function sendBidPermissionRequestEmail(sellerEmail, sellerName, productName, productId, bidderName, bidderEmail, bidderRating) {
  try {
    const productLink = `http://localhost:5173/products/detail/${productId}`;
    
    const mailOptions = {
      from: {
        name: 'Online Auction HCMUS',
        address: process.env.EMAIL_USER
      },
      to: sellerEmail,
      subject: `Yêu cầu xin phép đấu giá: ${productName}`,
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
            .info-box { background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🙋 Yêu cầu xin phép đấu giá</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${sellerName}</strong>,</p>
              <p>Bạn có một yêu cầu xin phép đấu giá cho sản phẩm <strong>${productName}</strong></p>
              
              <div class="info-box">
                <p><strong>Người yêu cầu:</strong> ${bidderName}</p>
                <p><strong>Email:</strong> ${bidderEmail}</p>
                <p><strong>Đánh giá:</strong> ${bidderRating}</p>
              </div>
              
              <p>Người dùng này chưa đủ điều kiện đánh giá để đấu giá sản phẩm của bạn và đang yêu cầu được phép tham gia đấu giá.</p>
              
              <div style="text-align: center;">
                <a href="${productLink}" class="button">Xem chi tiết & Xét duyệt</a>
              </div>
              
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Hoặc truy cập link: <a href="${productLink}">${productLink}</a>
              </p>
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
    console.log('Bid permission request email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending bid permission request email:', error);
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

// Send OTP for password change
export async function sendPasswordChangeOtpEmail(toEmail, otpCode, recipientName) {
  try {
    const mailOptions = {
      from: {
        name: 'Online Auction HCMUS',
        address: process.env.EMAIL_USER
      },
      to: toEmail,
      subject: 'Mã OTP xác nhận đổi mật khẩu',
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
            .warning { color: #dc2626; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Xác nhận đổi mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${recipientName}</strong>,</p>
              <p>Bạn đã yêu cầu đổi mật khẩu tài khoản tại <strong>Online Auction HCMUS</strong>.</p>
              <p>Để xác nhận thay đổi, vui lòng sử dụng mã OTP dưới đây:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
              </div>

              <p><strong>Lưu ý:</strong></p>
              <ul>
                <li>Mã OTP có hiệu lực trong <strong>5 phút</strong></li>
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này</li>
              </ul>

              <p class="warning">⚠️ Nếu không phải bạn thực hiện, vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản!</p>
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
    console.log('Password change OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password change OTP email:', error);
    return { success: false, error: error.message };
  }
}

