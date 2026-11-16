require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/database");

async function main() {
  const password = process.env.STUDY_DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Đặt STUDY_DEMO_PASSWORD dài ít nhất 8 ký tự cho tài khoản demo.");
  }

  const hash = await bcrypt.hash(password, 10);
  const accounts = await prisma.$transaction(async tx => {
    let semester = await tx.hocKy.findFirst({
      where: { dang_kich_hoat: true },
      orderBy: { id_hoc_ky: "desc" },
    });
    if (!semester) {
      const now = new Date();
      const year = now.getUTCFullYear();
      semester = await tx.hocKy.create({
        data: {
          ten_hoc_ky: "Học kỳ demo",
          nam_hoc: `${year}-${year + 1}`,
          ngay_bat_dau_dk: new Date(Date.UTC(year, now.getUTCMonth(), 1)),
          ngay_ket_thuc_dk: new Date(Date.UTC(year, now.getUTCMonth() + 1, 1)),
          dang_kich_hoat: true,
        },
      });
    }

    const role = await tx.vaiTro.upsert({
      where: { ten_vai_tro: "sinh_vien" },
      update: {},
      create: { ten_vai_tro: "sinh_vien" },
    });
    const major = await tx.chuyenNganh.upsert({
      where: { ma_chuyen_nganh: "HN-DEMO" },
      update: {},
      create: { ma_chuyen_nganh: "HN-DEMO", ten_chuyen_nganh: "Công nghệ thông tin (demo)" },
    });
    const course = await tx.monHoc.upsert({
      where: { ma_mon_hoc: "HN-CSDL" },
      update: {},
      create: { ma_mon_hoc: "HN-CSDL", ten_mon_hoc: "Cơ sở dữ liệu (học nhóm)", so_tin_chi: 3 },
    });
    const people = [
      { code: "HNDEMO01", name: "Nguyễn Ngọc Lan", group: "A" },
      { code: "HNDEMO02", name: "Trần Gia Minh", group: "B" },
    ];

    for (const { code, name, group } of people) {
      const account = await tx.taiKhoan.upsert({
        where: { ten_dang_nhap: code },
        update: {},
        create: { ten_dang_nhap: code, id_vai_tro: role.id_vai_tro, mat_khau: hash },
      });
      await tx.sinhVien.upsert({
        where: { ma_sinh_vien: code },
        update: {},
        create: {
          ma_sinh_vien: code, ho_ten: name, id_nguoi_dung: account.id_nguoi_dung,
          ma_chuyen_nganh: major.ma_chuyen_nganh,
        },
      });
      const classCode = `HN-${semester.id_hoc_ky}-${group}`;
      await tx.lopHocPhan.upsert({
        where: { ma_lop_hoc: classCode },
        update: {},
        create: {
          ma_lop_hoc: classCode, ma_mon_hoc: course.ma_mon_hoc, id_hoc_ky: semester.id_hoc_ky,
          so_luong_toi_da: 30, so_luong_con_trong: 30,
        },
      });
      const key = { ma_sinh_vien: code, ma_lop_hoc: classCode };
      const existing = await tx.danhSachDangKy.findUnique({
        where: { ma_sinh_vien_ma_lop_hoc: key },
      });
      if (!existing) {
        await tx.danhSachDangKy.create({ data: { ...key, trang_thai: "da_duyet" } });
        await tx.lopHocPhan.update({
          where: { ma_lop_hoc: classCode },
          data: { so_luong_con_trong: { decrement: 1 } },
        });
      }
    }
    return people.map(person => person.code);
  }, { isolationLevel: "Serializable" });

  console.log("Tài khoản sinh viên đã chuẩn bị:", accounts.join(", "));
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
