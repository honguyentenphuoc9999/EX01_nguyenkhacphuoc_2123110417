# 🏨 Hotel Management System (HMS) - Backend v3.0 (Production Ready)

Hệ thống Quản lý Khách sạn chuyên nghiệp được nâng cấp toàn diện lên tiêu chuẩn **BRD v3.0**. Dự án tập trung vào tính thực tế trong vận hành: Tự động hóa dọn dẹp, Phục vụ phòng thông minh, và Hệ thống Hội viên (CRM) chuẩn Quốc tế.

---

## 🔐 2. DANH SÁCH TÀI KHOẢN THỬ NGHIỆM

Hệ thống đã nạp sẵn các tài khoản phân quyền để test kịch bản vận hành:

| Đối tượng | Email / Đăng nhập | Mật khẩu | Chức vụ | Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@hms.com` | `Admin@123` | **CEO** | Toàn quyền, Cài đặt VietQR, Quản lý Nhân sự |
| **Manager** | `manager@hms.com` | `Staff@123` | **Quản lý** | Điều phối dọn dẹp/phục vụ, xem báo cáo |
| **Receptionist** | `lan@hms.com` | `Staff@123` | **Lễ tân** | Đặt phòng, Check-in/out, Thu tiền |
| **Attendant** | `nam@hms.com` | `Staff@123` | **Phục vụ** | Nhận thực đơn, Giao đồ ăn tận nơi |
| **Housekeeper 1** | `mai.nt@hms.com` | `Hms@123` | **Dọn phòng** | Xem danh sách dọn dẹp, Chụp ảnh bằng chứng |
| **Housekeeper 2** | `nam.tv@hms.com` | `Hms@123` | **Dọn phòng** | Nhân viên dọn dẹp số 2 |

### 👤 2.1. Tài khoản Khách hàng mẫu (Loyalty Member)
| Họ và Tên | Email / SĐT | Mật khẩu | Hạng hội viên |
| :--- | :--- | :--- | :--- |
| **Nguyễn Thành Viên** | `member@gmail.com` / `0909000123` | `Guest@123` | **Hạng Vàng (Gold)** |

### 🔐 2.1. CHI TIẾT CÁC NGHIỆP VỤ THEO VAI TRÒ
*   **ADMIN:** Cấu hình gốc (VietQR, Thông tin khách sạn), Quản lý tài khoản nhân viên, Xem toàn bộ Audit Logs.
*   **MANAGER:** Không được vào mục "Cài đặt". Chuyên quản lý vận hành: Giao việc cho nhân viên, kiểm tra chất lượng dọn dẹp, xem Dashboard thống kê thực tế.
*   **LỄ TÂN:** Thực hiện quy trình đón/tiễn khách. Quản lý danh sách đặt phòng và thanh toán hóa đơn VAT.
*   **PHỤC VỤ (Room Attendant):** Chỉ truy cập "Hệ thống Phục vụ" để đi giao hàng. Các đơn hàng này do Khách hàng yêu cầu từ trang Home.
*   **DỌN PHÒNG (Housekeeper):** Chỉ truy cập "Hệ thống Dọn dẹp" để vệ sinh phòng theo yêu cầu tự động từ hệ thống (sau check-out) hoặc theo chỉ định của Quản lý.

---

## 💼 3. CÁC TÍNH NĂNG NỔI BẬT ĐÃ CẬP NHẬT

### 🏨 3.1. Hệ thống Phòng & Booking mới
*   **Hạng phòng mới:** Bổ sung hạng **Single Room (Phòng Đơn)** dành cho 1 người với giá ưu đãi (400,000 VNĐ).
*   **Booking 1 Khách:** Mặc định hệ thống đặt phòng hiện tại là 1 người để tối ưu cho khách đi công tác/cá nhân.

### 🧹 3.2. Hệ thống Vận hành "Buồng & Phục vụ" (Tách biệt)
*   **Hệ thống Dọn dẹp (Housekeeping):** Tự động tạo task ngay khi khách trả phòng. Nhân viên phải **chụp ảnh thực tế** làm bằng chứng để Admin duyệt "SẠCH" mới cho phép đón khách mới.
*   **Hệ thống Phục vụ (Room Service):** Chỉ hiển thị các đơn yêu cầu đồ ăn/uống/dịch vụ từ khách hàng. 
    *   **Trừ kho động:** Tự động parse số lượng (VD: "2x Coca") để trừ chính xác tồn kho trong DB.
    *   **Tự động Folio:** Tiền dịch vụ tự động cộng vào hồ sơ thanh toán của khách khi nhân viên xác nhận đã giao.

### 📈 3.3. CRM & Loyalty (Hội viên 6 cấp bậc)
Hệ thống tích điểm tự động (**10,000 VNĐ = 1 điểm**) với tên hạng tiếng Việt chuẩn:
1.  **Hạng Đồng (Bronze):** 0 - 999 điểm.
2.  **Hạng Bạc (Silver):** 1,000 - 2,999 điểm.
3.  **Hạng Vàng (Gold):** 3,000 - 9,999 điểm.
4.  **Hạng Bạch Kim (Platinum):** 10,000 - 24,999 điểm.
5.  **Hạng Kim Cương (Diamond):** 25,000 - 49,999 điểm.
6.  **Hạng Hoàng Gia (Royal):** > 50,000 điểm.

---

## 📦 4. QUẢN LÝ KHO (LOGISTICS)
*   Dữ liệu kho hiện đã bao gồm: **Giá vốn (UnitCost)** và **Giá bán (SellingPrice)**.
*   Trạng thái **IsForSale**: Chỉ những món hàng được bật cờ này mới xuất hiện trên Menu gọi món của khách hàng.

---

## 🛠 5. HỆ THỐNG ENUM (TRA CỨU ID TRONG DATABASE)

### 5.1. Đặt Phòng (ReservationStatus)
| Số ID | Tên Trạng Thái | Ý nghĩa |
|---|---|---|
| **0** | **Pending** | Chờ xác nhận |
| **1** | **Confirmed** | Đã xác nhận (đã cọc) |
| **2** | **CheckedIn** | Đã nhận phòng |
| **3** | **CheckedOut** | Đã trả phòng |
| **4** | **Cancelled** | Đã hủy |
| **5** | **NoShow** | Khách không đến |

### 5.2. Phòng (RoomStatus)
| Số ID | Tên Trạng Thái | Ý nghĩa |
|---|---|---|
| **0** | **VacantClean** | Trống & Sạch |
| **1** | **VacantDirty** | Trống & Bẩn |
| **2** | **Occupied** | Đang có khách ở |
| **3** | **Reserved** | Đã có người đặt |
| **4** | **OutOfOrder** | Hỏng hóc |
| **5** | **Maintenance**| Bảo trì |

### 5.3. Hóa Đơn (InvoiceStatus)
| Số ID | Tên Trạng Thái | Ý nghĩa |
|---|---|---|
| **0** | **Draft** | Nháp bảng kê |
| **1** | **Issued** | Đã xuất (chờ thu) |
| **2** | **Paid** | Đã thanh toán xong |
| **3** | **Cancelled**| Đã hủy bỏ |

### 5.4. Các ID khác
*   **LoyaltyTier**: `0` Đồng | `1` Bạc | `2` Vàng | `3` Bạch Kim | `4` Kim Cương | `5` Hoàng Gia
*   **StaffRole**: `0` Admin | `1` Manager | `2` Receptionist | `3` Housekeeper | `4` Accountant | `5` Technician | `6` RoomAttendant
*   **HmsTaskType**: `0` Cleaning (Dọn dẹp) | `1` Turndown | `2` Inspection | `3` Maintenance | `4` Repair | `5` Delivery (Giao đồ)

---

## 🧪 6. KỊCH BẢN KIỂM THỬ (TEST CASES)

1.  **Dùng app khách hàng:** Đặt 1 phòng bất kỳ (Mặc định 1 khách).
2.  **Dùng app lễ tân:** Check-in cho khách vừa đặt.
3.  **Dùng app khách hàng:** Vào Dashboard chọn "Gọi dịch vụ", gọi 2 lon Coca.
4.  **Dùng app phục vụ:** Nhận đơn, sau đó nhấn "Xác nhận đã giao". Kiểm tra xem kho có bị trừ 2 lon Coca không.
5.  **Dùng app lễ tân:** Check-out. Kiểm tra hóa đơn xem có tiền phòng + tiền 2 lon Coca chưa.
6.  **Hậu kiểm:** Sau khi thanh toán, vào "Hệ thống dọn dẹp" xem đã có task dọn phòng đó tự động sinh ra chưa.

---
*Thiết kế và duy trì bởi đội ngũ phát triển HMS Royal.*
