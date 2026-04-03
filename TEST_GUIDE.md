# 🧪 Kịch bản Test Nghiệp vụ Toàn diện (HMS v3.0)

Hướng dẫn này giúp bạn test toàn bộ luồng vận hành từ khi setup hệ thống đến khi khách trả phòng. Hãy thực hiện theo đúng thứ tự các bước.

---

## 🏗️ GIAI ĐOẠN 1: HỆ THỐNG & BẢO MẬT (Setup)

### Bước 1.1: Đăng ký tài khoản (Register)
*   **API:** `POST /api/Account/register`
*   **JSON Body:**

**Tạo Admin:**
```json
{ "username": "admin_royal", "email": "admin@hms.com", "password": "Password123!", "role": "Admin" }
```

**Tạo Lễ tân (FrontDesk):**
```json
{ "username": "letan_lan", "email": "lan@hms.com", "password": "Password123!", "role": "FrontDesk" }
```

**Tạo Dọn phòng (Housekeeping):**
```json
{ "username": "ve_sinh_nam", "email": "nam@hms.com", "password": "Password123!", "role": "Housekeeping" }
```

### Bước 1.2: Đăng nhập (Login)
*   **API:** `POST /api/Account/login`
*   **JSON Body:** (Lấy username/password vừa tạo)
```json
{
  "username": "admin_phuoc",
  "password": "Password123!"
}
```
*   **Thao tác:** Copy chuỗi `token` trong kết quả, dán vào nút **Authorize** trên đầu Swagger theo cú pháp: `Bearer <token>`

---

## 🏨 GIAI ĐOẠN 2: CẤU HÌNH KHÁCH SẠN (Master Data)

### Bước 2.1: Tạo Loại phòng (RoomType)
*   **API:** `POST /api/RoomTypes`
*   **JSON Body:**
```json
{
  "typeName": "Phòng VIP Deluxe",
  "description": "Phòng hướng biển, giường đôi",
  "basePrice": 1500000,
  "maxAdults": 2,
  "maxChildren": 1
}
```
*   **Lưu ý:** Copy `roomTypeId` từ kết quả để dùng cho bước tiếp theo.

### Bước 2.2: Tạo Phòng (Room)
*   **API:** `POST /api/Rooms`
*   **JSON Body:**
```json
{
  "roomNumber": "101",
  "floor": 1,
  "roomTypeId": "DÁN_ID_LOAI_PHONG_O_DAY",
  "basePrice": 1500000
}
```
*   **Lưu ý:** Copy `roomId` từ kết quả.

---

## 👤 GIAI ĐOẠN 3: TIẾP NHẬN KHÁCH HÀNG (Guests)

### Bước 3.1: Đăng ký thông tin Khách
*   **API:** `POST /api/Guests`
*   **JSON Body:**
```json
{
  "fullName": "Nguyễn Khắc Phước",
  "idNumber": "2123110417",
  "email": "guest.phuoc@gmail.com",
  "phone": "0987654321"
}
```
*   **Lưu ý:** Copy `guestId` từ kết quả. (Hệ thống sẽ tự động mã hóa `idNumber` dưới DB).

---

## 📅 GIAI ĐOẠN 4: ĐẶT PHÒNG & CHECK-IN (Reservations)

### Bước 4.1: Tạo yêu cầu Đặt phòng
*   **API:** `POST /api/Reservations`
*   **JSON Body:**
```json
{
  "guestId": "DÁN_ID_KHACH_HANG_O_DAY",
  "checkInDate": "2026-04-10T14:00:00",
  "checkOutDate": "2026-04-12T12:00:00",
  "channel": 0,
  "specialRequests": "Yêu cầu phòng yên tĩnh"
}
```
*   **Lưu ý:** Copy `reservationId` từ kết quả.

### Bước 4.2: Gán phòng vật lý cho Booking
*   **API:** `POST /api/Reservations/{id}/assign-room/{roomId}`
*   **Thành phần URL:**
    *   `id`: Là `reservationId` ở bước 4.1.
    *   `roomId`: Là `roomId` ở bước 2.2.

---

## 🚀 GIAI ĐOẠN 5: CHECK-IN & SỬ DỤNG DỊCH VỤ (In-House)

### Bước 5.1: Thực hiện Check-in
*   **API:** `POST /api/Reservations/{id}/check-in` (với `id` là `reservationId`)
*   **Kết quả:** Sẽ trả về thành công kèm mã **Folio ID** (Copy mã này để dùng ở Bước 5.3).
*   **Tính năng:** Kiểm tra log để thấy hệ thống tự động sinh phí phụ thu nếu check-in sớm.

### Bước 5.2: Lấy mã Hồ sơ chi tiêu (FolioId)
*   **API:** `GET /api/Folios`
*   **Cách làm:** Nhấn **Execute**, tìm đúng dòng có `reservationId` trùng với mã đặt phòng bạn đang test. Copy giá trị của trường **`folioId`** tương ứng.

### Bước 5.3: Ghi nhận chi phí Minibar/Dịch vụ (Folio Charges)
*   **API:** `POST /api/FolioCharges`
*   **JSON Body:**
```json
{
  "folioId": "DÁN_ID_FOLIO_O_DAY",
  "chargeType": 1,
  "description": "Nước suối Lavie",
  "quantity": 2,
  "unitPrice": 20000,
  "chargedBy": "Nhân viên dọn phòng"
}
```

---

## 💰 GIAI ĐOẠN 6: TRẢ PHÒNG & THANH TOÁN (Check-out)

### Bước 6.1: Thực hiện Check-out (Tự sinh Hóa đơn & Point)
*   **API:** `POST /api/Reservations/{id}/check-out`
*   **Kiểm tra:** Sau bước này, gọi `GET /api/Invoices` để thấy hóa đơn tự động có thuế VAT 10%.

### Bước 6.2: Ghi nhận Thanh toán
*   **API:** `POST /api/Payments`
*   **JSON Body:**
```json
{
  "folioId": "DÁN_ID_FOLIO_O_DAY",
  "amount": 3000000, 
  "paymentMethod": 1,
  "referenceCode": "CARD_PAY_001"
}
```

---

## 🧼 GIAI ĐOẠN 7: VẬN HÀNH SAU CHECK-OUT (Operations)

### Bước 7.1: Nhân viên hoàn thành dọn phòng
*   **API:** `GET /api/HousekeepingTasks` để lấy ID task vừa sinh tự động.
*   **API:** `PUT /api/HousekeepingTasks/{id}` (Với {id} là taskId vừa lấy)
*   **JSON Body (Yêu cầu đầy đủ các trường để tránh lỗi 400):**
```json
{
  "taskId": "DÁN_ID_TASK_VỪA_COPY_VÀO_ĐÂY",
  "roomId": "DÁN_ID_ROOM_CỦA_PHÒNG_VÀO_ĐÂY",
  "taskType": 0,
  "status": 2,
  "priority": 1,
  "scheduledDate": "2026-04-03T15:00:00",
  "completedAt": "2026-04-03T21:00:00",
  "notes": "Đã dọn sạch và thay ga giường mới"
}
```
*   **Mẹo:** Cách nhanh nhất là Copy toàn bộ JSON trả về từ lệnh GET ở bước trên, sau đó chỉ cần sửa `status` thành **2** và thêm `completedAt`.

---

## 📊 GIAI ĐOẠN 8: HẬU KIỂM (Audit Trail)
*   **API:** `GET /api/AuditLogs`
*   **Mục tiêu:** Kiểm tra lại tất cả các thao tác trên (Create/Update) đã được lưu lịch sử đầy đủ.
