# 🏨 Hotel Management System (HMS) - Backend v3.0

Hệ thống Quản lý Khách sạn chuyên nghiệp được nâng cấp từ đồ án thực hành lên tiêu chuẩn **BRD v3.0**. Dự án tập trung vào bảo mật dữ liệu, tự động hóa quy trình vận hành và tuân thủ các quy tắc tài chính.

---

## 🚀 1. Hướng dẫn Chạy dự án (Quick Start)

> [!IMPORTANT]
> Để hiểu rõ toàn bộ kịch bản test nghiệp vụ từ A-Z, vui lòng đọc tệp: **[TEST_GUIDE.md](file:///e:/EX01_nguyenkhacphuoc_2123110417/TEST_GUIDE.md)**.

1. **Chuẩn bị:** Mở thư mục dự án bằng Visual Studio Code hoặc Visual Studio 2022.
2. **Cơ sở dữ liệu:** Hệ thống sử dụng SQL Server (hoặc SQLite tùy cấu hình). Chạy lệnh sau trong Terminal để cập nhật DB:
   ```powershell
   dotnet ef database update
   ```
3. **Chạy ứng dụng:**
   ```powershell
   dotnet run
   ```
4. **Truy cập Swagger:** Mở trình duyệt và vào địa chỉ `https://localhost:XXXX/swagger/index.html`.

---

## 🔑 2. Quy trình Test Hệ thống (Thứ tự quan trọng)

Do hệ thống đã được bảo mật bằng **JWT & Role-based Access Control (RBAC)**, bạn phải test theo đúng thứ tự sau:

### Bước A: Tạo tài khoản (Register)
Vào API `/api/Account/register`. Bạn cần tạo ít nhất 2 Role để test:
*   **Admin:** Có quyền tạo phòng, xóa khách hàng.
*   **FrontDesk (Lễ tân):** Có quyền Check-in/Check-out.

**Mẫu JSON Register:**
```json
{
  "email": "le_tan_a@hms.com",
  "password": "Password123!",
  "role": "FrontDesk"
}
```

### Bước B: Đăng nhập (Login)
Vào API `/api/Account/login` với tài khoản vừa tạo. 
*   **Kết quả:** Bạn sẽ nhận được chuỗi `token`.
*   **Sử dụng:** Click nút **"Authorize"** trên cùng của Swagger, nhập: `Bearer <chuỗi token của bạn>`.

---

## 💼 3. Các nghiệp vụ "Đỉnh cao" trong v3.0 (Cách Test)

### 🏨 3.1. Đặt phòng & Phụ thu trễ/sớm (Surcharges)
*   **API:** `POST /api/Reservations`
*   **Tính năng:** Khi bạn dùng API `Check-in` hoặc `Check-out`, hệ thống sẽ tự động đối soát giờ thực tế.
    *   **Test:** Thử tạo một đặt phòng mà ngày Check-in là ngày hôm nay. Nếu bạn bấm Check-in lúc **7h sáng**, hệ thống sẽ tự cộng **50% tiền phòng** vào hóa đơn (theo BR-02).

### 🛡️ 3.2. Bảo mật PII (Mã hóa CCCD)
*   **API:** `POST /api/Guests`
*   **Tính năng:** Khi bạn nhập số CCCD khách hàng, hệ thống lưu dưới dạng mã hóa **AES-256** trong DB.
*   **Test:** Chỉ khi bạn dùng tài khoản có quyền `Admin/FrontDesk` gọi API GET, hệ thống mới giải mã để hiển thị. Người không có quyền sẽ không thấy.

### 🧹 3.3. Tự động hóa Housekeeping
*   **API:** `POST /api/Reservations/{id}/check-out`
*   **Tính năng:** Ngay khi khách trả phòng thành công:
    *   Trạng thái phòng chuyển sang `VacantDirty`.
    *   Hệ thống tự tạo 1 task trong `/api/HousekeepingTasks` để nhân viên đi dọn.

### 📈 3.4. Tích lũy điểm & Thăng hạng (Loyalty)
*   **Cơ chế:** Mỗi 1 VNĐ thanh toán = 1 điểm.
*   **Hạng thẻ:** Tự động thăng hạng **Gold** (>10k điểm) hoặc **Platinum** (>50k điểm) khi khách thanh toán hóa đơn.

---

## 🛠️ 4. Kiến trúc Kỹ thuật (Technical Highlights)

*   **Repository & Unit of Work:** Tách biệt logic DB giúp ứng dụng dễ bảo trì và mở rộng.
*   **Audit Logging:** Tự động ghi lại AI đã làm gì (Create/Update/Delete) và lúc nào.
*   **Value Converters:** Sử dụng để mã hóa dữ liệu nhạy cảm một cách trong suốt (Transparent Encryption).
*   **Background Worker:** Tự động quyét xử lý khách **No-Show** lúc 18h00 hàng ngày.

---

*Hệ thống được thiết kế và thực hiện chuyên nghiệp bởi Antigravity AI Code Assistant.*
