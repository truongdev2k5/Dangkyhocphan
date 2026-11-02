// src/controllers/AuthController.js
const AuthService = require("../services/AuthService");

class AuthController {
  async login(req, res, next) {
    try {
      const { ten_dang_nhap, mat_khau } = req.body;
      if (!ten_dang_nhap || !mat_khau)
        return res
          .status(400)
          .json({
            success: false,
            message: "Thiếu tên đăng nhập hoặc mật khẩu",
          });
      const data = await AuthService.login(ten_dang_nhap, mat_khau);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const data = await AuthService.register(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async doiMatKhau(req, res, next) {
    try {
      const { mat_khau_cu, mat_khau_moi } = req.body;
      const data = await AuthService.doiMatKhau(
        req.user.id_nguoi_dung,
        mat_khau_cu,
        mat_khau_moi,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async setTrangThai(req, res, next) {
    try {
      const data = await AuthService.setTrangThai(
        Number(req.params.id),
        req.body.trang_thai,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async resetMatKhau(req, res, next) {
    try {
      const { mat_khau_moi } = req.body;
      const data = await AuthService.resetMatKhau(
        Number(req.params.id),
        mat_khau_moi,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  me(req, res) {
    res.json({ success: true, data: req.user });
  }
}

module.exports = new AuthController();
