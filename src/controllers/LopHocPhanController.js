// src/controllers/LopHocPhanController.js
const LopHocPhanService = require("../services/LopHocPhanService");
const { formatLopHocPhan, formatList } = require("../views/LopHocPhanView");

class LopHocPhanController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, ...query } = req.query;
      const result = await LopHocPhanService.getAll({
        ...query,
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

  async getOne(req, res, next) {
    try {
      const lop = await LopHocPhanService.getOne(req.params.ma);
      res.json({ success: true, data: formatLopHocPhan(lop) });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const lop = await LopHocPhanService.create(req.body);
      res.status(201).json({ success: true, data: formatLopHocPhan(lop) });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const lop = await LopHocPhanService.update(req.params.ma, req.body);
      res.json({ success: true, data: formatLopHocPhan(lop) });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await LopHocPhanService.delete(req.params.ma);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async setCauHinhTinChi(req, res, next) {
    try {
      const rawId = req.params.id_hoc_ky || req.params.id || req.body.id_hoc_ky;
      const id_hoc_ky = parseInt(rawId, 10);
      if (!id_hoc_ky || Number.isNaN(id_hoc_ky) || id_hoc_ky < 1) {
        return res
          .status(400)
          .json({ success: false, message: "Tham số id_hoc_ky không hợp lệ" });
      }

      const rawTinChi = req.body.tin_chi_toi_da ?? req.body.so_tin_chi_toi_da;
      const tin_chi_toi_da = Number(rawTinChi);
      if (!Number.isInteger(tin_chi_toi_da) || tin_chi_toi_da <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Tín chỉ tối đa phải là số nguyên dương" });
      }

      const data = await LopHocPhanService.setCauHinhTinChi(
        id_hoc_ky,
        tin_chi_toi_da,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getCauHinhTinChi(req, res, next) {
    try {
      const rawId = req.params.id_hoc_ky || req.params.id;
      const id_hoc_ky = parseInt(rawId, 10);
      if (!id_hoc_ky || Number.isNaN(id_hoc_ky) || id_hoc_ky < 1) {
        return res
          .status(400)
          .json({ success: false, message: "Tham số id_hoc_ky không hợp lệ" });
      }

      const data = await LopHocPhanService.getCauHinhTinChi(id_hoc_ky);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LopHocPhanController();
