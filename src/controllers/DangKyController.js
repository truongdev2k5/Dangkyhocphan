// src/controllers/DangKyController.js
const DangKyService = require("../services/DangKyService");
const SinhVienService = require("../services/SinhVienService");
const { formatDangKy, formatList } = require("../views/DangKyView");

class DangKyController {
  // ── Sinh viên ──────────────────────────────────────────
  async dangKy(req, res, next) {
    try {
      const sv = await SinhVienService.getByNguoiDung(req.user.id_nguoi_dung);
      const dk = await DangKyService.dangKy(
        sv.ma_sinh_vien,
        req.body.ma_lop_hoc,
      );
      res.status(201).json({ success: true, data: formatDangKy(dk) });
    } catch (err) {
      next(err);
    }
  }

  async huyDangKy(req, res, next) {
    try {
      const sv = await SinhVienService.getByNguoiDung(req.user.id_nguoi_dung);
      const dk = await DangKyService.huyDangKy(
        sv.ma_sinh_vien,
        Number(req.params.id),
      );
      res.json({ success: true, data: formatDangKy(dk) });
    } catch (err) {
      next(err);
    }
  }

  async getDanhSachCuaToi(req, res, next) {
    try {
      const sv = await SinhVienService.getByNguoiDung(req.user.id_nguoi_dung);

      const rawId = req.query.id_hoc_ky || req.query.id;
      const id_hoc_ky = rawId ? parseInt(rawId, 10) : null;
      if (rawId && (!id_hoc_ky || Number.isNaN(id_hoc_ky) || id_hoc_ky < 1)) {
        return res
          .status(400)
          .json({ success: false, message: "Tham số id_hoc_ky không hợp lệ" });
      }

      const list = await DangKyService.getDanhSachCuaSinhVien(
        sv.ma_sinh_vien,
        id_hoc_ky,
      );
      res.json({ success: true, data: formatList(list) });
    } catch (err) {
      next(err);
    }
  }

  // ── Admin ───────────────────────────────────────────────
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, trang_thai } = req.query;
      const result = await DangKyService.getAll(trang_thai, {
        page: Number(page),
        limit: Number(limit),
      });
      res.json({
        success: true,
        data: formatList(result.data),
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDanhSachCuaLop(req, res, next) {
    try {
      const list = await DangKyService.getDanhSachCuaLop(
        req.params.ma_lop,
        req.query.trang_thai,
      );
      res.json({ success: true, data: formatList(list) });
    } catch (err) {
      next(err);
    }
  }

  async duyetDangKy(req, res, next) {
    try {
      const dk = await DangKyService.duyetDangKy(Number(req.params.id));
      res.json({ success: true, data: formatDangKy(dk) });
    } catch (err) {
      next(err);
    }
  }

  async tuChoiDangKy(req, res, next) {
    try {
      const dk = await DangKyService.tuChoiDangKy(
        Number(req.params.id),
        req.body.ghi_chu,
      );
      res.json({ success: true, data: formatDangKy(dk) });
    } catch (err) {
      next(err);
    }
  }

  async getLichSu(req, res, next) {
    try {
      const list = await DangKyService.getLichSu(req.query.q || "");
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DangKyController();
