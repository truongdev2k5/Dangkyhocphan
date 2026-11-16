const prisma = require("../config/database");

const EARLY_JOIN_MS = 5 * 60 * 1000;
const titleError = "Nhập chủ đề từ 1 đến 150 ký tự.";

function positiveId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(String(value)) || id < 1 || id > 2147483647) {
    throw { status: 400, message: "Mã học kỳ hoặc buổi học không hợp lệ." };
  }
  return id;
}

function parseVietnamTime(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw { status: 400, message: "Nhập ngày và giờ theo giờ Việt Nam." };
  }
  const instant = new Date(value + ":00+07:00");
  const local = new Date(instant.getTime() + 7 * 60 * 60 * 1000);
  if (!Number.isFinite(instant.getTime()) || local.toISOString().slice(0, 16) !== value) {
    throw { status: 400, message: "Ngày hoặc giờ không hợp lệ." };
  }
  return instant;
}

function meetLink(value) {
  let url;
  try {
    url = new URL(typeof value === "string" ? value.trim() : "");
  } catch {
    throw { status: 400, message: "Nhập link Google Meet dạng https://meet.google.com/abc-defg-hij." };
  }
  if (url.origin !== "https://meet.google.com" || url.username || url.password ||
      !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i.test(url.pathname)) {
    throw { status: 400, message: "Dùng link cuộc họp hợp lệ từ https://meet.google.com/." };
  }
  return url.origin + url.pathname.replace(/\/$/, "").toLowerCase();
}

function meetingInput(input, current, now) {
  const chu_de = typeof input.chu_de === "string" ? input.chu_de.trim() : "";
  if (!chu_de || chu_de.length > 150) throw { status: 400, message: titleError };
  const bat_dau = parseVietnamTime(input.bat_dau);
  const ket_thuc = parseVietnamTime(input.ket_thuc);
  if (ket_thuc <= bat_dau) {
    throw { status: 400, message: "Giờ kết thúc phải sau giờ bắt đầu." };
  }
  const timeChanged = !current ||
    +current.bat_dau !== +bat_dau || +current.ket_thuc !== +ket_thuc;
  if (timeChanged && bat_dau <= now) {
    throw { status: 400, message: "Chọn giờ bắt đầu trong tương lai." };
  }
  const link_meet = current && input.link_meet === "" ? current.link_meet : meetLink(input.link_meet);
  return { data: { chu_de, bat_dau, ket_thuc, link_meet }, timeChanged };
}

function meetingStatus(meeting, now) {
  if (meeting.huy_luc) return "da_huy";
  if (now >= meeting.ket_thuc) return "da_ket_thuc";
  return +now >= +meeting.bat_dau - EARLY_JOIN_MS ? "mo_phong" : "sap_dien_ra";
}

function serializeMeeting(meeting, student, now) {
  const canManage = meeting.ma_chu_tri === student;
  return {
    id: meeting.id,
    chu_de: meeting.chu_de,
    chu_tri: meeting.ChuTri?.ho_ten ?? "Chủ trì không còn trong hệ thống",
    bat_dau: meeting.bat_dau,
    ket_thuc: meeting.ket_thuc,
    mo_luc: new Date(+meeting.bat_dau - EARLY_JOIN_MS),
    trang_thai: meetingStatus(meeting, now),
    quan_tam: Boolean(meeting.QuanTam?.length),
    chu_tri_cua_toi: canManage,
  };
}

function scopesFor(db, student) {
  return db.danhSachDangKy.findMany({
    where: { ma_sinh_vien: student, trang_thai: "da_duyet" },
    select: { LopHocPhan: { select: { ma_mon_hoc: true, id_hoc_ky: true } } },
  }).then(rows => rows.map(row => row.LopHocPhan));
}

async function requireMembership(db, student, scope) {
  const registration = await db.danhSachDangKy.findFirst({
    where: { ma_sinh_vien: student, trang_thai: "da_duyet", LopHocPhan: scope },
    select: { id_dang_ky: true },
  });
  if (!registration) {
    throw { status: 403, message: "Bạn cần có đăng ký đã duyệt cho môn này trong học kỳ." };
  }
}

async function getMeeting(db, student, id) {
  const meeting = await db.buoiHocNhom.findUnique({ where: { id: positiveId(id) } });
  if (!meeting) throw { status: 404, message: "Không tìm thấy buổi học nhóm." };
  await requireMembership(db, student, { ma_mon_hoc: meeting.ma_mon_hoc, id_hoc_ky: meeting.id_hoc_ky });
  return meeting;
}

function requireHost(meeting, student, now) {
  if (meeting.ma_chu_tri !== student) {
    throw { status: 403, message: "Chỉ người chủ trì được sửa hoặc hủy buổi học." };
  }
  if (meeting.huy_luc || meeting.ket_thuc <= now) {
    throw { status: 409, message: "Buổi học đã hủy hoặc đã kết thúc." };
  }
}

async function serializable(db, action) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(action, { isolationLevel: "Serializable" });
    } catch (error) {
      // MariaDB can report ER_CHECKREAD instead of Prisma's standard write-conflict code.
      const conflict = error.code === "P2034" || error.meta?.code === "1020" ||
        /MysqlError\s*\{\s*code:\s*1020\b/.test(error.message ?? "");
      if (!conflict || attempt >= 3) throw error;
    }
  }
}

function notification(meeting, student, type) {
  return {
    id_buoi: meeting.id,
    ma_sinh_vien: student,
    loai: type,
    phien_lich: meeting.phien_lich,
    chu_de: meeting.chu_de,
    bat_dau: meeting.bat_dau,
  };
}

