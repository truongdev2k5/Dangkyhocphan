# 📚 Hệ Thống Đăng Ký Học Phần — REST API

**Stack:** Node.js · Express · **Prisma ORM** · MySQL · JWT

---

## ⚡ Cài đặt & Chạy nhanh

```bash
# 1. Clone repository
git clone <repository-url>
cd dang_ky_hoc_phan_prisma

# 2. Cài dependencies
npm install

# 3. Cấu hình môi trường
# Tạo file .env với DATABASE_URL và JWT_SECRET
# DATABASE_URL="mysql://user:password@localhost:3306/dang_ky_hoc_phan"
# JWT_SECRET="your-secret-key"

# 4. Chạy Prisma migrations
npx prisma migrate deploy

# 5. Sinh Prisma Client
npx prisma generate

# 6. (Tuỳ chọn) Seed dữ liệu mẫu
node prisma/seed.js

# 7. Khởi động server
npm run dev        # development (nodemon)
npm start          # production
```

> **Prisma Studio** (GUI quản lý DB): `npx prisma studio`

---

## 🗂️ Cấu trúc dự án

```
dang_ky_hoc_phan_api/
├── prisma/
│   ├── schema.prisma          ← Định nghĩa models & relations
│   └── seed.js                ← Dữ liệu mẫu
├── src/
│   ├── config/
│   │   └── database.js        ← Prisma Client singleton
│   ├── models/
│   │   └── index.js           ← Include fragments tái sử dụng
│   ├── services/              ← Business logic
│   │   ├── AuthService.js
│   │   ├── SinhVienService.js
│   │   ├── GiangVienService.js
│   │   ├── LopHocPhanService.js
│   │   ├── DangKyService.js
│   │   └── LichHocService.js
│   ├── controllers/           ← Xử lý HTTP request/response
│   │   ├── AuthController.js
│   │   ├── SinhVienController.js
│   │   ├── GiangVienController.js
│   │   ├── LopHocPhanController.js
│   │   ├── DangKyController.js
│   │   └── LichHocController.js
│   ├── views/                 ← Format response
│   │   ├── SinhVienView.js
│   │   ├── LopHocPhanView.js
│   │   └── LichHocView.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sinhVienRoutes.js
│   │   ├── giangVienRoutes.js
│   │   ├── lopHocPhanRoutes.js
│   │   ├── dangKyRoutes.js
│   │   └── lichHocRoutes.js
│   ├── middlewares/
│   │   └── errorHandler.js    ← authenticate, authorize, errorHandler
│   └── app.js                 ← Entry point
├── .env
└── package.json
```

---

## 🔐 Xác thực

Tất cả endpoint (trừ `POST /auth/login`) yêu cầu header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📡 API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint                    | Mô tả                        | Quyền        |
| ------ | --------------------------- | ---------------------------- | ------------ |
| POST   | `/login`                    | Đăng nhập → nhận JWT         | Public       |
| POST   | `/register`                 | Tạo tài khoản mới            | admin        |
| GET    | `/me`                       | Thông tin tài khoản hiện tại | Đã đăng nhập |
| PUT    | `/doi-mat-khau`             | Đổi mật khẩu                 | Đã đăng nhập |
| PATCH  | `/tai-khoan/:id/trang-thai` | Khoá / Mở tài khoản          | admin        |

**POST /login**

```json
{ "ten_dang_nhap": "sv001", "mat_khau": "Sv001@123" }
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "nguoi_dung": {
      "id_nguoi_dung": 2,
      "vai_tro": "sinh_vien",
      "ma_sinh_vien": "SV001"
    }
  }
}
```

---

### Sinh Viên — `/api/v1/sinh-vien`

| Method | Endpoint | Mô tả               | Quyền     |
| ------ | -------- | ------------------- | --------- |
| GET    | `/me`    | Xem hồ sơ bản thân  | sinh_vien |
| GET    | `/`      | Danh sách sinh viên | admin     |
| GET    | `/:ma`   | Chi tiết sinh viên  | admin     |
| POST   | `/`      | Thêm sinh viên      | admin     |
| PUT    | `/:ma`   | Cập nhật sinh viên  | admin     |
| DELETE | `/:ma`   | Xóa sinh viên       | admin     |

