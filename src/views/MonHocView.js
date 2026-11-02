// src/views/MonHocView.js
const formatMonHoc = (mh) => ({
  ma_mon_hoc: mh.ma_mon_hoc,
  ten_mon_hoc: mh.ten_mon_hoc,
  so_tin_chi: mh.so_tin_chi,
  la_mon_chung: mh.la_mon_chung,
});

const formatList = (list) => list.map(formatMonHoc);

module.exports = { formatMonHoc, formatList };
