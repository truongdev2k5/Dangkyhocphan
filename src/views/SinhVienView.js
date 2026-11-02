// src/views/SinhVienView.js
const formatSinhVien = (sv) => ({
  ma_sinh_vien: sv.ma_sinh_vien,
  id_nguoi_dung: sv.id_nguoi_dung ?? null,
  ho_ten: sv.ho_ten,
  email: sv.email,
  so_dien_thoai: sv.so_dien_thoai,
  chuyen_nganh: sv.ChuyenNganh
    ? {
        ma: sv.ChuyenNganh.ma_chuyen_nganh,
        ten: sv.ChuyenNganh.ten_chuyen_nganh,
      }
    : null,
  tai_khoan: sv.TaiKhoan
    ? {
        id_nguoi_dung: sv.TaiKhoan.id_nguoi_dung,
        ten_dang_nhap: sv.TaiKhoan.ten_dang_nhap,
        trang_thai: sv.TaiKhoan.trang_thai,
      }
    : null,
  ...(sv.ten_dang_nhap && { ten_dang_nhap: sv.ten_dang_nhap }),
  ...(sv.mat_khau_mac_dinh && { mat_khau_mac_dinh: sv.mat_khau_mac_dinh }),
  ...(sv.ghi_chu && { ghi_chu: sv.ghi_chu }),
});

const formatList = (list) => list.map(formatSinhVien);

module.exports = { formatSinhVien, formatList };
