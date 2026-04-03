
1. **Chuẩn hóa DTO:** 
   - Tách biệt `CreateDto`, `UpdateDto`, `ResponseDto` (Xóa bỏ việc dùng Entity trực tiếp trong Controller).
   - Loại bỏ các trường Audit (`CreatedAt`, `CreatedBy`,...) và `IsDeleted` khỏi dữ liệu trả về cho client.
2. **Input Validation (NFR-15):** 
   - Áp dụng các ràng buộc dữ liệu: `CheckInDate` < `CheckOutDate`, `BasePrice` > 0, `FolioBalance` >= 0.

---

## Giai đoạn 3: Nghiệp vụ cốt lõi (Business Rules Logic)
*Mục tiêu: Cài đặt các quy tắc kinh doanh phức tạp từ Mục 6 của BRD.*

1. **Logic Phụ thu (BR-02, BR-03):** 
   - Implement logic vào `ReservationService`: 
     - Check-in 06:00-09:00: Phụ thu 50%.
     - Check-out 12:00-15:00: Phụ thu 30%.
     - Check-out sau 18:00: Phụ thu 100%.
2. **Chính sách Hủy phòng (BR-04):** 
   - Kiểm tra thời hạn hủy phòng (48h/24h) để tự động tính phí phạt/hoàn cọc.
3. **Tính toán Folio & Tài chính (BR-15, BR-16):** 
   - Tự động hóa việc cộng dồn `TotalCharges` khi có `FolioCharge` mới.
   - Tự động tính thuế VAT 10% khi xuất `Invoice`.
4. **Cơ chế khóa phòng (BR-01):** 
   - Chỉ cho phép gán số phòng vật lý khi khách thực hiện Check-in.

---

## Giai đoạn 4: Tích hợp & Tự động hóa (Integration)
*Mục tiêu: Kết nối các module để hệ thống chạy trơn tru.*

1. **Module dọn phòng (Housekeeping Interface):** 
   - Khi Check-out xong, tự động đổi trạng thái phòng sang `VacantDirty` và bắn task dọn phòng (BR-13/UC-08-09).
2. **Loyalty & Membership (BR-13):** 
   - Cộng điểm Loyalty sau khi thanh toán thành công (1 VNĐ = 1 điểm).
   - Tự động thăng hạng khách hàng (Silver/Gold/Platinum) dựa trên số điểm tích lũy.
3. **Cảnh báo tồn kho (Logistics UC-23):** 
   - Khi xuất kho minibar, kiểm tra `MinimumStock` để gửi thông báo cảnh báo.

---

## Giai đoạn 5: Tinh chỉnh & Dọn dẹp (Refactoring)
*Mục tiêu: Xóa bỏ mã nguồn thừa, đảm bảo dự án sạch sẽ.*

1. **Xóa Boilerplate:** Loại bỏ `WeatherForecast.cs` và các mã nguồn mẫu của VS Code.
2. **Đồng bộ hóa Repository:** Chuyển các Controller còn lại (trong `ExtraFeaturesController.cs`) sang sử dụng `UnitOfWork`.
3. **Audit Trail (BR-17):** Đảm bảo mọi thao tác quan trọng đều được ghi vào bảng `AuditLogs`.

---

**QUY TẮC THỰC HIỆN:** 
- Tuyệt đối không làm Bước 3 khi chưa xong Bước 1 và 2 (Để đảm bảo logic nghiệp vụ được bảo vệ và dữ liệu an toàn).
- Luôn kiểm tra tính nhất quán với tệp `AppDbContext.cs` đã có.
