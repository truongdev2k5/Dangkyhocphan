// src/routes/monHocRoutes.js
const router = require("express").Router();
const MonHocController = require("../controllers/MonHocController");
const { authenticate, authorize } = require("../middlewares/errorHandler");

router.get("/", MonHocController.getAll);
router.get("/:ma", MonHocController.getOne);
router.post("/", authenticate, authorize("admin"), MonHocController.create);
router.put("/:ma", authenticate, authorize("admin"), MonHocController.update);
router.delete(
  "/:ma",
  authenticate,
  authorize("admin"),
  MonHocController.delete,
);

module.exports = router;
