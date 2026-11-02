// src/views/LopHocPhanView.js
const { getTenThu } = require("../utils/helpers");

const formatLichHoc = (s) => ({
  id: s.id_lich_hoc,
  thu: getTenThu(s.thu_trong_tuan),
  thu_trong_tuan: s.thu_trong_tuan,
  gio_bat_dau: s.gio_bat_dau,
  gio_ket_thuc: s.gio_ket_thuc,
});

const formatLopHocPhan = (lop) => ({
  ma_lop_hoc: lop.ma_lop_hoc,
  phong_hoc: lop.phong_hoc,
  so_luong_toi_da: lop.so_luong_toi_da,
  so_luong_con_trong: lop.so_luong_con_trong,
  ngay_bat_dau: lop.ngay_bat_dau,
  ngay_ket_thuc: lop.ngay_ket_thuc,
  mon_hoc: lop.MonHoc
    ? {
        ma: lop.MonHoc.ma_mon_hoc,
        ten: lop.MonHoc.ten_mon_hoc,
        tin_chi: lop.MonHoc.so_tin_chi,
      }
    : null,
  giang_vien: lop.GiangVien
    ? {
        ma: lop.GiangVien.ma_giang_vien,
        ten: lop.GiangVien.ho_ten,
        khoa: lop.GiangVien.khoa,
      }
    : null,
  hoc_ky: lop.HocKy
    ? {
        id: lop.HocKy.id_hoc_ky,
        ten: lop.HocKy.ten_hoc_ky,
        nam_hoc: lop.HocKy.nam_hoc,
      }
    : null,
  lich_hoc: (lop.LichHocChiTiet ?? []).map(formatLichHoc),
});

const formatList = (list) => list.map(formatLopHocPhan);

module.exports = { formatLopHocPhan, formatList, formatLichHoc };
