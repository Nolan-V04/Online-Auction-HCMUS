# Hệ Thống Hoàn Tất Đơn Hàng

## Tổng Quan

Hệ thống hoàn tất đơn hàng được triển khai để xử lý giao dịch sau khi phiên đấu giá kết thúc. Hệ thống bao gồm 4 bước chính và tính năng chat giữa người mua và người bán.

## Tính Năng

### 1. Chuyển Hướng Tự Động
- Khi phiên đấu giá kết thúc, người bán và người thắng cuộc sẽ được tự động chuyển sang trang hoàn tất đơn hàng khi truy cập vào chi tiết sản phẩm
- Các người dùng khác sẽ thấy thông báo "Sản phẩm đã kết thúc" và chỉ xem được thông tin cơ bản

### 2. Quy Trình 4 Bước

#### Bước 1: Thanh Toán (Người Mua)
- Người mua cung cấp:
  - Hóa đơn thanh toán (URL ảnh hoặc mô tả)
  - Địa chỉ giao hàng

#### Bước 2: Vận Chuyển (Người Bán)
- Người bán xác nhận:
  - Đã nhận tiền
  - Cung cấp mã vận đơn/thông tin giao hàng

#### Bước 3: Nhận Hàng (Người Mua)
- Người mua xác nhận đã nhận hàng

#### Bước 4: Đánh Giá (Cả Hai)
- Người mua và người bán đánh giá chất lượng giao dịch
- Đánh giá: +1 (tích cực) hoặc -1 (tiêu cực)
- Kèm theo nhận xét ngắn
- Có thể thay đổi đánh giá bất kỳ lúc nào

### 3. Chat Thời Gian Thực
- Giao diện chat thân thiện giữa người bán và người mua
- Tự động đánh dấu tin nhắn đã đọc
- Hiển thị số tin nhắn chưa đọc
- Cập nhật tin nhắn mới mỗi 5 giây

### 4. Hủy Giao Dịch
- Người bán có thể hủy giao dịch bất kỳ lúc nào
- Người thắng cuộc tự động nhận đánh giá -1 khi giao dịch bị hủy
- Yêu cầu ghi rõ lý do hủy

## Cài Đặt

### 1. Database Migration

Chạy script SQL để tạo các bảng cần thiết:

```bash
# Từ thư mục backend
psql -U your_username -d your_database -f db/add_order_completion.sql
```

Hoặc sử dụng công cụ quản lý database của bạn để chạy file `backend/db/add_order_completion.sql`

Script này sẽ tạo:
- Bảng `order_completion`: Lưu trữ thông tin hoàn tất đơn hàng
- Bảng `order_chat`: Lưu trữ tin nhắn chat
- Các indexes để tối ưu hiệu suất
- Triggers tự động cập nhật timestamp
- View `v_order_completion_details` để truy vấn nhanh

### 2. Backend Setup

Các file đã được tạo tự động:
- `backend/services/orderCompletion.service.js` - Service layer
- `backend/api/orderCompletion.api.js` - API endpoints
- API đã được đăng ký trong `backend/app.js`

### 3. Frontend Setup

Các file đã được tạo:
- `frontend_swiss/src/services/orderCompletion.service.js` - Service để gọi API
- `frontend_swiss/src/pages/shared/OrderCompletion.jsx` - Component chính
- Route đã được đăng ký trong `frontend_swiss/src\routes/router.jsx`

### 4. Khởi Động

