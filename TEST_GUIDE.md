# 🧪 Kịch bản Test Nghiệp vụ Toàn diện (HMS v4.0)

Hướng dẫn này giúp bạn test toàn bộ luồng vận hành từ khi setup hệ thống đến khi khách trả phòng. Hãy thực hiện theo đúng thứ tự các bước.

---

## 🔐 DANH SÁCH TÀI KHOẢN TEST (AUTO-SEEDED)

Hệ thống đã được nạp sẵn dữ liệu mẫu. Bạn có thể dùng các tài khoản sau để đăng nhập ngay lập tức:

| Vai trò | Username | Password | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin_phuoc` | `Admin@123` | Toàn quyền, quản lý nhân sự, cấu hình hệ thống. |
| **Quản lý** | `manager` | `Staff@123` | Quản lý kho phòng, báo cáo kinh doanh. |
| **Lễ tân** | `lan` | `Staff@123` | Đặt phòng, Check-in/out, thu tiền khách. |
| **Dọn phòng** | `nam` | `Staff@123` | Cập nhật trạng thái dọn dẹp, hoàn thành task. |
| **Kế toán** | `ke` | `Staff@123` | Quản lý hóa đơn, doanh thu, tài chính. |
| **Kỹ thuật** | `ky` | `Staff@123` | Quản lý bảo trì, sửa chữa phòng. |

---

## 🏬 HỆ THỐNG DỮ LIỆU MẪU (AUTO-SEEDED)

Hệ thống đã cấu hình sẵn các thông tin nền tảng để bạn có thể test đặt phòng ngay:

### 1. Hạng phòng (Room Types) 
*   **Standard Room**: 500,000 VNĐ (Phòng tiêu chuẩn).
*   **Deluxe Room**: 850,000 VNĐ (Phòng sang trọng).
*   **Executive Suite**: 1,500,000 VNĐ (Phòng tổng thống).

### 2. Danh sách Phòng (Rooms)
*   **Tầng 1**: Phòng `101`, `102` (Hạng Standard).
*   **Tầng 2**: Phòng `201` (Hạng Deluxe - Trống Sạch), `202` (Hạng Deluxe - Trống Bẩn).

---

## 🏗️ GIAI ĐOẠN 1: HỆ THỐNG & BẢO MẬT (Setup)

### Bước 1.1: Khởi tạo dữ liệu mẫu (Auto-Seed)
*   **Thực hiện:** Bạn không cần đăng ký thủ công. Khi chạy dự án Backend, hệ thống sẽ tự động kiểm tra và thêm các tài khoản trên.
*   **Lưu ý:** Nếu muốn đăng ký thêm tài khoản mới, hãy dùng API `POST /api/Account/register`.

### Bước 1.2: Đăng nhập (Login)
*   **API:** `POST /api/Account/login`
*   **Thao tác:** Sử dụng tài khoản `admin_phuoc` / `Admin@123` để có toàn quyền kiểm tra.
*   **Swagger:** Sau khi Login thành công, copy chuỗi `token`, nhấn nút **Authorize** trên đầu Swagger và dán vào theo cú pháp: `Bearer <token>`

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

### Bước 3.1: Đăng ký thông tin Khách (Giai đoạn Booking)
*   **Mục tiêu:** Thu thập thông tin cơ bản để giữ chỗ (họ tên, SĐT).
*   **API:** `POST /api/Guests`
*   **JSON Body:**
```json
{
  "fullName": "Nguyễn Khắc Phước",
  "phone": "0987654321",
  "idNumber": "CHƯA_CẦN_GHI_LÚC_ĐẶT", 
  "email": "guest.phuoc@gmail.com"
}
```
*   **Lưu ý:** Giai đoạn đặt chỗ chỉ cần thông tin liên lạc. Hệ thống sẽ mã hóa dữ liệu ngay khi lưu.

---

## 📅 GIAI ĐOẠN 4: ĐẶT PHÒNG (Reservations)

### Bước 4.1: Tạo yêu cầu Đặt phòng mới
*   **API:** `POST /api/Reservations`
*   **Thực hiện:** Ghi nhận tiền cọc (Deposit) đối với các đặt phòng cao cấp hoặc qua ứng dụng để đảm bảo giữ phòng.

---

## 🚀 GIAI ĐOẠN 5: NHẬN PHÒNG & KHAI BÁO (Check-in)

### Bước 5.1: Làm thủ tục Nhận phòng (Check-in)
*   **Yêu cầu bắt buộc:** Khách xuất trình **CCCD hoặc Hộ chiếu** bản gốc. 
*   **Thao tác:** Lễ tân cập nhật `idNumber` chính xác vào hồ sơ khách hàng.
*   **Mục đích:** Khai báo lưu trú cho Cơ quan Công an theo **Luật Cư trú** (qua hệ thống trực tuyến).

### Bước 5.2: Quản lý Hồ sơ & Trách nhiệm pháp lý
*   **Nội bộ:** Lưu trữ để đối chiếu thanh toán và trả đồ thất lạc.
*   **Pháp luật:** Cung cấp thông tin cho cơ quan chức năng khi có yêu cầu điều tra hoặc vi phạm trật tự trị an.

---

## ⚖️ QUY ĐỊNH AN NINH & BẢO MẬT

1.  **Giấy tờ gốc:** Lễ tân chỉ ghi chép/quét ảnh CCCD và phải trả lại bản gốc ngay cho khách sau khi làm xong thủ tục (trừ khi có thỏa thuận riêng).
2.  **Thông báo lưu trú:** Mọi thông tin nhận phòng phải được gửi đến hệ thống quản lý cư trú trong vòng 24h.
3.  **Bảo mật dữ liệu:** Hệ thống mã hóa thông tin cá nhân khách hàng, tuyệt đối không sử dụng vào mục đích thương mại khác.

---

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
