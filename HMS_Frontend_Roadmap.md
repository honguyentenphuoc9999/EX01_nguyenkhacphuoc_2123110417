# 🚀 Lộ trình Phát triển HMS Frontend (Vite + ReactJS)

Chào mừng bạn đến với giai đoạn nâng cấp UI/UX cho hệ thống Quản lý Khách sạn (HMS v3.0). Dưới đây là lộ trình chi tiết để xây dựng một Frontend chuyên nghiệp, bảo mật và thẩm mỹ.

---

## 🛠️ 1. Công nghệ sử dụng (Tech Stack)

*   **Core**: ReactJS (với Vite) - Tốc độ build cực nhanh.
*   **Styling**: Vanilla CSS (tùy biến tối đa) kết hợp với **Framer Motion** cho các hiệu ứng chuyển động mượt mà.
*   **State Management**: React Context hoặc Redux Toolkit (để quản lý Token và Auth).
*   **Networking**: Axios (để gọi API sang .NET 8 Backend).
*   **Icons**: Lucide React.
*   **Navigation**: React Router Dom.

---

## 🗺️ 2. Lộ trình Triển khai (Roadmap)

### Giai đoạn 1: Thiết lập & Đăng nhập (Authentication)
*   [ ] Khởi tạo dự án Vite + React.
*   [ ] Xây dựng Component `AuthContext` để lưu trữ mã JWT Token vào `localStorage`.
*   [ ] Thiết kế trang **Login chuyên nghiệp** với hiệu ứng Glassmorphism.
*   [ ] Cài đặt **Private Router** (Ngăn chặn người lạ vào trang Dashboard nếu chưa đăng nhập).

### Giai đoạn 2: Sơ đồ phòng trực quan (Room Status Board)
*   [ ] Thiết kế sidebar (Thanh công cụ bên trái) cho Admin/FrontDesk.
*   [ ] Xây dựng trang **Dashboard (Home)**: Hiển thị tổng số phòng trống, phòng đang ở, phòng bẩn dưới dạng Grid/Card sinh động. Các phòng được phân màu theo trạng thái (Xanh: Trống, Đỏ: Đang ở, Vàng: Chờ dọn).

### Giai đoạn 3: Quy trình Quản lý đặt phòng (Reservations UI)
*   [ ] Xây dựng form đăng ký khách hàng (kèm popup xác nhận).
*   [ ] Trang thông tin đặt phòng (Giao diện lịch hoặc danh sách lọc theo ngày).
*   [ ] Chức năng gán phòng (Select Room) trực quan.

### Giai đoạn 4: Quản lý chi tiêu (In-House & Folios)
*   [ ] Xây dựng trang **Folio Detail**: Nơi lễ tân có thể chọn thêm đồ uống, dịch vụ cực nhanh chỉ bằng 2-3 cú nhấn chuột.
*   [ ] Quy trình Check-out: Tự động hiển thị hóa đơn thu tiền (Invoice) và xác nhận thanh toán.

### Giai đoạn 5: Vận hành & Nhật ký (Housekeeping & Audit)
*   [ ] Giao diện danh sách Task dọn phòng cho nhân viên lao công (có thể xem trên điện thoại).
*   [ ] Trang xem nhật ký hệ thống (Audit Logs) dành riêng cho quản lý (Admin).

---

## 💻 3. Hướng dẫn thiết lập & Chạy Frontend

### Bước 1: Khởi tạo dự án
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
npx -y create-vite@latest HMS_Frontend --template react
# Chọn React -> JavaScript
```

### Bước 2: Cài đặt các thư viện cần thiết
```bash
cd HMS_Frontend
npm install axios react-router-dom lucide-react framer-motion
```

### Bước 3: Cấu hình API (file: src/api/axios.js)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7170/api', // Thay đúng cổng port của Backend bạn đang chạy
});

// Tự động đính kèm Token cho mọi yêu cầu
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Bước 4: Chạy dự án
```bash
npm run dev
```

---

## ✨ 4. Nguyên tắc thiết kế UI (Premium Look)

1.  **Nhất quán**: Sử dụng bảng màu sang trọng (Slate, Charcoal, Midnight Blue).
2.  **Phản hồi nhanh**: Mọi hành động (nhấn nút, chuyển trang) phải có micro-animations (Framer Motion).
3.  **Tối giản**: Không nhồi nhét quá nhiều thông tin trên một trang. Dùng các thẻ (Cards) và khoảng trắng (White-space) thông minh.
4.  **UX tiện lợi**: Phải ưu tiên quy trình làm việc nhanh nhất cho nhân viên khách sạn.

---

Bạn có muốn tôi bắt đầu xây dựng **Trang Đăng nhập (Login)** hoặc **Trang Sơ đồ phòng (Dashboard)** đầu tiên không?
