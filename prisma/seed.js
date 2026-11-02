// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function toDate(year, month, day) {
  return new Date(year, month - 1, day);
}

async function main() {
  const hash = async (plain) => bcrypt.hash(plain, 10);

  // 1) Roles
  const adminRole = await prisma.vaiTro.upsert({
    where: { ten_vai_tro: "admin" },
    update: {},
    create: { ten_vai_tro: "admin" },
  });
  const svRole = await prisma.vaiTro.upsert({
    where: { ten_vai_tro: "sinh_vien" },
    update: {},
    create: { ten_vai_tro: "sinh_vien" },
  });

  // 2) Admin account
  await prisma.taiKhoan.upsert({
    where: { ten_dang_nhap: "admin" },
    update: {},
    create: {
      ten_dang_nhap: "admin",
      mat_khau: await hash("Admin@123"),
      id_vai_tro: adminRole.id_vai_tro,
    },
  });

  // 3) Majors
  const chuyenNganhData = [
    { ma_chuyen_nganh: "CNTT", ten_chuyen_nganh: "Cong nghe thong tin" },
    { ma_chuyen_nganh: "KTPM", ten_chuyen_nganh: "Ky thuat phan mem" },
    { ma_chuyen_nganh: "HTTT", ten_chuyen_nganh: "He thong thong tin" },
  ];
  for (const item of chuyenNganhData) {
    await prisma.chuyenNganh.upsert({
      where: { ma_chuyen_nganh: item.ma_chuyen_nganh },
      update: item,
      create: item,
    });
  }

  // 4) Subjects
  const monHocData = [
    { ma_mon_hoc: "MH001", ten_mon_hoc: "Toan cao cap", so_tin_chi: 3, la_mon_chung: 1 },
    { ma_mon_hoc: "MH002", ten_mon_hoc: "Lap trinh C", so_tin_chi: 4, la_mon_chung: 0 },
    { ma_mon_hoc: "MH003", ten_mon_hoc: "Co so du lieu", so_tin_chi: 4, la_mon_chung: 0 },
    { ma_mon_hoc: "MH004", ten_mon_hoc: "Mang may tinh", so_tin_chi: 3, la_mon_chung: 0 },
    { ma_mon_hoc: "MH005", ten_mon_hoc: "Phan tich va thiet ke he thong", so_tin_chi: 2, la_mon_chung: 0 },
    { ma_mon_hoc: "MH006", ten_mon_hoc: "Java co ban", so_tin_chi: 3, la_mon_chung: 0 },
    { ma_mon_hoc: "MH007", ten_mon_hoc: "Lap trinh Web", so_tin_chi: 3, la_mon_chung: 0 },
    { ma_mon_hoc: "MH008", ten_mon_hoc: "Cau truc du lieu va giai thuat", so_tin_chi: 4, la_mon_chung: 0 },
    { ma_mon_hoc: "MH009", ten_mon_hoc: "He dieu hanh", so_tin_chi: 3, la_mon_chung: 0 },
    { ma_mon_hoc: "MH010", ten_mon_hoc: "Kiem thu phan mem", so_tin_chi: 3, la_mon_chung: 0 },
    { ma_mon_hoc: "MH011", ten_mon_hoc: "Tri tue nhan tao", so_tin_chi: 3, la_mon_chung: 0 },
    { ma_mon_hoc: "MH012", ten_mon_hoc: "An toan thong tin", so_tin_chi: 3, la_mon_chung: 0 },
  ];
  for (const item of monHocData) {
    await prisma.monHoc.upsert({
      where: { ma_mon_hoc: item.ma_mon_hoc },
      update: item,
      create: item,
    });
  }

  // 5) Lecturers
  const giangVienData = [
    {
      ma_giang_vien: "GV001",
      ho_ten: "Nguyen Van A",
      email: "a@university.edu",
      so_dien_thoai: "0901000001",
      khoa: "CNTT",
    },
    {
      ma_giang_vien: "GV002",
      ho_ten: "Tran Thi B",
      email: "b@university.edu",
      so_dien_thoai: "0901000002",
      khoa: "KTPM",
    },
    {
      ma_giang_vien: "GV003",
      ho_ten: "Le Van C",
      email: "c@university.edu",
      so_dien_thoai: "0901000003",
      khoa: "HTTT",
    },
  ];
  for (const item of giangVienData) {
    await prisma.giangVien.upsert({
      where: { ma_giang_vien: item.ma_giang_vien },
      update: item,
      create: item,
    });
  }

  // 6) Semesters (one active now + one upcoming)
  const now = new Date();
  const y = now.getFullYear();

  const hk1 = await prisma.hocKy.upsert({
    where: { id_hoc_ky: 1 },
    update: {
      ten_hoc_ky: "HK1",
      nam_hoc: `${y}-${y + 1}`,
      ngay_bat_dau_dk: toDate(y, now.getMonth() + 1, Math.max(1, now.getDate() - 15)),
      ngay_ket_thuc_dk: toDate(y, now.getMonth() + 2, 15),
      dang_kich_hoat: true,
    },
    create: {
      ten_hoc_ky: "HK1",
      nam_hoc: `${y}-${y + 1}`,
      ngay_bat_dau_dk: toDate(y, now.getMonth() + 1, Math.max(1, now.getDate() - 15)),
      ngay_ket_thuc_dk: toDate(y, now.getMonth() + 2, 15),
      dang_kich_hoat: true,
    },
  });

  const hk2 = await prisma.hocKy.upsert({
    where: { id_hoc_ky: 2 },
    update: {
      ten_hoc_ky: "HK2",
      nam_hoc: `${y}-${y + 1}`,
      ngay_bat_dau_dk: toDate(y, now.getMonth() + 3, 1),
      ngay_ket_thuc_dk: toDate(y, now.getMonth() + 4, 15),
      dang_kich_hoat: false,
    },
    create: {
      ten_hoc_ky: "HK2",
      nam_hoc: `${y}-${y + 1}`,
      ngay_bat_dau_dk: toDate(y, now.getMonth() + 3, 1),
      ngay_ket_thuc_dk: toDate(y, now.getMonth() + 4, 15),
      dang_kich_hoat: false,
    },
  });

  // 7) Credit config
  await prisma.cauHinhTinChi.upsert({
    where: { id_hoc_ky: hk1.id_hoc_ky },
    update: { tin_chi_toi_da: 24 },
    create: { id_hoc_ky: hk1.id_hoc_ky, tin_chi_toi_da: 24 },
  });

  // 8) Classes
  const lopHocPhanData = [
    { ma_lop_hoc: "LHP001", ma_mon_hoc: "MH001", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV001", phong_hoc: "P101", so_luong_toi_da: 40, so_luong_con_trong: 40, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP002", ma_mon_hoc: "MH002", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV001", phong_hoc: "P102", so_luong_toi_da: 35, so_luong_con_trong: 35, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP003", ma_mon_hoc: "MH003", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV002", phong_hoc: "P103", so_luong_toi_da: 30, so_luong_con_trong: 30, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP004", ma_mon_hoc: "MH004", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV003", phong_hoc: "P104", so_luong_toi_da: 25, so_luong_con_trong: 25, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP005", ma_mon_hoc: "MH005", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV003", phong_hoc: "P105", so_luong_toi_da: 30, so_luong_con_trong: 30, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP006", ma_mon_hoc: "MH006", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV001", phong_hoc: "P106", so_luong_toi_da: 40, so_luong_con_trong: 40, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP007", ma_mon_hoc: "MH007", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV002", phong_hoc: "P107", so_luong_toi_da: 35, so_luong_con_trong: 35, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP008", ma_mon_hoc: "MH008", id_hoc_ky: hk1.id_hoc_ky, ma_giang_vien: "GV003", phong_hoc: "P108", so_luong_toi_da: 30, so_luong_con_trong: 30, ngay_bat_dau: toDate(y, now.getMonth() + 1, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 3, 15) },
    { ma_lop_hoc: "LHP009", ma_mon_hoc: "MH009", id_hoc_ky: hk2.id_hoc_ky, ma_giang_vien: "GV001", phong_hoc: "P201", so_luong_toi_da: 30, so_luong_con_trong: 30, ngay_bat_dau: toDate(y, now.getMonth() + 3, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 5, 15) },
    { ma_lop_hoc: "LHP010", ma_mon_hoc: "MH010", id_hoc_ky: hk2.id_hoc_ky, ma_giang_vien: "GV002", phong_hoc: "P202", so_luong_toi_da: 30, so_luong_con_trong: 30, ngay_bat_dau: toDate(y, now.getMonth() + 3, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 5, 15) },
    { ma_lop_hoc: "LHP011", ma_mon_hoc: "MH011", id_hoc_ky: hk2.id_hoc_ky, ma_giang_vien: "GV003", phong_hoc: "P203", so_luong_toi_da: 30, so_luong_con_trong: 30, ngay_bat_dau: toDate(y, now.getMonth() + 3, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 5, 15) },
    { ma_lop_hoc: "LHP012", ma_mon_hoc: "MH012", id_hoc_ky: hk2.id_hoc_ky, ma_giang_vien: "GV001", phong_hoc: "P204", so_luong_toi_da: 30, so_luong_con_trong: 30, ngay_bat_dau: toDate(y, now.getMonth() + 3, 1), ngay_ket_thuc: toDate(y, now.getMonth() + 5, 15) },
  ];

  for (const item of lopHocPhanData) {
    await prisma.lopHocPhan.upsert({
      where: { ma_lop_hoc: item.ma_lop_hoc },
      update: item,
      create: item,
    });
  }

  // 9) Schedule
  const lichHocChiTietData = [
    { ma_lop_hoc: "LHP001", thu_trong_tuan: 2, gio_bat_dau: "08:00:00", gio_ket_thuc: "09:30:00" },
    { ma_lop_hoc: "LHP001", thu_trong_tuan: 4, gio_bat_dau: "08:00:00", gio_ket_thuc: "09:30:00" },
    { ma_lop_hoc: "LHP002", thu_trong_tuan: 3, gio_bat_dau: "10:00:00", gio_ket_thuc: "11:30:00" },
    { ma_lop_hoc: "LHP003", thu_trong_tuan: 2, gio_bat_dau: "13:00:00", gio_ket_thuc: "14:30:00" },
    { ma_lop_hoc: "LHP004", thu_trong_tuan: 3, gio_bat_dau: "15:00:00", gio_ket_thuc: "16:30:00" },
    { ma_lop_hoc: "LHP005", thu_trong_tuan: 4, gio_bat_dau: "15:00:00", gio_ket_thuc: "16:30:00" },
    { ma_lop_hoc: "LHP006", thu_trong_tuan: 2, gio_bat_dau: "09:45:00", gio_ket_thuc: "11:15:00" },
    { ma_lop_hoc: "LHP007", thu_trong_tuan: 5, gio_bat_dau: "07:30:00", gio_ket_thuc: "09:00:00" },
    { ma_lop_hoc: "LHP008", thu_trong_tuan: 6, gio_bat_dau: "13:00:00", gio_ket_thuc: "14:30:00" },
    { ma_lop_hoc: "LHP009", thu_trong_tuan: 3, gio_bat_dau: "09:45:00", gio_ket_thuc: "11:15:00" },
    { ma_lop_hoc: "LHP010", thu_trong_tuan: 4, gio_bat_dau: "13:00:00", gio_ket_thuc: "14:30:00" },
    { ma_lop_hoc: "LHP011", thu_trong_tuan: 5, gio_bat_dau: "09:45:00", gio_ket_thuc: "11:15:00" },
    { ma_lop_hoc: "LHP012", thu_trong_tuan: 6, gio_bat_dau: "15:00:00", gio_ket_thuc: "16:30:00" },
  ];

  for (const item of lichHocChiTietData) {
    const existing = await prisma.lichHocChiTiet.findFirst({
      where: {
        ma_lop_hoc: item.ma_lop_hoc,
        thu_trong_tuan: item.thu_trong_tuan,
        gio_bat_dau: item.gio_bat_dau,
        gio_ket_thuc: item.gio_ket_thuc,
      },
    });
    if (!existing) {
      await prisma.lichHocChiTiet.create({ data: item });
    }
  }

  // 10) Student accounts
  const sinhVienData = [
    { ma_sv: "SV001", ho_ten: "Nguyen Van 1", email: "sv1@univ.edu", so_dien_thoai: "0911000001", ma_chuyen_nganh: "CNTT" },
    { ma_sv: "SV002", ho_ten: "Nguyen Van 2", email: "sv2@univ.edu", so_dien_thoai: "0911000002", ma_chuyen_nganh: "KTPM" },
    { ma_sv: "SV003", ho_ten: "Tran Thi 3", email: "sv3@univ.edu", so_dien_thoai: "0911000003", ma_chuyen_nganh: "HTTT" },
    { ma_sv: "SV004", ho_ten: "Tran Thi 4", email: "sv4@univ.edu", so_dien_thoai: "0911000004", ma_chuyen_nganh: "CNTT" },
    { ma_sv: "SV005", ho_ten: "Le Van 5", email: "sv5@univ.edu", so_dien_thoai: "0911000005", ma_chuyen_nganh: "HTTT" },
  ];

  for (const student of sinhVienData) {
    const account = await prisma.taiKhoan.upsert({
      where: { ten_dang_nhap: student.ma_sv },
      update: {},
      create: {
        ten_dang_nhap: student.ma_sv,
        mat_khau: await hash("Sinhvien@123"),
        id_vai_tro: svRole.id_vai_tro,
      },
    });

    await prisma.sinhVien.upsert({
      where: { ma_sinh_vien: student.ma_sv },
      update: {
        ho_ten: student.ho_ten,
        email: student.email,
        so_dien_thoai: student.so_dien_thoai,
        ma_chuyen_nganh: student.ma_chuyen_nganh,
        id_nguoi_dung: account.id_nguoi_dung,
      },
      create: {
        ma_sinh_vien: student.ma_sv,
        ho_ten: student.ho_ten,
        email: student.email,
        so_dien_thoai: student.so_dien_thoai,
        ma_chuyen_nganh: student.ma_chuyen_nganh,
        id_nguoi_dung: account.id_nguoi_dung,
      },
    });
  }

  // 11) Sample registrations
  const dangKyData = [
    { ma_sinh_vien: "SV001", ma_lop_hoc: "LHP001", trang_thai: "cho_duyet", ghi_chu_tu_choi: null },
    { ma_sinh_vien: "SV002", ma_lop_hoc: "LHP002", trang_thai: "da_duyet", ghi_chu_tu_choi: null },
    { ma_sinh_vien: "SV003", ma_lop_hoc: "LHP003", trang_thai: "da_huy", ghi_chu_tu_choi: "Qua han dang ky" },
    { ma_sinh_vien: "SV004", ma_lop_hoc: "LHP006", trang_thai: "cho_duyet", ghi_chu_tu_choi: null },
    { ma_sinh_vien: "SV005", ma_lop_hoc: "LHP007", trang_thai: "tu_choi", ghi_chu_tu_choi: "Khong dat dieu kien mon tien quyet" },
  ];

  for (const dk of dangKyData) {
    await prisma.danhSachDangKy.upsert({
      where: {
        ma_sinh_vien_ma_lop_hoc: {
          ma_sinh_vien: dk.ma_sinh_vien,
          ma_lop_hoc: dk.ma_lop_hoc,
        },
      },
      update: {
        trang_thai: dk.trang_thai,
        ghi_chu_tu_choi: dk.ghi_chu_tu_choi,
      },
      create: {
        ma_sinh_vien: dk.ma_sinh_vien,
        ma_lop_hoc: dk.ma_lop_hoc,
        trang_thai: dk.trang_thai,
        ghi_chu_tu_choi: dk.ghi_chu_tu_choi,
      },
    });
  }

  // 12) Sync seats by approved count
  const allClasses = await prisma.lopHocPhan.findMany({
    select: { ma_lop_hoc: true, so_luong_toi_da: true },
  });
  for (const lop of allClasses) {
    const approved = await prisma.danhSachDangKy.count({
      where: { ma_lop_hoc: lop.ma_lop_hoc, trang_thai: "da_duyet" },
    });
    await prisma.lopHocPhan.update({
      where: { ma_lop_hoc: lop.ma_lop_hoc },
      data: { so_luong_con_trong: Math.max(0, lop.so_luong_toi_da - approved) },
    });
  }

  // 13) Seed history if missing
  for (const dk of dangKyData) {
    const exists = await prisma.lichSuDangKy.findFirst({
      where: {
        ma_sinh_vien: dk.ma_sinh_vien,
        ma_lop_hoc: dk.ma_lop_hoc,
        trang_thai_moi: dk.trang_thai,
      },
    });
    if (!exists) {
      await prisma.lichSuDangKy.create({
        data: {
          ma_sinh_vien: dk.ma_sinh_vien,
          ma_lop_hoc: dk.ma_lop_hoc,
          trang_thai_cu: null,
          trang_thai_moi: dk.trang_thai,
        },
      });
    }
  }

  console.log("Seed data completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
