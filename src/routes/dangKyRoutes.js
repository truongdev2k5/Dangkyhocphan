// src/routes/dangKyRoutes.js
const router = require("express").Router();
const DangKyController = require("../controllers/DangKyController");
const { authenticate, authorize } = require("../middlewares/errorHandler");

// ── Sinh viên ────────────────────────────────────────────────
router.post("/", authenticate, authorize("sinh_vien"), DangKyController.dangKy);
router.delete(
  "/:id",
  authenticate,
  authorize("sinh_vien"),
  DangKyController.huyDangKy,
);
router.get(
  "/cua-toi",
  authenticate,
  authorize("sinh_vien"),
  DangKyController.getDanhSachCuaToi,
);

// ── Admin ────────────────────────────────────────────────────
router.get("/", authenticate, authorize("admin"), DangKyController.getAll);
router.get(
  "/lop/:ma_lop",
  authenticate,
  authorize("admin"),
  DangKyController.getDanhSachCuaLop,
);
router.patch(
  "/:id/duyet",
  authenticate,
  authorize("admin"),
  DangKyController.duyetDangKy,
);
router.patch(
  "/:id/tu-choi",
  authenticate,
  authorize("admin"),
  DangKyController.tuChoiDangKy,
);
router.get(
  "/lich-su",
  authenticate,
  authorize("admin"),
  DangKyController.getLichSu,
);
module.exports = router;
