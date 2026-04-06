# 🛠️ Lộ trình Cập nhật Hệ thống HMS theo BRD v3.0

Tài liệu này xác định các khoảng cách (gap) giữa mã nguồn hiện tại và **Tài liệu Nghiệp vụ v3.0**, đồng thời thiết lập lộ trình nâng cấp để đạt trạng thái "Chính thức".

---

## 📅 Tổng quan Lộ trình (Phasing)

Hệ thống sẽ được nâng cấp qua 4 giai đoạn để đảm bảo tính ổn định:

1.  **Giai đoạn 1: Nền tảng Kỹ thuật (Foundation)** - Chuyển đổi PK sang Guid, Soft Delete toàn hệ thống, Audit Fields tự động.
2.  **Giai đoạn 2: Lõi Tài chính (Core Finance)** - Tự động hóa Folio Balance, Invoice VAT và tích hợp thanh toán.
3.  **Giai đoạn 3: Vận hành Chi tiết (Operations)** - MinibarLog, Maintenance Ticket, Lost & Found.
4.  **Giai đoạn 4: Hệ sinh thái (Ecosystem)** - Seasonal Pricing, Loyalty Redemption nâng cao.

---

## 🔍 Chi tiết các hạng mục thay đổi

### 1. Nâng cấp hạ tầng EF Core (NFR-10 đến NFR-15)
*   **Thực trạng:** Hiện tại một số bảng vẫn dùng `int` làm Khóa chính (PK).
*   **Thay đổi:** Chuyển toàn bộ PK sang `Guid` để hỗ trợ mở rộng và bảo mật (BR-8.1).
*   **Hành động:** 
    *   Cập nhật `AppDbContext.cs` để ghi đè `SaveChanges()` tự động điền `CreatedAt`, `CreatedBy`.
    *   Thêm `Global Query Filter` để tự động lọc `IsDeleted = false`.
*   **File ảnh hưởng:** `Models/*.cs`, `Data/AppDbContext.cs`.

### 2. Phân hệ Lễ tân & Đặt phòng (UC-01 đến UC-07)
*   **Thực trạng:** Việc gán phòng đang thực hiện ngay khi đặt.
*   **Thay đổi (BR-01):** Không khóa cứng phòng vật lý khi đặt (chỉ trừ tồn kho hạng phòng). Chỉ gán phòng khi Check-in.
*   **Hành động:** 
    *   Tách thực thể `Reservation` và `ReservationRoom`.
    *   Cập nhật Logic Check-in: Quét CCCD và mã hóa lưu trữ (BR-05).
*   **File ảnh hưởng:** `ReservationsController.cs`, `DbSeeder.cs`.

### 3. Phân hệ Tài chính "Tự động hóa" (BR-15, BR-16)
*   **Thực trạng:** Các con số Tổng tiền đang được tính thủ công hoặc gán cứng.
*   **Thay đổi:** 
    *   `Folio.Balance` phải tự động nhảy số khi thêm `FolioCharge` hoặc `Payment`.
    *   `Invoice.TotalAmount` phải tự động tính VAT 10%.
*   **Hành động:** Viết Trigger code trong Controller hoặc Domain Service để đảm bảo dữ liệu tài chính luôn khớp.
*   **File ảnh hưởng:** `FolioChargesController.cs`, `InvoicesController.cs`.

### 4. Bổ sung các bảng "Vận hành" còn trống (Nhóm 8.3)
*   **Thực trạng:** Các bảng `MinibarLog`, `LostAndFound` đang ở dạng sơ khai hoặc chưa có dữ liệu/UI.
*   **Thay đổi:** Triển khai quy tắc BR-11 (Minibar chỉ đẩy vào Folio 1 lần duy nhất tại lúc Check-out).
*   **Hành động:** Tạo bảng `MinibarLog` và logic đối soát tồn kho với hệ thống Logistics.
*   **File ảnh hưởng:** `ExtendedModels.cs`, `HousekeepingController.cs`.

---

## 📈 Bảng đối chiếu Từng File

| File hiện có | Trạng thái | Nội dung cần Sửa/Thêm | Lý do |
| :--- | :--- | :--- | :--- |
| `AppDbContext.cs` | **Sửa** | Thêm Global Filter, Override SaveChanges | Tuân thủ NFR-12, BR-17 |
| `ExtendedModels.cs` | **Sửa/Thêm** | Chuyển PK sang Guid, thêm RowVersion | Tuân thủ BR-8.1, NFR-13 |
| `GuestPortalController.cs` | **Giữ** | Cập nhật logic tìm kiếm Guid | Tương thích hạ tầng mới |
| `Guests.jsx` (Frontend) | **Sửa** | Thêm form quét CCCD và Upload | Tuân thủ UC-06, BR-05 |
| `FoliosController.cs` | **Thêm mới** | Logic tính Balance real-time | Tuân thủ BR-15 |

---

## 🚀 Bước tiếp theo tôi sẽ làm gì?

Tôi sẽ bắt đầu từ **Giai đoạn 1**: Cấu trúc lại hạ tầng `ExtendedModels.cs` để tất cả các thực thể (Entity) đều có Khóa chính là **Guid**, có **Soft Delete** và **Audit Fields**. Đây là "xương sống" để các tính năng sau chạy chuẩn xác.

_Lưu ý: Việc này sẽ đòi hỏi xóa Database cũ để chạy lại Migration mới hoàn toàn nhằm đảm bảo tính đồng nhất._
