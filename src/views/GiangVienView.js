// src/views/GiangVienView.js

const formatGiangVien = (gv) => ({
  ma_giang_vien: gv.ma_giang_vien,
  ho_ten: gv.ho_ten,
  email: gv.email ?? null,
  so_dien_thoai: gv.so_dien_thoai ?? null,
  khoa: gv.khoa ?? null,
});

const formatList = (list) => list.map(formatGiangVien);

module.exports = { formatGiangVien, formatList };
