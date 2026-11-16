const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHocNhomService } = require("../src/services/HocNhomService");

const start = "2026-11-16T20:00";
const end = "2026-11-16T21:00";
const input = {
  chu_de: "Ôn JOIN và GROUP BY",
  bat_dau: start,
  ket_thuc: end,
  link_meet: "https://meet.google.com/abc-defg-hij",
};

function fixture() {
  const scopes = {
    A: { ma_mon_hoc: "CSDL", id_hoc_ky: 1 },
    B: { ma_mon_hoc: "CSDL", id_hoc_ky: 1 },
    C: { ma_mon_hoc: "WEB", id_hoc_ky: 1 },
    D: { ma_mon_hoc: "CSDL", id_hoc_ky: 1 },
    E: { ma_mon_hoc: "CSDL", id_hoc_ky: 2 },
    F: { ma_mon_hoc: "CSDL", id_hoc_ky: 1 },
  };
  const registrations = Object.entries(scopes).map(([student, scope], index) => ({
    id_dang_ky: index + 1,
    ma_sinh_vien: student,
    ma_lop_hoc: `LHP-${student}`,
    trang_thai: student === "D" ? "cho_duyet" : "da_duyet",
    LopHocPhan: scope,
  }));
  const meetings = [];
  const interests = [];
  const notifications = [];
  let clock = new Date("2026-11-16T19:50+07:00");

  function includesRecord(record, where) {
    return Object.entries(where).every(([key, value]) => {
      if (key === "OR") return value.some(option => includesRecord(record, option));
      const field = record[key];
      if (!value || typeof value !== "object") return field === value;
      if ("lte" in value) return field <= value.lte;
      if ("gt" in value) return field > value.gt;
      if ("in" in value) return value.in.includes(field);
      return field && includesRecord(field, value);
    });
  }

  const db = {
    $transaction: async run => run(db),
    sinhVien: {
      findUnique: async ({ where }) => ({
        ma_sinh_vien: registrations[where.id_nguoi_dung - 1]?.ma_sinh_vien,
        TaiKhoan: { trang_thai: where.id_nguoi_dung !== 6 },
      }),
    },
    danhSachDangKy: {
      findFirst: async ({ where }) => registrations.find(row => includesRecord(row, where)),
      findMany: async ({ where }) => registrations.filter(row => includesRecord(row, where)),
    },
    buoiHocNhom: {
      create: async ({ data }) => {
        const row = { id: meetings.length + 1, ...data, phien_lich: 1, huy_luc: null };
        meetings.push(row);
        return row;
      },
      findUnique: async ({ where }) => meetings.find(item => item.id === where.id),
      update: async ({ where, data }) => {
        const row = meetings.find(item => item.id === where.id);
        const revision = row.phien_lich + (data.phien_lich?.increment ?? 0);
        return Object.assign(row, data, { phien_lich: revision });
      },
      findMany: async ({ where, include }) => {
        const { QuanTam, ...filters } = where;
        return meetings.filter(row => includesRecord(row, filters) &&
          (!QuanTam || interests.some(interest => interest.id_buoi === row.id &&
            includesRecord(interest, QuanTam.some))))
          .map(row => include ? {
            ...row,
            ChuTri: { ho_ten: "Nguyễn Ngọc Lan" },
            QuanTam: interests.filter(x => x.id_buoi === row.id && includesRecord(x, include.QuanTam.where)),
          } : row);
      },
    },
    quanTamHocNhom: {
      findMany: async ({ where }) => interests.filter(record => includesRecord(record, where)),
      createMany: async ({ data, skipDuplicates }) => {
        assert.equal(skipDuplicates, true);
        for (const item of data) {
          if (!interests.some(record => includesRecord(record, item))) interests.push(item);
        }
      },
      deleteMany: async ({ where }) => {
        const index = interests.findIndex(record => includesRecord(record, where));
        if (index >= 0) interests.splice(index, 1);
      },
    },
    thongBaoHocNhom: {
      createMany: async ({ data, skipDuplicates }) => {
        assert.equal(skipDuplicates, true);
        for (const item of data) {
          const { id_buoi, ma_sinh_vien, loai, phien_lich } = item;
          if (notifications.some(row => includesRecord(row, { id_buoi, ma_sinh_vien, loai, phien_lich }))) continue;
          notifications.push({ id: notifications.length + 1, ...item, doc_luc: null });
        }
      },
      findMany: async ({ where }) => notifications
        .map(row => ({ ...row, Buoi: meetings.find(item => item.id === row.id_buoi) }))
        .filter(row => includesRecord(row, where)),
      updateMany: async ({ where, data }) => {
        for (const row of notifications.filter(item => includesRecord(item, where))) Object.assign(row, data);
      },
    },
  };
  return {
    service: createHocNhomService(db, () => clock),
    setTime: timestamp => { clock = new Date(timestamp + "+07:00"); },
    registrations,
    interests,
  };
}

const status = code => error => error.status === code;

