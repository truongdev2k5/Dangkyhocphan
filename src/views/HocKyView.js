// src/views/HocKyView.js

const formatHocKy = (hk) => ({
  id_hoc_ky: hk.id_hoc_ky,
  ten_hoc_ky: hk.ten_hoc_ky,
  nam_hoc: hk.nam_hoc,
  ngay_bat_dau_dk: hk.ngay_bat_dau_dk,
  ngay_ket_thuc_dk: hk.ngay_ket_thuc_dk,
  dang_kich_hoat: hk.dang_kich_hoat,
});

const formatList = (list) => list.map(formatHocKy);

module.exports = { formatHocKy, formatList };
