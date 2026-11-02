// src/views/LichHocView.js
const { getTenThu } = require("../utils/helpers");

const formatSlot = (slot) => ({
  ma_lop_hoc: slot.ma_lop_hoc,
  ten_mon_hoc: slot.ten_mon_hoc ?? null,
  thu: getTenThu(slot.thu_trong_tuan),
  thu_trong_tuan: slot.thu_trong_tuan,
  gio_bat_dau: slot.gio_bat_dau,
  gio_ket_thuc: slot.gio_ket_thuc,
});

module.exports = { formatSlot };