Query GET `/`: `?ma_chuyen_nganh=CNTT&search=Nguyen&page=1&limit=10`

Response GET `/`:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

### Giảng Viên — `/api/v1/giang-vien`

| Method | Endpoint | Mô tả           | Quyền        |
| ------ | -------- | --------------- | ------------ |
| GET    | `/`      | Danh sách       | Đã đăng nhập |
| GET    | `/:ma`   | Chi tiết        | Đã đăng nhập |
| POST   | `/`      | Thêm giảng viên | admin        |
| PUT    | `/:ma`   | Cập nhật        | admin        |
| DELETE | `/:ma`   | Xóa             | admin        |

Query GET `/`: `?khoa=CNTT&search=Nguyen&page=1&limit=10`

---

### Lớp Học Phần — `/api/v1/lop-hoc-phan`

| Method | Endpoint                     | Mô tả                       | Quyền        |
| ------ | ---------------------------- | --------------------------- | ------------ |
| GET    | `/`                          | Danh sách lớp               | Đã đăng nhập |
| GET    | `/:ma`                       | Chi tiết lớp                | Đã đăng nhập |
| POST   | `/`                          | Tạo lớp học phần            | admin        |
| PUT    | `/:ma`                       | Cập nhật lớp                | admin        |
| DELETE | `/:ma`                       | Xóa lớp                     | admin        |
| PUT    | `/hoc-ky/:id_hoc_ky/tin-chi` | Đặt giới hạn tín chỉ học kỳ | admin        |

Query GET `/`: `?id_hoc_ky=1&ma_mon_hoc=MH001&con_cho=true&page=1&limit=10`

---

### Đăng Ký — `/api/v1/dang-ky`

| Method | Endpoint       | Mô tả                | Quyền     |
| ------ | -------------- | -------------------- | --------- |
| POST   | `/`            | Đăng ký học phần     | sinh_vien |
| DELETE | `/:id`         | Hủy đăng ký          | sinh_vien |
| GET    | `/cua-toi`     | Xem đăng ký của mình | sinh_vien |
| GET    | `/`            | Tất cả đăng ký       | admin     |
| GET    | `/lop/:ma_lop` | Đăng ký theo lớp     | admin     |
| PATCH  | `/:id/duyet`   | Duyệt đăng ký        | admin     |
| PATCH  | `/:id/tu-choi` | Từ chối đăng ký      | admin     |
| GET    | `/lich-su`     | Lịch sử đăng ký      | admin     |

Query GET `/`: `?trang_thai=cho_duyet&page=1&limit=10`

---

### Lịch Học — `/api/v1/lich-hoc`

| Method | Endpoint            | Mô tả                  | Quyền     |
| ------ | ------------------- | ---------------------- | --------- |
| GET    | `/cua-toi`          | Lịch học của sinh viên | sinh_vien |
| GET    | `/kiem-tra/:ma_lop` | Kiểm tra trùng lịch    | sinh_vien |
| POST   | `/lop/:ma_lop`      | Thêm buổi học          | admin     |
| DELETE | `/:id`              | Xóa buổi học           | admin     |

---

### Học Kỳ — `/api/v1/hoc-ky`

| Method | Endpoint | Mô tả      | Quyền        |
| ------ | -------- | ---------- | ------------ |
| GET    | `/`      | Danh sách  | Đã đăng nhập |
| GET    | `/:id`   | Chi tiết   | Đã đăng nhập |
| POST   | `/`      | Tạo học kỳ | admin        |
| PUT    | `/:id`   | Cập nhật   | admin        |
| DELETE | `/:id`   | Xóa        | admin        |

Query GET `/`: `?search=2024&page=1&limit=10`

---

### Chuyên Ngành — `/api/v1/chuyen-nganh`

