// src/models/index.js
// Prisma không cần model class riêng — file này export
// các "include" fragments tái sử dụng và helper types.

const INCLUDE_SINH_VIEN = {
  ChuyenNganh: true,
  TaiKhoan: {
    select: { id_nguoi_dung: true, ten_dang_nhap: true, trang_thai: true },
  },
};

const INCLUDE_LOP_HOC_PHAN = {
  MonHoc: true,
  GiangVien: true,
  HocKy: true,
  LichHocChiTiet: {
    orderBy: [{ thu_trong_tuan: "asc" }, { gio_bat_dau: "asc" }],
  },
};

const INCLUDE_DANG_KY_SINH_VIEN = {
  LopHocPhan: {
    include: {
      MonHoc: true,
      HocKy: true,
      GiangVien: true,
      LichHocChiTiet: true,
    },
  },
};

const INCLUDE_DANG_KY_ADMIN = {
  SinhVien: { include: { ChuyenNganh: true } },
  LopHocPhan: { include: { MonHoc: true, HocKy: true } },
};

module.exports = {
  INCLUDE_SINH_VIEN,
  INCLUDE_LOP_HOC_PHAN,
  INCLUDE_DANG_KY_SINH_VIEN,
  INCLUDE_DANG_KY_ADMIN,
};
