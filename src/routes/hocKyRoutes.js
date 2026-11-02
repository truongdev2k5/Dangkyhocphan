// src/routes/hocKyRoutes.js
const router = require("express").Router();
const HocKyController = require("../controllers/HocKyController");
const { authenticate, authorize } = require("../middlewares/errorHandler");

router.get("/", authenticate, authorize("admin"), HocKyController.getAll);
router.get(
  "/stats",
  authenticate,
  authorize("admin"),
  HocKyController.getStats,
);
router.get(
  "/dang-hoat-dong",
  authenticate,
  HocKyController.getActive,
);
router.get(
  "/:id/tin-chi",
  authenticate,
  HocKyController.getTinChiConfig,
);
router.get("/:id", authenticate, authorize("admin"), HocKyController.getOne);
router.post("/", authenticate, authorize("admin"), HocKyController.create);
router.put("/:id", authenticate, authorize("admin"), HocKyController.update);
router.delete("/:id", authenticate, authorize("admin"), HocKyController.delete);
router.patch(
  "/:id/kich-hoat",
  authenticate,
  authorize("admin"),
  HocKyController.toggleKichHoat,
);

module.exports = router;