Không cần cài đặt thêm gì. Khởi động server như bình thường:

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend_swiss
npm run dev
```

## API Endpoints

### GET /api/order-completion/product/:proid
Lấy thông tin order completion theo product ID

**Response:**
```json
{
  "result_code": 0,
  "order_completion": { /* order data */ },
  "unread_count": 0,
  "is_seller": true,
  "is_winner": false
}
```

### POST /api/order-completion/:id/payment
Người mua gửi thông tin thanh toán (Bước 1)

**Body:**
```json
{
  "payment_proof": "URL or description",
  "shipping_address": "Full address"
}
```

### POST /api/order-completion/:id/shipping
Người bán xác nhận vận chuyển (Bước 2)

**Body:**
```json
{
  "shipping_invoice": "Tracking number or info"
}
```

### POST /api/order-completion/:id/received
Người mua xác nhận đã nhận hàng (Bước 3)

### POST /api/order-completion/:id/rating
Đánh giá giao dịch (Bước 4)

**Body:**
```json
{
  "rating": 1,  // 1 or -1
  "comment": "Optional comment"
}
```

### POST /api/order-completion/:id/cancel
Người bán hủy giao dịch

**Body:**
```json
{
  "reason": "Cancellation reason"
}
```

### GET /api/order-completion/:id/chat
Lấy danh sách tin nhắn chat

### POST /api/order-completion/:id/chat
Gửi tin nhắn chat

**Body:**
```json
{
  "message": "Chat message"
}
```

## Database Schema

### order_completion
```sql
- id: SERIAL PRIMARY KEY
- proid: Product ID
- seller_id: Seller user ID
- buyer_id: Buyer user ID
- current_step: 1-4 (current step in process)
- status: 'in_progress', 'completed', 'cancelled'
- payment_proof: Payment proof from buyer
- shipping_address: Shipping address from buyer
- payment_submitted_at: Timestamp
- shipping_invoice: Shipping info from seller
- shipping_confirmed_at: Timestamp
- goods_received_at: Timestamp when buyer confirms
- buyer_rating: 1 or -1
- buyer_rating_comment: Text
- buyer_rated_at: Timestamp
- seller_rating: 1 or -1
- seller_rating_comment: Text
- seller_rated_at: Timestamp
- cancelled_by: User ID who cancelled
- cancelled_at: Timestamp
- cancellation_reason: Text
- created_at, updated_at: Timestamps
```

### order_chat
```sql
- id: SERIAL PRIMARY KEY
- order_completion_id: Foreign key to order_completion
- sender_id: User ID of sender
- message: Text message
- created_at: Timestamp
- read_at: Timestamp when read
```

## Luồng Hoạt Động

1. **Kết Thúc Đấu Giá**
   - Khi `end_time` đã qua
   - Người bán và người thắng cuộc truy cập vào product detail
   - Tự động chuyển sang `/order-completion/:proid`

2. **Bước 1: Thanh Toán**
   - Người mua điền thông tin thanh toán và địa chỉ
   - Click "Gửi thông tin thanh toán"
   - Chuyển sang bước 2

3. **Bước 2: Vận Chuyển**
   - Người bán thấy thông tin thanh toán
   - Xác nhận đã nhận tiền
   - Cung cấp mã vận đơn
   - Click "Xác nhận đã gửi hàng"
   - Chuyển sang bước 3

4. **Bước 3: Nhận Hàng**
   - Người mua thấy thông tin vận chuyển
   - Theo dõi đơn hàng
   - Click "Xác nhận đã nhận hàng"
   - Chuyển sang bước 4

5. **Bước 4: Đánh Giá**
   - Cả hai bên đều có thể đánh giá
   - Chọn +1 (tích cực) hoặc -1 (tiêu cực)
   - Thêm nhận xét
   - Có thể thay đổi đánh giá bất kỳ lúc nào

6. **Chat**
   - Luôn có sẵn trong suốt quá trình
   - Hiển thị ở sidebar bên phải
   - Auto-refresh mỗi 5 giây

7. **Hủy Giao Dịch**
   - Người bán có thể hủy bất kỳ lúc nào
   - Người mua nhận -1 rating tự động
   - Giao dịch chuyển sang trạng thái 'cancelled'

## Ghi Chú

- Tất cả API endpoints yêu cầu authentication (Bearer token)
- Rating được cập nhật vào bảng `users` (positive_ratings, negative_ratings, total_ratings)
- Khi order hoàn tất (cả hai đã rating), status chuyển sang 'completed'
- Tin nhắn chat được đánh dấu đã đọc tự động khi người nhận xem
- Không thể thay đổi hoặc thêm rating cho order đã bị cancelled

## Testing

Để test hệ thống:

1. Tạo một sản phẩm đấu giá với end_time trong quá khứ
2. Đảm bảo sản phẩm có highest_bidder
3. Đăng nhập với tài khoản seller hoặc winner
4. Truy cập vào product detail
5. Sẽ tự động chuyển sang order completion page
6. Test từng bước của quy trình
7. Test chat functionality
8. Test cancel transaction

## Troubleshooting

### Không chuyển sang order completion page
- Kiểm tra end_time đã kết thúc chưa
- Kiểm tra user có phải seller hoặc winner không
- Check console log để xem lỗi

### Chat không cập nhật
- Kiểm tra kết nối API
- Kiểm tra console log
- Chat auto-refresh sau 5 giây

### Rating không cập nhật
- Đảm bảo rating là 1 hoặc -1
- Kiểm tra order status không phải 'cancelled'
- Check API response trong network tab

## Future Enhancements

- WebSocket cho chat real-time thay vì polling
- Upload ảnh trực tiếp cho payment proof và shipping invoice
- Email notifications cho từng bước
- SMS notifications
- Payment gateway integration
- Shipping provider integration
- Dispute resolution system
- Admin panel để quản lý orders