test("Hai lớp khác nhau cùng môn và kỳ dùng chung danh sách; các trường hợp ngoài phạm vi bị chặn", async () => {
  const { service, registrations } = fixture();
  assert.notEqual(registrations[0].ma_lop_hoc, registrations[1].ma_lop_hoc);
  const { id } = await service.create("A", "CSDL", 1, input);
  const [meeting] = await service.list("B", "CSDL", 1);
  assert.equal(meeting.id, id);
  assert.equal(meeting.chu_tri, "Nguyễn Ngọc Lan");
  assert.equal(meeting.bat_dau.toISOString(), "2026-11-16T13:00:00.000Z");
  assert.equal(meeting.chu_tri_cua_toi, false);
  assert.equal(Object.hasOwn(meeting, "link_meet"), false);
  for (const student of ["C", "D", "E"]) {
    await assert.rejects(service.list(student, "CSDL", 1), status(403));
    await assert.rejects(service.create(student, "CSDL", 1, input), status(403));
    await assert.rejects(service.join(student, id), status(403));
  }
  await assert.rejects(service.update("B", id, input), status(403));
  await assert.rejects(service.cancel("B", id), status(403));
  assert.equal(await service.student(1), "A");
  await assert.rejects(service.student(6), status(403));
});

test("Chặn link ngoài Google Meet và ngày, giờ sai", async () => {
  const { service } = fixture();
  for (const invalid of [
    { link_meet: "https://meet.google.com.example.com/abc-defg-hij" },
    { link_meet: "http://meet.google.com/abc-defg-hij" },
    { bat_dau: "2026-11-31T20:00" },
    { bat_dau: "2026-11-16T19:40" },
    { ket_thuc: start },
  ]) {
    await assert.rejects(service.create("A", "CSDL", 1, { ...input, ...invalid }), status(400));
  }
});

test("Cửa sổ mở chính xác từ T-5 phút đến trước giờ kết thúc", async () => {
  const { service, setTime } = fixture();
  const { id } = await service.create("A", "CSDL", 1, input);
  setTime("2026-11-16T19:54:59.999");
  await assert.rejects(service.join("B", id), status(409));
  assert.equal((await service.list("B", "CSDL", 1))[0].trang_thai, "sap_dien_ra");
  setTime("2026-11-16T19:55:00");
  assert.equal((await service.join("B", id)).link_meet, input.link_meet);
  assert.equal((await service.list("B", "CSDL", 1))[0].trang_thai, "mo_phong");
  setTime("2026-11-16T20:59:59.999");
  assert.equal((await service.join("B", id)).link_meet, input.link_meet);
  setTime("2026-11-16T21:00:00");
  await assert.rejects(service.join("B", id), status(409));
  assert.equal((await service.list("B", "CSDL", 1))[0].trang_thai, "da_ket_thuc");
});

test("Quan tâm và tải lại idempotent; đổi lịch, hủy và đã đọc được lưu", async () => {
  const { service, setTime, interests, registrations } = fixture();
  const { id } = await service.create("A", "CSDL", 1, input);
  await Promise.all([service.follow("B", id, true), service.follow("B", id, true)]);
  await service.follow("F", id, true);
  await service.follow("F", id, false);
  await service.follow("F", id, false);
  assert.equal(interests.length, 1);
  assert.equal((await service.inbox("B")).length, 0);
  setTime("2026-11-16T19:55");
  assert.deepEqual((await service.inbox("B")).map(row => row.loai), ["mo_phong"]);
  assert.equal((await service.inbox("B")).length, 1);
  assert.equal((await service.inbox("F")).length, 0);

  await service.update("A", id, { ...input, bat_dau: "2026-11-16T20:30", link_meet: "" });
  await assert.rejects(service.join("B", id), status(409));
  assert.deepEqual((await service.inbox("B")).map(row => row.loai), ["mo_phong", "doi_lich"]);
  setTime("2026-11-16T20:25");
  assert.equal((await service.join("B", id)).link_meet, input.link_meet);
  assert.deepEqual((await service.inbox("B")).map(row => row.loai), ["mo_phong", "doi_lich", "mo_phong"]);

  await service.cancel("A", id);
  await service.cancel("A", id);
  await assert.rejects(service.join("B", id), status(409));
  assert.equal((await service.list("B", "CSDL", 1))[0].trang_thai, "da_huy");
  const inbox = await service.inbox("B");
  assert.deepEqual(inbox.map(row => row.loai), ["mo_phong", "doi_lich", "mo_phong", "huy"]);
  await service.markRead("F", [inbox[0].id]);
  assert.equal((await service.inbox("B"))[0].doc_luc, null);
  await service.markRead("B", inbox.map(row => row.id));
  assert.ok((await service.inbox("B")).every(row => row.doc_luc));
  registrations.find(row => row.ma_sinh_vien === "B").trang_thai = "da_huy";
  await assert.rejects(service.join("B", id), status(403));
  assert.deepEqual(await service.inbox("B"), []);
});
