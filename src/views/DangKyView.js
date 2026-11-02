// src/views/DangKyView.js

const { formatSinhVien } = require("./SinhVienView");
const { formatLopHocPhan } = require("./LopHocPhanView");

const formatDangKy = (dk) => ({
  id_dang_ky: dk.id_dang_ky,
  ma_sinh_vien: dk.ma_sinh_vien,
  ma_lop_hoc: dk.ma_lop_hoc,
  trang_thai: dk.trang_thai,
  ghi_chu_tu_choi: dk.ghi_chu_tu_choi ?? null,
  ngay_dang_ky: dk.ngay_dang_ky,
  sinh_vien: dk.SinhVien ? formatSinhVien(dk.SinhVien) : null,
  lop_hoc_phan: dk.LopHocPhan ? formatLopHocPhan(dk.LopHocPhan) : null,
});

const formatList = (list) => list.map(formatDangKy);

module.exports = { formatDangKy, formatList };