async function notifyInterested(tx, meeting, type) {
  const followers = await tx.quanTamHocNhom.findMany({
    where: { id_buoi: meeting.id },
    select: { ma_sinh_vien: true },
  });
  if (followers.length) {
    await tx.thongBaoHocNhom.createMany({
      data: followers.map(row => notification(meeting, row.ma_sinh_vien, type)),
      skipDuplicates: true,
    });
  }
}

function createHocNhomService(db = prisma, clock = () => new Date()) {
  return {
    async student(userId) {
      const student = await db.sinhVien.findUnique({
        where: { id_nguoi_dung: userId },
        select: { ma_sinh_vien: true, TaiKhoan: { select: { trang_thai: true } } },
      });
      if (!student?.TaiKhoan?.trang_thai) {
        throw { status: 403, message: "Tài khoản sinh viên không khả dụng." };
      }
      return student.ma_sinh_vien;
    },

    async list(student, course, semester) {
      const scope = { ma_mon_hoc: course, id_hoc_ky: positiveId(semester) };
      await requireMembership(db, student, scope);
      const rows = await db.buoiHocNhom.findMany({
        where: scope,
        orderBy: { bat_dau: "desc" },
        include: {
          ChuTri: { select: { ho_ten: true } },
          QuanTam: { where: { ma_sinh_vien: student }, select: { ma_sinh_vien: true } },
        },
      });
      const now = clock();
      return rows.map(row => serializeMeeting(row, student, now));
    },

    create(student, course, semester, input) {
      const scope = { ma_mon_hoc: course, id_hoc_ky: positiveId(semester) };
      return serializable(db, async tx => {
        await requireMembership(tx, student, scope);
        const { data } = meetingInput(input, null, clock());
        const row = await tx.buoiHocNhom.create({
          data: { ...scope, ...data, ma_chu_tri: student },
        });
        return { id: row.id };
      });
    },

    update(student, id, input) {
      return serializable(db, async tx => {
        const current = await getMeeting(tx, student, id);
        const now = clock();
        requireHost(current, student, now);
        const { data, timeChanged } = meetingInput(input, current, now);
        const updated = await tx.buoiHocNhom.update({
          where: { id: current.id },
          data: { ...data, ...(timeChanged && { phien_lich: { increment: 1 } }) },
        });
        if (timeChanged) await notifyInterested(tx, updated, "doi_lich");
        return { id: updated.id };
      });
    },

    cancel(student, id) {
      return serializable(db, async tx => {
        const current = await getMeeting(tx, student, id);
        if (current.huy_luc && current.ma_chu_tri === student) return { id: current.id };
        const now = clock();
        requireHost(current, student, now);
        const canceled = await tx.buoiHocNhom.update({
          where: { id: current.id },
          data: { huy_luc: now },
        });
        await notifyInterested(tx, canceled, "huy");
        return { id: current.id };
      });
    },

    follow(student, id, enabled) {
      return serializable(db, async tx => {
        const meeting = await getMeeting(tx, student, id);
        const key = { id_buoi: meeting.id, ma_sinh_vien: student };
        if (enabled) {
          if (meeting.huy_luc || meeting.ket_thuc <= clock()) {
            throw { status: 409, message: "Buổi học đã hủy hoặc đã kết thúc." };
          }
          await tx.quanTamHocNhom.createMany({ data: [key], skipDuplicates: true });
        } else {
          await tx.quanTamHocNhom.deleteMany({ where: key });
        }
        return { quan_tam: enabled };
      });
    },

    async join(student, id) {
      const meeting = await getMeeting(db, student, id);
      if (meetingStatus(meeting, clock()) !== "mo_phong") {
        throw { status: 409, message: "Buổi học chưa mở phòng, đã kết thúc hoặc đã hủy." };
      }
      return { link_meet: meeting.link_meet };
    },

    inbox(student) {
      return serializable(db, async tx => {
        const scopes = await scopesFor(tx, student);
        if (!scopes.length) return [];
        const now = clock();
        const openMeetings = await tx.buoiHocNhom.findMany({
          where: {
            OR: scopes,
            huy_luc: null,
            bat_dau: { lte: new Date(+now + EARLY_JOIN_MS) },
            ket_thuc: { gt: now },
            QuanTam: { some: { ma_sinh_vien: student } },
          },
        });
        if (openMeetings.length) {
          await tx.thongBaoHocNhom.createMany({
            data: openMeetings.map(meeting => notification(meeting, student, "mo_phong")),
            skipDuplicates: true,
          });
        }

        return tx.thongBaoHocNhom.findMany({
          where: { ma_sinh_vien: student, Buoi: { OR: scopes } },
          select: {
            id: true, id_buoi: true, loai: true, chu_de: true, bat_dau: true,
            tao_luc: true, doc_luc: true,
            Buoi: { select: { ma_mon_hoc: true, id_hoc_ky: true, MonHoc: { select: { ten_mon_hoc: true } } } },
          },
          orderBy: [{ tao_luc: "desc" }, { id: "desc" }],
          take: 30,
        });
      });
    },

    async markRead(student, ids) {
      if (!Array.isArray(ids) || ids.length > 30) {
        throw { status: 400, message: "Danh sách thông báo không hợp lệ." };
      }
      await db.thongBaoHocNhom.updateMany({
        where: { ma_sinh_vien: student, id: { in: ids.map(positiveId) }, doc_luc: null },
        data: { doc_luc: clock() },
      });
      return null;
    },
  };
}

module.exports = { createHocNhomService };
