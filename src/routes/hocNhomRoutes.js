const router = require("express").Router();
const { authenticate, authorize } = require("../middlewares/errorHandler");
const { createHocNhomService } = require("../services/HocNhomService");
const service = createHocNhomService();

router.use(authenticate, authorize("sinh_vien"));
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function action(run, status = 200) {
  return async (req, res, next) => {
    try {
      const student = await service.student(req.user.id_nguoi_dung);
      const data = await run(student, req);
      res.status(status).json({ success: true, data, gio_may_chu: new Date() });
    } catch (error) {
      next(error);
    }
  };
}

const coursePath = "/mon/:mon/hoc-ky/:ky";
router.get(coursePath, action((student, { params }) =>
  service.list(student, params.mon, params.ky)));
router.post(coursePath, action((student, { params, body }) =>
  service.create(student, params.mon, params.ky, body ?? {}), 201));

router.post("/thong-bao/dong-bo", action(student => service.inbox(student)));
router.patch("/thong-bao/da-doc", action((student, { body }) =>
  service.markRead(student, body?.ids)));

router.put("/:id", action((student, { params, body }) =>
  service.update(student, params.id, body ?? {})));
router.delete("/:id", action((student, { params }) =>
  service.cancel(student, params.id)));
router.put("/:id/quan-tam", action((student, { params }) =>
  service.follow(student, params.id, true)));
router.delete("/:id/quan-tam", action((student, { params }) =>
  service.follow(student, params.id, false)));
router.get("/:id/vao-phong", action((student, { params }) =>
  service.join(student, params.id)));

module.exports = router;
