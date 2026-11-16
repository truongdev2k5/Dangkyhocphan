// src/controllers/AuthController.js
const AuthService = require("../services/AuthService");

const LoginAttempts = require("../services/LoginAttempts");
const loginAttempts = new LoginAttempts();

class AuthController {
  async login(req, res, next) {
    try {
      const { ten_dang_nhap, mat_khau } = req.body;
      if (typeof ten_dang_nhap !== "string" || !ten_dang_nhap.trim() ||
          typeof mat_khau !== "string" || !mat_khau)
        return res
          .status(400)
          .json({
            success: false,
            message: "Thiếu tên đăng nhập hoặc mật khẩu",
          });
      const data = await loginAttempts.run(JSON.stringify([req.ip, ten_dang_nhap.trim().normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()]),
        () => AuthService.login(ten_dang_nhap, mat_khau));
      res.json({ success: true, data });
    } catch (err) {
      if (err.status === 429) {
        res.set("Retry-After", String(err.retryAfter));
        return res.status(429).json({ success: false, message: err.message, retryAfter: err.retryAfter });
      }
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
