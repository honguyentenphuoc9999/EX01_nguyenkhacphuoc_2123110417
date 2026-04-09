# 🏨 Hotel Management System (HMS) - Backend v3.0

Hệ thống Quản lý Khách sạn chuyên nghiệp được nâng cấp từ đồ án thực hành lên tiêu chuẩn **BRD v3.0** (và cập nhật bổ sung). Dự án tập trung vào bảo mật dữ liệu, tự động hóa quy trình vận hành và tuân thủ các quy tắc tài chính.

---

## 🚀 1. HƯỚNG DẪN TRIỂN KHAI NHANH (QUICK START GUIDE)

### A. Khởi tạo Cơ sở dữ liệu (EF Core Migrations)
Nếu bạn triển khai trên máy mới hoặc thư mục `Migrations` bị xóa, hãy mở **Package Manager Console** trong Visual Studio và chạy các lệnh sau:

**1. Cho Hệ thống vận hành (AppDbContext):**
```powershell
# Tạo bản thiết kế (Migration)
Add-Migration InitialFinalUpgrade -Context AppDbContext

# Cập nhật vào SQL Server
Update-Database -Context AppDbContext
```

**2. Cho Kho dữ liệu phân tích (WarehouseDbContext):**
```powershell
# Tạo bản thiết kế phân tích
Add-Migration WarehouseInit -Context WarehouseDbContext

# Cập nhật vào SQL Server
Update-Database -Context WarehouseDbContext
```

### B. Khởi động Giao diện (Frontend - React)
Dự án sử dụng React + Vite. Cấu hình sẵn kết nối API tại `src/api/api.js`.
```bash
cd HMS_Frontend
npm install
npm run dev
```

---

## 🔐 2. DANH SÁCH TÀI KHOẢN TEST (AUTO-SEEDED)

Hệ thống đã được nạp sẵn dữ liệu mẫu. Bạn có thể dùng các tài khoản sau để đăng nhập ngay lập tức tại API `/api/Account/login`:

| Nhân viên / Khách | Username | Password | Email | Mã NV | Chức vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nguyễn Khắc Phước** | `admin_phuoc` | `Admin@123` | `admin@hms.com` | `NV001` | **CEO (Admin)** |
| **Trần Văn Quản** | `manager` | `Staff@123` | `manager@hms.com` | `NV002` | **Hotel Manager** |
| **Nguyễn Thị Lan** | `lan` | `Staff@123` | `lan@hms.com` | `NV003` | **Receptionist** |
| **Lê Văn Nam** | `nam` | `Staff@123` | `nam@hms.com` | `NV004` | **Room Attendant (Phục vụ phòng)** |
| **Nguyễn Thị Mai** | `mai.nt` | `Hms@123` | `mai.nt@hms.com` | `HK-001` | **Housekeeper (Dọn phòng)** |
| **Trần Văn Nam** | `nam.tv` | `Hms@123` | `nam.tv@hms.com` | `HK-002` | **Housekeeper (Dọn phòng)** |
| **Nguyễn Thành Viên** | `member` | `Guest@123` | `member@gmail.com` | `Guest` | **VIP Member** |

*Lưu ý:* Sau khi Login thành công, copy chuỗi `token`, nhấn nút **Authorize** trên cùng của trang Swagger và điền cú pháp: `Bearer <token của bạn>`.

> [!TIP]
> **Cơ chế Đồng bộ Nhân viên (Staff-Identity Sync):**
> Hệ thống sử dụng kiến trúc kép: `IdentityUser` quản lý việc Đăng nhập/Mật khẩu/Quyền, trong khi bảng `Staff` quản lý hồ sơ nhân sự (Lương, Phòng ban, Mã NV). Hai bảng này được đồng bộ thông qua trường **Email**. Nếu bạn tạo tài khoản nhân viên mới, hãy đảm bảo Email trùng khớp để hệ thống tự động ánh xạ hồ sơ.

Bạn cũng có thể tự đăng ký tài khoản mới qua API `POST /api/Account/register`.

---

## 💼 3. Các nghiệp vụ

### 🏨 3.1. Đặt phòng & Phụ thu trễ/sớm (Surcharges)
*   **API:** `POST /api/Reservations`
*   **Tính năng:** Khi dùng API Check-in/out, hệ thống tự động đối soát giờ thực tế.
    *   **Test:** Thử tạo một đặt phòng nhận hôm nay. Nếu Check-in lúc **7h sáng**, hệ thống tự tính thêm **50% tiền phòng** (BR-02).

### 🛡️ 3.2. Bảo mật PII (Mã hóa CCCD)
*   **API:** `POST /api/Guests`
*   **Tính năng:** Lưu số CCCD với mã hóa **AES-256** minh bạch trong DB.
*   **Test:** Truy vấn API với tư cách Admin/FrontDesk để giải mã, nếu không có Token, hệ thống sẽ từ chối truy cập.

### 🧹 3.3. Tự động hóa Housekeeping
*   **API:** `POST /api/Reservations/{id}/check-out`
*   **Tính năng:** Ngay khi khách trả phòng:
    *   Trạng thái phòng thành `VacantDirty`.
    *   Hệ thống tự tạo 1 task vệ sinh trong `/api/HousekeepingTasks`.

