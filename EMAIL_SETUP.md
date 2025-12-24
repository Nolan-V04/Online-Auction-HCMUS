# Hướng dẫn cấu hình Gmail để gửi OTP

## Bước 1: Bật 2-Step Verification

1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **"2-Step Verification"**
3. Nhấn **"Get Started"** và làm theo hướng dẫn

## Bước 2: Tạo App Password

1. Sau khi bật 2-Step Verification, truy cập: https://myaccount.google.com/apppasswords
2. Hoặc: Google Account → Security → 2-Step Verification → App passwords
3. Chọn:
   - **Select app**: Mail
   - **Select device**: Other (Custom name) → nhập "Online Auction HCMUS"
4. Nhấn **"Generate"**
5. Google sẽ hiển thị mật khẩu 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)

## Bước 3: Cấu hình Backend

Mở file `backend/.env` và điền:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Lưu ý**: 
- Mật khẩu app không có khoảng trắng (xóa khoảng trắng khi copy)
- Không dùng mật khẩu Gmail thông thường
- Không commit file `.env` lên Git

## Bước 4: Test gửi email

Khởi động lại backend:

```powershell
cd backend
npm start
```

Thử đăng ký với email thật của bạn - OTP sẽ được gửi đến hộp thư.

## Troubleshooting

### Lỗi "Invalid login"
- Đảm bảo đã bật 2-Step Verification
- Tạo lại App Password mới
- Kiểm tra không có khoảng trắng trong password

### Lỗi "Less secure app access"
- Dùng App Password (không phải mật khẩu thường)
- Đảm bảo account chưa bị Google khóa

### Email không đến
- Kiểm tra Spam/Junk folder
- Thử gửi từ Gmail khác
- Đợi vài phút (có thể delay)

## Alternative: Dùng dịch vụ khác

Thay vì Gmail, bạn có thể dùng:
- **SendGrid** (free 100 emails/day)
- **Mailgun** (free 5000 emails/month)
- **AWS SES** (free 62,000 emails/month)

Chi tiết config cho các service này có thể thêm sau nếu cần.
