# Hướng dẫn cài đặt Google reCAPTCHA v2

## Bước 1: Đăng ký reCAPTCHA

1. Truy cập: https://www.google.com/recaptcha/admin/create
2. Đăng nhập bằng tài khoản Google
3. Điền thông tin:
   - **Label**: `Online Auction HCMUS` (hoặc tên dự án)
   - **reCAPTCHA type**: Chọn **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: 
     - `localhost` (cho development)
     - Domain production của bạn (nếu có)
   - Accept the reCAPTCHA Terms of Service
4. Nhấn **Submit**

## Bước 2: Lấy Keys

Sau khi đăng ký, bạn sẽ nhận được:
- **Site Key** (Public key): Dùng cho frontend
- **Secret Key** (Private key): Dùng cho backend

## Bước 3: Cấu hình Frontend

1. Tạo file `.env` trong thư mục `frontend_swiss/`:
```bash
cd frontend_swiss
copy .env.example .env
```

2. Mở file `.env` và thay thế:
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```
Thay `your_site_key_here` bằng **Site Key** bạn vừa lấy.

## Bước 4: Cấu hình Backend

1. Tạo file `.env` trong thư mục `backend/`:
```bash
cd backend
copy .env.example .env
```

2. Mở file `.env` và thay thế:
```env
PORT=3000
NODE_ENV=development
RECAPTCHA_SECRET=your_secret_key_here
```
Thay `your_secret_key_here` bằng **Secret Key** bạn vừa lấy.

## Bước 5: Cài đặt dependencies

Backend cần thêm package `dotenv` để đọc file `.env`:

```bash
cd backend
npm install dotenv
```

## Bước 6: Load environment variables trong backend

Thêm vào đầu file `backend/app.js`:
```javascript
import 'dotenv/config';
```

## Bước 7: Khởi động lại servers

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend_swiss
npm run dev
```

## Kiểm tra

1. Mở trang đăng ký
2. Bạn sẽ thấy widget Google reCAPTCHA thay vì checkbox dev
3. Tích vào "I'm not a robot" để verify
4. Điền form và nhấn "Đăng Ký"

## Lưu ý

- File `.env` **KHÔNG** commit lên Git (đã có trong `.gitignore`)
- Chỉ commit file `.env.example`
- Mỗi môi trường (dev, staging, production) nên có keys riêng
- Keys có thể quản lý tại: https://www.google.com/recaptcha/admin