### 📈 3.4. Tích lũy điểm & Thăng hạng (Loyalty)
*   **Cơ chế:** Tích lũy 1 VNĐ = 1 điểm sau thanh toán.
*   Tự động thăng hạng **Gold** (>10k điểm) hoặc **Platinum** (>50k điểm).

---

## 🛠 4. HỆ THỐNG ENUM (TRA CỨU CƠ SỞ DỮ LIỆU)
*Khi xem dữ liệu trên SQL, các trạng thái hiển thị dạng INT. Bảng tra cứu dưới đây sẽ hữu ích cho bạn:*

### 4.1. Khách Hàng & Loyalty
*   **GuestType**: `0` Regular, `1` VIP, `2` Corporate, `3` Member, `4` Group
*   **LoyaltyTier**: `0` Silver, `1` Gold, `2` Platinum, `3` Diamond

### 4.2. Đặt Phòng (ReservationStatus)
| Số ID | Tên Trạng Thái | Ý nghĩa |
|---|---|---|
| **0** | **Pending** | Chờ xác nhận |
| **1** | **Confirmed** | Đã xác nhận (đã cọc) |
| **2** | **CheckedIn** | Đã nhận phòng |
| **3** | **CheckedOut** | Đã trả phòng |
| **4** | **Cancelled** | Đã hủy |
| **5** | **NoShow** | Khách không đến |

### 4.3. Phòng (RoomStatus)
| Số ID | Tên Trạng Thái | Ý nghĩa |
|---|---|---|
| **0** | **VacantClean** | Trống & Sạch |
| **1** | **VacantDirty** | Trống & Bẩn |
| **2** | **Occupied** | Đang có khách ở |
| **3** | **Reserved** | Đã có người đặt |
| **4** | **OutOfOrder** | Hỏng hóc |
| **5** | **Maintenance**| Bảo trì |

### 4.4. Hóa Đơn (InvoiceStatus)
| Số ID | Tên Trạng Thái | Ý nghĩa |
|---|---|---|
| **0** | **Draft** | Nháp bảng kê |
| **1** | **Issued** | Đã xuất (chờ thu) |
| **2** | **Paid** | Đã thanh toán xong |
| **3** | **Cancelled**| Đã hủy bỏ |

---

## 🏬 5. HỆ THỐNG DỮ LIỆU MẪU (AUTO-SEEDED)

Hệ thống đã cấu hình sẵn để test nhanh:
*   **Hạng phòng**: Standard Room (500k), Deluxe Room (850k), Executive Suite (1,5 triệu).
*   **Phòng thực tế**: 
    *   Tầng 1: `101`, `102` (Standard - Trống Sạch).
    *   Tầng 2: `201`, `202` (Deluxe - Trống Sạch).
    *   Tầng 3: `301`, `302` (Suite - Trống Sạch).
*   **Dịch vụ kho**: Nước suối, Coca Cola, Khăn tắm.

---

## 🧪 6. QUY TRÌNH KỊCH BẢN TEST

1.  **Cấu hình ban đầu (Tùy chọn):** Tạo `RoomTypes` và `Rooms` mới qua hệ thống API, hoặc dùng dữ liệu mẫu.
2.  **Đăng ký hồ sơ Khách:** `POST /api/Guests` với thông tin liên hệ bảo mật.
3.  **Tạo Đặt phòng:** `POST /api/Reservations`.
4.  **Nhận phòng (Check-in):** 
    *   Cập nhật `idNumber` (Số CMND/CCCD/Passport) gốc ở hồ sơ.
    *   `POST /api/Reservations/{id}/check-in` để vào ở.
5.  **Dịch vụ phát sinh (Folio):** Dùng `GET /api/Folios` lấy mã phiếu chi phí. Gán các phụ phí (VD: minibar) bằng `POST /api/FolioCharges`.
6.  **Thanh toán (Check-out):** `POST /api/Reservations/{id}/check-out`. Tự động tạo Hóa đơn điện tử với VAT. Thực hiện `POST /api/Payments` để thu tiền thực tế.
7.  **Hậu mãi:** Dùng tài khoản nhân viên vào `GET /api/HousekeepingTasks` nhận việc dọn phòng và cập nhật bằng lệnh `PUT`.
8.  **Hậu kiểm:** Truy cập `GET /api/AuditLogs` để quản lý các dấu vết can thiệp (Create/Update/Delete) trên dữ liệu nhạy cảm.

---

## 🛠️ 7. Kiến trúc Kỹ thuật Nổi bật

*   **Repository Pattern & Unit of Work:** Quản lý giao dịch nguyên vẹn.
*   **Soft Delete:** Cờ Logic (`IsDeleted`) ngăn chặn sai lệch trên DB lịch sử.
*   **Audit Logging:** Truy vết thao tác theo user từng Context.
*   **Background Tasks:** Hệ thống cập nhật trạng thái No-Show tự động theo thời gian thực (CRON Jobs).

*Thiết kế và hỗ trợ mở rộng chuyên nghiệp theo Tiêu chuẩn Khách sạn.*
