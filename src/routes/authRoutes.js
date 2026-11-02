// src/routes/authRoutes.js
const router = require("express").Router();
const AuthController = require("../controllers/AuthController");
const { authenticate, authorize } = require("../middlewares/errorHandler");
const { validateRegister } = require("../middlewares/validate");

router.post("/login", AuthController.login);
router.post(
  "/register",
  authenticate,
  authorize("admin"),
  validateRegister,
  AuthController.register,
);
router.get("/me", authenticate, AuthController.me);
router.put("/doi-mat-khau", authenticate, AuthController.doiMatKhau);
router.patch(
  "/tai-khoan/:id/reset-mat-khau",
  authenticate,
  authorize("admin"),
  AuthController.resetMatKhau,
);

module.exports = router;