| Method | Endpoint | Mô tả            | Quyền |
| ------ | -------- | ---------------- | ----- |
| GET    | `/`      | Danh sách        | admin |
| GET    | `/:ma`   | Chi tiết         | admin |
| POST   | `/`      | Tạo chuyên ngành | admin |
| PUT    | `/:ma`   | Cập nhật         | admin |
| DELETE | `/:ma`   | Xóa              | admin |

Query GET `/`: `?search=CNTT&page=1&limit=10`

---

### Môn Học — `/api/v1/mon-hoc`

| Method | Endpoint | Mô tả       | Quyền        |
| ------ | -------- | ----------- | ------------ |
| GET    | `/`      | Danh sách   | Đã đăng nhập |
| GET    | `/:ma`   | Chi tiết    | Đã đăng nhập |
| POST   | `/`      | Tạo môn học | admin        |
| PUT    | `/:ma`   | Cập nhật    | admin        |
| DELETE | `/:ma`   | Xóa         | admin        |

Query GET `/`: `?search=Toan&page=1&limit=10`

**GET /cua-toi** — Query: `?id_hoc_ky=1`

**GET /kiem-tra/:ma_lop** — Response:

```json
{
  "success": true,
  "trung_lich": true,
  "chi_tiet": [
    {
      "ma_lop_dang_hoc": "LHP001",
      "ten_mon_dang_hoc": "Lập trình cơ bản",
      "thu": 2,
      "gio_xung_dot": "08:00:00 – 09:30:00"
    }
  ]
}
```

**POST /lop/:ma_lop** — Body:

```json
{ "thu_trong_tuan": 2, "gio_bat_dau": "08:00:00", "gio_ket_thuc": "09:30:00" }
```

---

## 🔄 Luồng nghiệp vụ đăng ký

```
Sinh viên POST /dang-ky  { ma_lop_hoc }
         │
         ├─ Học kỳ đang mở đăng ký?
         ├─ Lớp tồn tại?
         ├─ Chưa đăng ký trùng?
         ├─ Giới hạn tín chỉ OK?
         ├─ Không trùng lịch?
         │
         └─► Tạo đăng ký  trang_thai = "cho_duyet"
                  │
         Admin PATCH /:id/duyet ──► "da_duyet" + giảm so_luong_con_trong
         Admin PATCH /:id/tu-choi ─► "tu_choi" + ghi chú
                  │
         Sinh viên DELETE /:id ────► "da_huy" + hoàn lại chỗ (nếu đã duyệt)
```

---

## 📋 Trạng thái đăng ký

| Trạng thái  | Ý nghĩa                     |
| ----------- | --------------------------- |
| `cho_duyet` | Chờ admin xét duyệt         |
| `da_duyet`  | Đã duyệt — chiếm 1 suất lớp |
| `tu_choi`   | Admin từ chối               |
| `da_huy`    | Sinh viên tự hủy            |

---

## ⚙️ Biến môi trường

| Biến             | Mô tả                    | Ví dụ                                 |
| ---------------- | ------------------------ | ------------------------------------- |
| `DATABASE_URL`   | Prisma connection string | `mysql://root:pass@localhost:3306/db` |
| `JWT_SECRET`     | Khóa bí mật ký JWT       | `my_super_secret_key`                 |
| `JWT_EXPIRES_IN` | Thời hạn token           | `24h`                                 |
| `PORT`           | Cổng server              | `3000`                                |

---

## 🛡️ Tính năng bảo mật & tính toàn vẹn

- **Prisma transactions** (`$transaction`) đảm bảo atomic cho duyệt/hủy đăng ký
- **Prisma error codes** (P2002, P2025) xử lý lỗi DB chuẩn
- **bcryptjs** hash mật khẩu (salt rounds = 10)
- **JWT** với expiry, kiểm tra trong middleware
- Kiểm tra trùng lịch trước khi tạo đăng ký
- Kiểm tra giới hạn tín chỉ theo cấu hình từng học kỳ
- Lịch sử trạng thái đăng ký ghi vào `lich_su_dang_ky`
