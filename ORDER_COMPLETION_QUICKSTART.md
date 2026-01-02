# Quick Setup - Order Completion System

## Bước 1: Chạy Database Migration

```bash
# Từ thư mục backend
psql -U your_username -d your_database -f db/add_order_completion.sql
```

## Bước 2: Khởi động lại server

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend_swiss
npm run dev
```

## Bước 3: Test

1. Tạo sản phẩm có end_time trong quá khứ hoặc chờ sản phẩm hiện tại kết thúc
2. Đảm bảo sản phẩm có người đấu giá (highest_bidder)
3. Đăng nhập với tài khoản người bán hoặc người thắng
4. Truy cập vào chi tiết sản phẩm
5. Sẽ tự động chuyển sang trang Order Completion

## Quy Trình 4 Bước

1. **Người mua**: Cung cấp hóa đơn thanh toán + địa chỉ giao hàng
2. **Người bán**: Xác nhận nhận tiền + cung cấp mã vận đơn
3. **Người mua**: Xác nhận đã nhận hàng
4. **Cả hai**: Đánh giá +1/-1 kèm nhận xét

## Tính Năng Chính

- ✅ Quy trình hoàn tất đơn hàng 4 bước
- ✅ Chat real-time giữa người bán và người mua
- ✅ Hệ thống đánh giá +/-1
- ✅ Người bán có thể hủy giao dịch bất kỳ lúc nào
- ✅ Thay đổi đánh giá được phép bất kỳ lúc nào
- ✅ Thông báo "Sản phẩm đã kết thúc" cho người dùng khác

## Files Đã Tạo

### Backend
- `backend/db/add_order_completion.sql` - Database schema
- `backend/services/orderCompletion.service.js` - Business logic
- `backend/api/orderCompletion.api.js` - API endpoints
- `backend/app.js` - Updated to register routes

### Frontend
- `frontend_swiss/src/services/orderCompletion.service.js` - API client
- `frontend_swiss/src/pages/shared/OrderCompletion.jsx` - Main UI component
- `frontend_swiss/src/routes/router.jsx` - Updated with new route
- `frontend_swiss/src/pages/shared/itemdetails.jsx` - Updated to redirect

## Xem Chi Tiết

Đọc file [ORDER_COMPLETION_SETUP.md](ORDER_COMPLETION_SETUP.md) để biết thêm chi tiết về:
- API endpoints đầy đủ
- Database schema chi tiết
- Luồng hoạt động
- Troubleshooting
- Future enhancements
