// src/controllers/LichHocController.js
const LichHocService  = require('../services/LichHocService');
const SinhVienService = require('../services/SinhVienService');
const prisma          = require('../config/database');
const { formatSlot }  = require('../views/LichHocView');

class LichHocController {
  async getLichCuaToi(req, res, next) {
    try {
      const { id_hoc_ky } = req.query;
      if (!id_hoc_ky)
        return res.status(400).json({ success: false, message: 'Thiếu tham số id_hoc_ky' });
      const sv   = await SinhVienService.getByNguoiDung(req.user.id_nguoi_dung);
      const data = await LichHocService.getLichHocSinhVien(sv.ma_sinh_vien, id_hoc_ky);
      res.json({ success: true, data: data.map(formatSlot) });
    } catch (err) { next(err); }
  }

  async kiemTraTrung(req, res, next) {
    try {
      const sv      = await SinhVienService.getByNguoiDung(req.user.id_nguoi_dung);
      const xungDot = await LichHocService.kiemTraTrungLich(sv.ma_sinh_vien, req.params.ma_lop);
      res.json({ success: true, trung_lich: xungDot.length > 0, chi_tiet: xungDot });
    } catch (err) { next(err); }
  }

  async themLich(req, res, next) {
    try {
      const { thu_trong_tuan, gio_bat_dau, gio_ket_thuc } = req.body;
      if (gio_bat_dau >= gio_ket_thuc)
        return res.status(400).json({ success: false, message: 'gio_bat_dau phải nhỏ hơn gio_ket_thuc' });
      if (thu_trong_tuan < 2 || thu_trong_tuan > 8)
        return res.status(400).json({ success: false, message: 'thu_trong_tuan phải từ 2 đến 8' });

      const data = await prisma.lichHocChiTiet.create({
        data: { ma_lop_hoc: req.params.ma_lop, thu_trong_tuan, gio_bat_dau, gio_ket_thuc },
      });
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async xoaLich(req, res, next) {
    try {
      await prisma.lichHocChiTiet.delete({ where: { id_lich_hoc: Number(req.params.id) } });
      res.json({ success: true, message: 'Xóa lịch học thành công' });
    } catch (err) { next(err); }
  }
}

module.exports = new LichHocController();
